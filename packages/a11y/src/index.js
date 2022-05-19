/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import addIntroText from './add-intro-text';
import addContainer from './add-container';
import clear from './clear';
import filterMessage from './filter-message';

/**
 * Create the live regions.
 */
export function setup() {
	const introText = document.getElementById( 'a11y-speak-intro-text' );
	const containerAssertive = document.getElementById(
		'a11y-speak-assertive'
	);
	const containerPolite = document.getElementById( 'a11y-speak-polite' );

	if ( introText === null ) {
		addIntroText();
	}

	if ( containerAssertive === null ) {
		addContainer( 'assertive' );
	}

	if ( containerPolite === null ) {
		addContainer( 'polite' );
	}
}

/**
 * Run setup on domReady.
 */
domReady( setup );

/**
 * Allows you to easily announce dynamic interface updates to screen readers using ARIA live regions.
 * This module is inspired by the `speak` function in `wp-a11y.js`.
 *
 * @param {string} message    The message to be announced by assistive technologies.
 * @param {string} [ariaLive] The politeness level for aria-live; default: 'polite'.
 *
 * @example
 * ```js
 * import { speak } from '@wordpress/a11y';
 *
 * // For polite messages that shouldn't interrupt what screen readers are currently announcing.
 * speak( 'The message you want to send to the ARIA live region' );
 *
 * // For assertive messages that should interrupt what screen readers are currently announcing.
 * speak( 'The message you want to send to the ARIA live region', 'assertive' );
 * ```
 */
export function speak( message, ariaLive ) {
	/*
	 * Clear previous messages to allow repeated strings being read out and hide
	 * the explanatory text from assistive technologies.
	 */
	clear();

	message = filterMessage( message );

	const introText = document.getElementById( 'a11y-speak-intro-text' );
	const containerAssertive = document.getElementById(
		'a11y-speak-assertive'
	);
	const containerPolite = document.getElementById( 'a11y-speak-polite' );

	if ( containerAssertive && ariaLive === 'assertive' ) {
		containerAssertive.textContent = message;
	} else if ( containerPolite ) {
		containerPolite.textContent = message;
	}

	/*
	 * Make the explanatory text available to assistive technologies by removing
	 * the 'hidden' HTML attribute.
	 */
	if ( introText ) {
		introText.removeAttribute( 'hidden' );
	}
}
