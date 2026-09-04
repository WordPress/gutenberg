import { useRefEffect } from '@wordpress/compose';
import { TAB } from '@wordpress/keycodes';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useRegistry } from '@wordpress/data';
import { indentListItems, outdentListItems } from '../utils';

export default function useMultiSelectTab() {
	const registry = useRegistry();

	return useRefEffect(
		( element ) => {
			function onKeyDown( event ) {
				const { keyCode, shiftKey, altKey, metaKey, ctrlKey } = event;

				if (
					keyCode !== TAB ||
					event.defaultPrevented ||
					altKey ||
					metaKey ||
					ctrlKey
				) {
					return;
				}

				const {
					hasMultiSelection,
					getMultiSelectedBlockClientIds,
					getBlockName,
				} = registry.select( blockEditorStore );

				if ( ! hasMultiSelection() ) {
					return;
				}

				if (
					! getMultiSelectedBlockClientIds().every(
						( id ) => getBlockName( id ) === 'core/list-item'
					)
				) {
					return;
				}

				// The listener is on the document, so it also sees a Tab from
				// other editor UI while the multi selection lingers (moving
				// focus does not clear it). A multi selection keeps focus on the
				// canvas host that wraps the blocks, so only act when the key
				// comes from an ancestor of them, not from a toolbar or panel.
				if ( ! event.target.contains( element ) ) {
					return;
				}

				if ( shiftKey ) {
					if ( outdentListItems( registry ) ) {
						event.preventDefault();
					}
				} else if ( indentListItems( registry ) ) {
					event.preventDefault();
				}
			}

			// During a multi selection focus sits on the writing flow container,
			// not inside any item, so an element listener never sees the key.
			// Listen on the document, and always: a multi selection made in an
			// editing host reaches the store outside React, so a Tab can arrive
			// before a render that would attach the listener. Capture phase so
			// we run before writing-flow's keydown handlers, which gate on
			// `event.defaultPrevented`.
			const { ownerDocument } = element;
			ownerDocument.addEventListener( 'keydown', onKeyDown, true );
			return () => {
				ownerDocument.removeEventListener( 'keydown', onKeyDown, true );
			};
		},
		[ registry ]
	);
}
