/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { SPACE, TAB } from '@wordpress/keycodes';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import useIndentListItem from './use-indent-list-item';

export default function useSpace( clientId ) {
	const { getSelectionStart, getSelectionEnd } =
		useSelect( blockEditorStore );
	const [ canIndent, indentListItem ] = useIndentListItem( clientId );
	const { createNotice } = useDispatch( noticesStore );

	return useRefEffect(
		( element ) => {
			function onKeyDown( event ) {
				const { keyCode, shiftKey, altKey, metaKey, ctrlKey } = event;

				if (
					event.defaultPrevented ||
					! canIndent ||
					// Only override when no modifiers are pressed.
					shiftKey ||
					altKey ||
					metaKey ||
					ctrlKey
				) {
					return;
				}

				if ( keyCode !== SPACE && keyCode !== TAB ) {
					return;
				}

				const selectionStart = getSelectionStart();
				const selectionEnd = getSelectionEnd();

				if (
					selectionStart.offset !== 0 ||
					selectionEnd.offset !== 0
				) {
					return;
				}

				if ( keyCode === TAB ) {
					createNotice(
						'info',
						__( 'To indent list items, press Space.' ),
						{
							isDismissible: true,
							type: 'snackbar',
						}
					);
				} else {
					event.preventDefault();
					indentListItem();
				}
			}

			element.addEventListener( 'keydown', onKeyDown );
			return () => {
				element.removeEventListener( 'keydown', onKeyDown );
			};
		},
		[ canIndent, indentListItem ]
	);
}
