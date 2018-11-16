/**
 * Internal dependencies
 */
import filterMessage from './filterMessage';

/**
 * Update the ARIA live notification area text node.
 *
 * @param {string} message  The message to be announced by Assistive Technologies.
 * @param {string} ariaLive Optional. The politeness level for aria-live. Possible values:
 *                          polite or assertive. Default polite.
 */
export const speak = function( message, ariaLive ) {
	message = filterMessage( message );
	//TODO: Use native module to speak message
	if ( 'assertive' === ariaLive ) {

	} else {

	}
};
