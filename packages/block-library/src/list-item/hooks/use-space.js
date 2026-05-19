/**
 * WordPress dependencies
 */
import { useRefEffect, subscribeSharedListener } from '@wordpress/compose';
import { SPACE, TAB } from '@wordpress/keycodes';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useIndentListItem from './use-indent-list-item';
import useOutdentListItem from './use-outdent-list-item';

export default function useSpace( clientId ) {
	const { getSelectionStart, getSelectionEnd, getBlockIndex } =
		useSelect( blockEditorStore );
	const indentListItem = useIndentListItem( clientId );
	const outdentListItem = useOutdentListItem();

	return useRefEffect(
		( element ) => {
			function onKeyDown( event ) {
				const { keyCode, shiftKey, altKey, metaKey, ctrlKey } = event;

				if (
					event.defaultPrevented ||
					( keyCode !== SPACE && keyCode !== TAB ) ||
					// Only override when no modifiers are pressed.
					altKey ||
					metaKey ||
					ctrlKey
				) {
					return;
				}

				if ( ! element.contains( event.target ) ) {
					return;
				}

				const selectionStart = getSelectionStart();
				const selectionEnd = getSelectionEnd();
				if (
					selectionStart.offset === 0 &&
					selectionEnd.offset === 0
				) {
					if ( shiftKey ) {
						// Note that backspace behaviour in defined in onMerge.
						if ( keyCode === TAB ) {
							if ( outdentListItem() ) {
								event.preventDefault();
							}
						}
					} else if ( getBlockIndex( clientId ) !== 0 ) {
						if ( indentListItem() ) {
							event.preventDefault();
						}
					}
				}
			}

			// Capture phase so we run before writing-flow's ancestor-bubble
			// keydown handlers that gate on `event.defaultPrevented`.
			return subscribeSharedListener(
				element.ownerDocument,
				'keydown',
				onKeyDown,
				true
			);
		},
		[ clientId, indentListItem ]
	);
}
