/**
 * Internal dependencies
 */
import fireEvent from './fire-event';
import act from './act';
import blur from './blur';
import isFocusable from './utils/is-focusable';
import getActiveElement from './utils/get-active-element';

/**
 * Focus element.
 *
 * @param {Element} element
 */
export default function focus( element ) {
	if ( getActiveElement( element ) === element || ! isFocusable( element ) ) {
		return;
	}

	blur();

	act( () => {
		element.focus();
	} );

	fireEvent.focusIn( element );
}
