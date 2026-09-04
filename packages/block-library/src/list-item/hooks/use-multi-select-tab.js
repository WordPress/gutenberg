import { useRefEffect } from '@wordpress/compose';
import { TAB } from '@wordpress/keycodes';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useRegistry } from '@wordpress/data';
import { indentListItems, outdentListItems } from '../utils';

// document -> registry -> { count, remove }
//
// One keydown listener per document and registry, shared by every mounted
// list item: the first mounted item adds it and the last unmounted item
// removes it. It is attached for as long as any list item is rendered, not
// when a multi selection appears: a native selection made in an editing host
// syncs to the store outside React, so a Tab can arrive before a render has
// reflected the multi selection, and a listener attached from that render
// would miss it. The handler reads the selection from the store at event
// time instead.
const listeners = new WeakMap();

function onKeyDown( event, registry ) {
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

	const { hasMultiSelection, getMultiSelectedBlockClientIds, getBlockName } =
		registry.select( blockEditorStore );

	if ( ! hasMultiSelection() ) {
		return;
	}

	const clientIds = getMultiSelectedBlockClientIds();

	if (
		! clientIds.every( ( id ) => getBlockName( id ) === 'core/list-item' )
	) {
		return;
	}

	// The listener is on the document, so it also sees a Tab from other
	// editor UI while the multi selection lingers (moving focus does not clear
	// it). A multi selection keeps focus on the canvas host that wraps the
	// blocks, so only act when the key comes from an ancestor of them, not
	// from a toolbar or panel.
	const element = event.target.ownerDocument.getElementById(
		`block-${ clientIds[ 0 ] }`
	);
	if ( ! element || ! event.target.contains( element ) ) {
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

export default function useMultiSelectTab() {
	const registry = useRegistry();

	return useRefEffect(
		( element ) => {
			const { ownerDocument } = element;

			let byRegistry = listeners.get( ownerDocument );
			if ( ! byRegistry ) {
				byRegistry = new Map();
				listeners.set( ownerDocument, byRegistry );
			}

			let entry = byRegistry.get( registry );
			if ( ! entry ) {
				const listener = ( event ) => onKeyDown( event, registry );
				// During a multi selection focus sits on the writing flow
				// container, not inside any item, so an element listener
				// never sees the key. Listen on the document. Capture phase so
				// we run before writing-flow's keydown handlers, which gate on
				// `event.defaultPrevented`.
				ownerDocument.addEventListener( 'keydown', listener, true );
				entry = {
					count: 0,
					remove: () =>
						ownerDocument.removeEventListener(
							'keydown',
							listener,
							true
						),
				};
				byRegistry.set( registry, entry );
			}
			entry.count++;

			return () => {
				entry.count--;
				if ( ! entry.count ) {
					entry.remove();
					byRegistry.delete( registry );
				}
			};
		},
		[ registry ]
	);
}
