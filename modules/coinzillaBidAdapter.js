import { parseSizesInput } from '../src/utils.js';
import {registerBidder} from '../src/adapters/bidderFactory.js';

/**
 * @typedef {import('../src/adapters/bidderFactory.js').BidRequest} BidRequest
 * @typedef {import('../src/adapters/bidderFactory.js').Bid} Bid
 * @typedef {import('../src/adapters/bidderFactory.js').ServerResponse} ServerResponse
 */

const BIDDER_CODE = 'coinzilla';
const ENDPOINT_URL = 'https://request.czilladx.com/serve/request.php';

export const spec = {
  code: BIDDER_CODE,
  aliases: ['czlla'], // short code

  /**
   * Determines whether or not the given bid request is valid.
   *
   * @param {BidRequest} bid The bid params to validate.
   * @return boolean True if this is a valid bid, and false otherwise.
   */
  isBidRequestValid: function (bid) {
    return !!(bid.params.placementId);
  },

  /**
   * Make a server request from the list of BidRequests.
   *
   * @return Array Info describing the request to the server.
   * @param validBidRequests
   * @param bidderRequest
   */
  buildRequests: function (validBidRequests, bidderRequest) {
    if (validBidRequests.length === 0) {
      return [];
    }
    return validBidRequests.map(bidRequest => {
      const sizes = parseSizesInput(bidRequest.params.size || bidRequest.sizes)[0];
      const width = sizes.split('x')[0];
      const height = sizes.split('x')[1];
      let installed_wallet = '';
      if (typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')) {
        installed_wallet = "ETH";
      }
      if ((typeof window.cardano !== 'undefined')) {
        installed_wallet = "ADA";
      }
      if ((typeof window.BinanceChain !== 'undefined')) {
        installed_wallet = "BNB";
      }
      if ((typeof window.solana !== 'undefined')) {
        installed_wallet = "SOL";
      }
      if ((typeof window.tron !== 'undefined')) {
        installed_wallet = "TRX";
      }
      const payload = {
        placementId: bidRequest.params.placementId,
        width: width,
        height: height,
        bidId: bidRequest.bidId,
        wd: installed_wallet,
        referer: bidderRequest.refererInfo.page,
      };
      return {
        method: 'POST',
        url: ENDPOINT_URL,
        data: payload
      };
    });
  },

  /**
   * Unpack the response from the server into a list of bids.
   *
   * @param {ServerResponse} serverResponse A successful response from the server.
   * @param bidRequest
   * @return {Bid[]} An array of bids which were nested inside the server.
   */
  interpretResponse: function (serverResponse, bidRequest) {
    const bidResponses = [];
    const response = serverResponse.body;
    const creativeId = response.creativeId || 0;
    const width = response.width || 0;
    const height = response.height || 0;
    const cpm = response.cpm || 0;
    if (width !== 0 && height !== 0 && cpm !== 0 && creativeId !== 0) {
      const dealId = response.dealid || '';
      const currency = response.currency || 'EUR';
      const netRevenue = (response.netRevenue === undefined) ? true : response.netRevenue;
      const referrer = bidRequest.data.referer;
      const bidResponse = {
        requestId: response.requestId,
        cpm: cpm,
        width: response.width,
        height: response.height,
        creativeId: creativeId,
        dealId: dealId,
        currency: currency,
        netRevenue: netRevenue,
        ttl: response.timeout,
        referrer: referrer,
        ad: response.ad,
        mediaType: response.mediaType,
        meta: {
          advertiserDomains: response.advertiserDomain || []
        }
      };
      bidResponses.push(bidResponse);
    }
    return bidResponses;
  },
};
registerBidder(spec);
