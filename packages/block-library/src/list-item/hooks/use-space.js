/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { SPACE } from '@wordpress/keycodes';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useIndentListItem from './use-indent-list-item';

export default function useSpace( clientId ) {
	const { getSelectionStart, getSelectionEnd, getBlockIndex } =
		useSelect( blockEditorStore );
	const indentListItem = useIndentListItem( clientId );

	return useRefEffect(
		( element ) => {
			function onKeyDown( event ) {
				const { keyCode, shiftKey, altKey, metaKey, ctrlKey } = event;

				if (
					event.defaultPrevented ||
					keyCode !== SPACE ||
					// Only override when no modifiers are pressed.
					shiftKey ||
					altKey ||
					metaKey ||
					ctrlKey
				) {
					return;
				}

				if ( getBlockIndex( clientId ) === 0 ) {
					return;
				}

				const selectionStart = getSelectionStart();
				const selectionEnd = getSelectionEnd();
				if (
					selectionStart.offset === 0 &&
					selectionEnd.offset === 0
				) {
					event.preventDefault();
					indentListItem();
				}
			}

			element.addEventListener( 'keydown', onKeyDown );
			return () => {
				element.removeEventListener( 'keydown', onKeyDown );
			};
		},
		[ clientId, indentListItem ]
	);
}
