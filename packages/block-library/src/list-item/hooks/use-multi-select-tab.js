import { useRefEffect } from '@wordpress/compose';
import { TAB } from '@wordpress/keycodes';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useRegistry } from '@wordpress/data';
import { indentListItems, outdentListItems } from '../utils';

export default function useMultiSelectTab( clientId ) {
	const registry = useRegistry();
	// Only one item attaches the listener, so there is a single handler
	// regardless of how many list items are rendered: the first item of an
	// all-list-item multi selection, or the selected item. The selected item
	// listens because a multi selection made from it can receive a Tab before
	// the selection is rendered: a native selection in an editing host syncs
	// to the store outside React, so the handler of the first selected item
	// may not be attached yet when the key arrives. The handler reads the
	// selection from the store at event time.
	const isActive = useSelect(
		( select ) => {
			const {
				hasMultiSelection,
				getMultiSelectedBlockClientIds,
				getSelectedBlockClientId,
				getBlockName,
			} = select( blockEditorStore );
			if ( ! hasMultiSelection() ) {
				return getSelectedBlockClientId() === clientId;
			}
			const clientIds = getMultiSelectedBlockClientIds();
			return (
				clientIds[ 0 ] === clientId &&
				clientIds.every(
					( id ) => getBlockName( id ) === 'core/list-item'
				)
			);
		},
		[ clientId ]
	);

	return useRefEffect(
		( element ) => {
			if ( ! isActive ) {
				return;
			}

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

				if (
					! hasMultiSelection() ||
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

			// During a multi selection focus sits on the writing flow
			// container, not inside any item, so an element listener never sees
			// the key. Listen on the document. Capture phase so we run before
			// writing-flow's keydown handlers, which gate on
			// `event.defaultPrevented`.
			const { ownerDocument } = element;
			ownerDocument.addEventListener( 'keydown', onKeyDown, true );
			return () => {
				ownerDocument.removeEventListener( 'keydown', onKeyDown, true );
			};
		},
		[ isActive, registry ]
	);
}
