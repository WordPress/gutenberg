import { useRefEffect } from '@wordpress/compose';
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';
import { SPACE, TAB } from '@wordpress/keycodes';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useRegistry } from '@wordpress/data';
import { isEntirelySelected } from '@wordpress/dom';
import { indentListItems, outdentListItems } from '../utils';
import { unlock } from '../../lock-unlock';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

export default function useTab() {
	const registry = useRegistry();

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

				const { getSelectionStart, getSelectionEnd } =
					registry.select( blockEditorStore );
				const isAtStart =
					getSelectionStart().offset === 0 &&
					getSelectionEnd().offset === 0;

				// A leading space at the start of an item indents it. Anywhere
				// else it just types a space (backspace outdents, see onMerge).
				if ( keyCode === SPACE ) {
					if (
						! shiftKey &&
						isAtStart &&
						indentListItems( registry )
					) {
						event.preventDefault();
					}
					return;
				}

				// Tab indents and Shift+Tab outdents, both when the caret is at
				// the start of the item and when its content is fully selected.
				if ( ! isAtStart && ! isEntirelySelected( element ) ) {
					return;
				}
				const move = shiftKey ? outdentListItems : indentListItems;
				if ( move( registry ) ) {
					event.preventDefault();
				}
			}

			// Capture phase so we run before writing-flow's ancestor-bubble
			// keydown handlers that gate on `event.defaultPrevented`.
			return subscribeOwnedListener(
				element,
				'keydown',
				onKeyDown,
				true
			);
		},
		[ registry ]
	);
}
