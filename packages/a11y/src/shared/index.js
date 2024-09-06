/**
 * Internal dependencies
 */
import addContainer from '../shared/add-container';
import addIntroText from '../shared/add-intro-text';
import clear from '../shared/clear';
import filterMessage from '../shared/filter-message';

/**
 * Create the live regions.
 * @param {string} introTextContent The intro text content.
 */
export function makeSetupFunction( introTextContent ) {
	return function setup() {
		const introText = document.getElementById( 'a11y-speak-intro-text' );
		const containerAssertive = document.getElementById(
			'a11y-speak-assertive'
		);
		const containerPolite = document.getElementById( 'a11y-speak-polite' );

		if ( introText === null ) {
			addIntroText( introTextContent );
		}

		if ( containerAssertive === null ) {
			addContainer( 'assertive' );
		}

		if ( containerPolite === null ) {
			addContainer( 'polite' );
		}
	};
}

/**
 * Allows you to easily announce dynamic interface updates to screen readers using ARIA live regions.
 * This module is inspired by the `speak` function in `wp-a11y.js`.
 *
 * @param {string}               message    The message to be announced by assistive technologies.
 * @param {'polite'|'assertive'} [ariaLive] The politeness level for aria-live; default: 'polite'.
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
