/**
 * Internal dependencies
 */
import filterMessage from './filter-message';
import { enqueuePolite } from './queue';

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
		 * Assertive announcements are written synchronously so screen readers
		 * interrupt immediately. The polite queue is deliberately left
		 * untouched so queued polite messages are not lost.
		 */
		const assertive = document.getElementById( 'a11y-speak-assertive' );
		const polite = document.getElementById( 'a11y-speak-polite' );
		const introText = document.getElementById( 'a11y-speak-intro-text' );
		const dest = assertive ?? polite;

		if ( dest ) {
			dest.textContent = message;
		}

		if ( introText ) {
			introText.removeAttribute( 'hidden' );
		}
	} else {
		/*
		 * Polite messages are serialised through a queue. The queue owns
		 * the clear-fill cycle so rapid speak() calls do not drop messages.
		 */
		enqueuePolite( message );
	}
}
