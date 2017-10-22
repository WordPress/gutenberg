import addContainer from './addContainer';
import clear from './clear';
import domReady from '@wordpress/dom-ready';
import filterMessage from './filterMessage';

/**
 * Create the live regions.
 */
export var setup = function setup() {
	var containerPolite = document.getElementById('a11y-speak-polite');
	var containerAssertive = document.getElementById('a11y-speak-assertive');

	if (containerPolite === null) {
		containerPolite = addContainer('polite');
	}
	if (containerAssertive === null) {
		containerAssertive = addContainer('assertive');
	}
};

/**
 * Run setup on domReady.
 */
domReady(setup);

/**
 * Update the ARIA live notification area text node.
 *
 * @param {String} message  The message to be announced by Assistive Technologies.
 * @param {String} ariaLive Optional. The politeness level for aria-live. Possible values:
 *                          polite or assertive. Default polite.
 */
export var speak = function speak(message, ariaLive) {
	// Clear previous messages to allow repeated strings being read out.
	clear();

	message = filterMessage(message);

	var containerPolite = document.getElementById('a11y-speak-polite');
	var containerAssertive = document.getElementById('a11y-speak-assertive');

	if (containerAssertive && 'assertive' === ariaLive) {
		containerAssertive.textContent = message;
	} else if (containerPolite) {
		containerPolite.textContent = message;
	}
};