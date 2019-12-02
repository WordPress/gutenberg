/**
 * WordPress dependencies
 */
import { isTextField } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import fireEvent from './fire-event';
import focus from './focus';
import getActiveElement from './utils/get-active-element';
import isFocusable from './utils/is-focusable';
import subscribeDefaultPrevented from './utils/subscribe-default-prevented';

const charMap = {
	'\b': 'Backspace',
};

const keyMap = {
	Backspace( element ) {
		return element.value.substr( 0, element.value.length - 1 );
	},
};

/**
 * Type on a text field element.
 *
 * @param {string} text
 * @param {Element} [element]
 * @param {Object} [options]
 */
export default function type( text, element, options = {} ) {
	if ( ! element ) {
		element = getActiveElement();
	}

	if ( ! element || ! isFocusable( element ) || ! isTextField( element ) ) {
		return;
	}

	focus( element );

	// Set element dirty so blur() can dispatch a change event
	element.dirty = true;

	for ( const char of text ) {
		const key = char in charMap ? charMap[ char ] : char;
		const value =
			key in keyMap ? keyMap[ key ]( element, options ) : `${ element.value }${ char }`;

		const defaultPrevented = subscribeDefaultPrevented( element, 'keydown' );

		fireEvent.keyDown( element, { key, ...options } );

		if ( ! defaultPrevented.current && ! element.readOnly ) {
			fireEvent.input( element, { data: char, target: { value }, ...options } );
		}

		fireEvent.keyUp( element, { key, ...options } );

		defaultPrevented.unsubscribe();
	}
}
