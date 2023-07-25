/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { SPACE } from '@wordpress/keycodes';
import { insert } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export function useFirefoxCompat( props ) {
	const propsRef = useRef( props );
	propsRef.current = props;

	const { isMultiSelecting } = useSelect( blockEditorStore );
	return useRefEffect( ( element ) => {
		function onFocus() {
			if ( ! isMultiSelecting() ) {
				return;
			}

			// This is a little hack to work around focus issues with nested
			// editable elements in Firefox. For some reason the editable child
			// element sometimes regains focus, while it should not be focusable
			// and focus should remain on the editable parent element.
			// To do: try to find the cause of the shifting focus.
			const parentEditable = element.parentElement.closest(
				'[contenteditable="true"]'
			);

			if ( parentEditable ) {
				parentEditable.focus();
			}
		}

		// If a contenteditable element is inside a button/summary element,
		// it is not possible to type a space in Firefox. Therefore, cancel
		// the default event and insert a space explicitly.
		// See: https://bugzilla.mozilla.org/show_bug.cgi?id=1822860
		function onKeyDown( event ) {
			if ( event.keyCode !== SPACE ) {
				return;
			}

			if ( element.closest( 'button, summary' ) === null ) {
				return;
			}

			const { value, onChange } = propsRef.current;
			onChange( insert( value, ' ' ) );
			event.preventDefault();
		}

		element.addEventListener( 'focus', onFocus );
		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'focus', onFocus );
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}
