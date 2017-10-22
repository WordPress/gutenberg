'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.speak = exports.setup = undefined;

var _addContainer = require('./addContainer');

var _addContainer2 = _interopRequireDefault(_addContainer);

var _clear = require('./clear');

var _clear2 = _interopRequireDefault(_clear);

var _domReady = require('@wordpress/dom-ready');

var _domReady2 = _interopRequireDefault(_domReady);

var _filterMessage = require('./filterMessage');

var _filterMessage2 = _interopRequireDefault(_filterMessage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create the live regions.
 */
var setup = exports.setup = function setup() {
	var containerPolite = document.getElementById('a11y-speak-polite');
	var containerAssertive = document.getElementById('a11y-speak-assertive');

	if (containerPolite === null) {
		containerPolite = (0, _addContainer2.default)('polite');
	}
	if (containerAssertive === null) {
		containerAssertive = (0, _addContainer2.default)('assertive');
	}
};

/**
 * Run setup on domReady.
 */
(0, _domReady2.default)(setup);

/**
 * Update the ARIA live notification area text node.
 *
 * @param {String} message  The message to be announced by Assistive Technologies.
 * @param {String} ariaLive Optional. The politeness level for aria-live. Possible values:
 *                          polite or assertive. Default polite.
 */
var speak = exports.speak = function speak(message, ariaLive) {
	// Clear previous messages to allow repeated strings being read out.
	(0, _clear2.default)();

	message = (0, _filterMessage2.default)(message);

	var containerPolite = document.getElementById('a11y-speak-polite');
	var containerAssertive = document.getElementById('a11y-speak-assertive');

	if (containerAssertive && 'assertive' === ariaLive) {
		containerAssertive.textContent = message;
	} else if (containerPolite) {
		containerPolite.textContent = message;
	}
};