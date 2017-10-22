'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

exports.addQueryArgs = addQueryArgs;

var _url = require('url');

var _querystring = require('querystring');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Appends arguments to the query string of the url
 *
 * @param  {String} url   URL
 * @param  {Object} args  Query Args
 *
 * @return {String}       Updated URL
 */
/**
 * External dependencies
 */
function addQueryArgs(url, args) {
  var parsedURL = (0, _url.parse)(url, true);
  var query = (0, _extends3.default)({}, parsedURL.query, args);
  delete parsedURL.search;

  return (0, _url.format)((0, _extends3.default)({}, parsedURL, { query: query }));
}