/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { SPACE } from '@wordpress/keycodes';

/**
 * For some elements like BUTTON and SUMMARY, the space key doesn't insert a
 * space character in some browsers even though the element is editable. We have
 * to manually insert a space and prevent default behaviour.
 *
 * DO NOT limit this behaviour to specific tag names! It would mean that this
 * behaviour is not widely tested. If there's ever any problems, we should find
 * a different solution entirely or remove it entirely.
 */
export function useSpace() {
	return useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			// Don't insert a space if default behaviour is prevented.
			if ( event.defaultPrevented ) {
				return;
			}

			const { keyCode, altKey, metaKey, ctrlKey, key } = event;

			// Only consider the space key without modifiers pressed.
			if ( keyCode !== SPACE || altKey || metaKey || ctrlKey ) {
				return;
			}

			// Disregard character composition that involves the Space key.
			//
			// @see https://github.com/WordPress/gutenberg/issues/35086
			//
			// For example, to input a standalone diacritic (like ´ or `) using a
			// keyboard with dead keys, one must first press the dead key and then
			// press the Space key.
			//
			// Many operating systems handle this in such a way that the second
			// KeyboardEvent contains the property `keyCode: 229`. According to the
			// spec, 229 allows the system to indicate that an Input Method Editor
			// (IDE) is processing some key input.
			//
			// However, Windows doesn't use `keyCode: 229` for dead key composition,
			// instead emitting an event with values `keyCode: SPACE` and `key: '´'`.
			// That is why checking the `key` property for values other than `SPACE`
			// is important.
			//
			// This should serve as a reminder that the `KeyboardEvent.keyCode`
			// attribute is officially deprecated and that we should consider more
			// consistent interfaces.
			if ( key !== ' ' ) {
				return;
			}

			event.target.ownerDocument.execCommand( 'insertText', false, ' ' );
			event.preventDefault();
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
