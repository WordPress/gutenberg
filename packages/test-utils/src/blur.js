/**
 * Internal dependencies
 */
import fireEvent from './fire-event';
import act from './act';
import getActiveElement from './utils/get-active-element';
import isBodyElement from './utils/is-body-element';

/**
 * Blur element.
 *
 * @param {Element} [element]
 */
export default function blur( element ) {
	if ( ! element ) {
		element = getActiveElement();
	}

	if ( ! element || isBodyElement( element ) || getActiveElement( element ) !== element ) {
		return;
	}

	// This is set by `type` so `blur` knows whether to dispatch a change event
	if ( element.dirty ) {
		fireEvent.change( element );
		element.dirty = false;
	}

	act( () => {
		element.blur();
	} );

	fireEvent.focusOut( element );
}
