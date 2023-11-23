/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { TAB } from '@wordpress/keycodes';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useIndentListItem from './use-indent-list-item';
import useOutdentListItem from './use-outdent-list-item';

export default function useTab( clientId ) {
	const [ canIndent, indentListItem ] = useIndentListItem( clientId );
	const [ canOutdent, outdentListItem ] = useOutdentListItem( clientId );
	const { getSettings } = useSelect( blockEditorStore );

	return useRefEffect(
		( element ) => {
			function onKeyDown( event ) {
				const { keyCode, shiftKey, altKey, metaKey, ctrlKey } = event;

				if (
					event.defaultPrevented ||
					keyCode !== TAB ||
					// Only override when no modifiers are pressed.
					altKey ||
					metaKey ||
					ctrlKey
				) {
					return;
				}

				if ( getSettings().keepCaretInsideBlock ) {
					return;
				}

				event.preventDefault();

				if ( shiftKey ) {
					if ( canOutdent ) {
						outdentListItem();
					}
				} else if ( canIndent ) {
					indentListItem();
				}
			}

			element.addEventListener( 'keydown', onKeyDown );
			return () => {
				element.removeEventListener( 'keydown', onKeyDown );
			};
		},
		[ canIndent, indentListItem, canOutdent, outdentListItem ]
	);
}
