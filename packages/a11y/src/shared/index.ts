/**
 * Internal dependencies
 */
import filterMessage from './filter-message';
import { enqueuePolite } from './queue';

const CLEAR_FILL_DELAY = 100;

/**
 * Allows you to easily announce dynamic interface updates to screen readers using ARIA live regions.
 * This module is inspired by the `speak` function in `wp-a11y.js`.
 *
 * @param message    The message to be announced by assistive technologies.
 * @param [ariaLive] The politeness level for aria-live; default: 'polite'.
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
export function speak(
	message: string,
	ariaLive?: 'polite' | 'assertive'
): void {
	message = filterMessage( message );

	if ( ariaLive === 'assertive' ) {
		/*
		 * Clear only the assertive container so the polite queue is not
		 * disturbed. A 100ms gap between the clear and the fill gives
		 * VoiceOver time to observe the blank state as a distinct DOM
		 * mutation before new content arrives.
		 */
		const containerAssertive = document.getElementById(
			'a11y-speak-assertive'
		);
		const containerPolite = document.getElementById( 'a11y-speak-polite' );
		const target = containerAssertive ?? containerPolite;

		if ( target ) {
			target.textContent = '';
		}

		setTimeout( () => {
			const assertive = document.getElementById( 'a11y-speak-assertive' );
			const polite = document.getElementById( 'a11y-speak-polite' );
			const introText = document.getElementById(
				'a11y-speak-intro-text'
			);
			const dest = assertive ?? polite;

			if ( dest ) {
				dest.textContent = message;
			}

			if ( introText ) {
				introText.removeAttribute( 'hidden' );
			}
		}, CLEAR_FILL_DELAY );
	} else {
		/*
		 * Polite messages are serialised through a queue. The queue owns
		 * the clear-fill cycle so rapid speak() calls do not drop messages.
		 */
		enqueuePolite( message );
	}
}
