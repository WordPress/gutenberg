/**
 * Internal dependencies
 */
import filterMessage from './shared/filter-message';

/**
 * Update the ARIA live notification area text node.
 *
 * @param message    The message to be announced by Assistive Technologies.
 * @param [ariaLive] The politeness level for aria-live; default: 'polite'.
 */
export function speak(
	message: string,
	ariaLive?: 'polite' | 'assertive'
): void {
	message = filterMessage( message );
	// TODO: Use native module to speak message.
	if ( ariaLive === 'assertive' ) {
	} else {
	}
}
