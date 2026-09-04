import { useRefEffect } from '@wordpress/compose';
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';
import { SPACE, TAB } from '@wordpress/keycodes';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useRegistry } from '@wordpress/data';
import { indentListItems, outdentListItems } from '../utils';
import { unlock } from '../../lock-unlock';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

export default function useSpace() {
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
				const selectionStart = getSelectionStart();
				const selectionEnd = getSelectionEnd();
				if (
					selectionStart.offset === 0 &&
					selectionEnd.offset === 0
				) {
					if ( shiftKey ) {
						// Note that backspace behaviour in defined in onMerge.
						if ( keyCode === TAB ) {
							if ( outdentListItems( registry ) ) {
								event.preventDefault();
							}
						}
					} else if ( indentListItems( registry ) ) {
						event.preventDefault();
					}
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
