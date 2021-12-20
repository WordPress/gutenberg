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

			const { keyCode, altKey, metaKey, ctrlKey } = event;

			// Only consider the space key without modifiers pressed.
			if ( keyCode !== SPACE || altKey || metaKey || ctrlKey ) {
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
