/**
 * Internal dependencies
 */
import filterMessage from './shared/filter-message';

/**
 * Update the ARIA live notification area text node.
 *
 * @param {string} message    The message to be announced by Assistive Technologies.
 * @param {string} [ariaLive] The politeness level for aria-live; default: 'polite'.
 */
export function speak( message, ariaLive ) {
	message = filterMessage( message );
	// TODO: Use native module to speak message.
	if ( ariaLive === 'assertive' ) {
	} else {
	}
}
