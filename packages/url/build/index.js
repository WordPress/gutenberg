'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /**
                                                                                                                                                                                                                                                                   * External dependencies
                                                                                                                                                                                                                                                                   */


exports.addQueryArgs = addQueryArgs;

var _url = require('url');

var _querystring = require('querystring');

/**
 * Appends arguments to the query string of the url
 *
 * @param  {String} url   URL
 * @param  {Object} args  Query Args
 *
 * @return {String}       Updated URL
 */
function addQueryArgs(url, args) {
  var parsedURL = (0, _url.parse)(url, true);
  var query = _extends({}, parsedURL.query, args);
  delete parsedURL.search;

  return (0, _url.format)(_extends({}, parsedURL, { query: query }));
}