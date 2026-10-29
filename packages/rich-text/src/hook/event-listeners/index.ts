import { useRef, useInsertionEffect } from '@wordpress/element';
import {
	useRefEffect,
	privateApis as composePrivateApis,
} from '@wordpress/compose';
import * as copyHandler from './copy-handler';
import * as selectObject from './select-object';
import * as formatBoundaries from './format-boundaries';
import * as deleteHandler from './delete';
import * as inputAndSelection from './input-and-selection';
import * as selectionChangeCompat from './selection-change-compat';
import { ownsSelection } from '../../owns-selection';
import { unlock } from '../../lock-unlock';
import type { EventListenerProps, RichTextField } from '../types';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

type FieldHandler = ( field: RichTextField, event: any ) => void;

// Each mounted field adds an entry here instead of its own listeners. The
// listeners are added once per document and look up the fields.
const fields = new WeakMap< Node, RichTextField >();
const documents = new WeakSet< Document >();

function addListeners( ownerDocument: Document ) {
	const { defaultView } = ownerDocument;

	// Calls the handlers for the fields on the path from the selection anchor,
	// or from the focused element when there is no selection.
	function forSelectionPath(
		event: Event,
		handlers: FieldHandler[],
		isOwner: ( field: RichTextField ) => boolean
	) {
		const { activeElement } = ownerDocument;
		const anchorNode = defaultView?.getSelection()?.anchorNode;
		for (
			let node: Node | null = anchorNode ?? activeElement;
			node;
			node = node.parentNode
		) {
			const field = fields.get( node );
			if ( field && isOwner( field ) ) {
				for ( const handler of handlers ) {
					handler( field, event );
				}
			}
		}
	}

	// For editing events. Unlike the event target, the selection also finds
	// the field when a focused editing host around it (e.g. the editable
	// canvas wrapper) is the target.
	function onSelection(
		eventType: string,
		handlers: FieldHandler[],
		capture = false
	) {
		subscribeDelegatedListener(
			ownerDocument,
			eventType,
			( event: Event ) =>
				forSelectionPath( event, handlers, ( field ) =>
					ownsSelection( field.element )
				),
			capture
		);
	}

	function onTarget(
		eventType: string,
		handlers: FieldHandler[],
		capture = false
	) {
		subscribeDelegatedListener(
			ownerDocument,
			eventType,
			( event: Event ) => {
				for (
					let node = event.target as Node | null;
					node;
					node = node.parentNode
				) {
					const field = fields.get( node );
					if ( field ) {
						for ( const handler of handlers ) {
							handler( field, event );
						}
					}
				}
			},
			capture
		);
	}

	// The native `selectionchange` event is asynchronous and coalesced: the
	// record and the store selection can be one selection behind the DOM when
	// an event that acts on them arrives, regardless of how the selection got
	// there. When a focused editing host owns the element's selection, there
	// are not even focus events to catch up on entry, and handlers that act
	// on the selected block only attach once the store selects it.
	// Synchronize on capture of the events that consume the record,
	// the store selection, or a value rendered from them, before any other
	// handler runs. The snapshot comparison in `handleSelectionChange` skips
	// selections that have already been processed.
	onSelection(
		'keydown',
		[ inputAndSelection.handleSelectionChange, formatBoundaries.onKeyDown ],
		true
	);
	for ( const eventType of [ 'beforeinput', 'copy', 'cut', 'paste' ] ) {
		onSelection(
			eventType,
			[ inputAndSelection.handleSelectionChange ],
			true
		);
	}
	// `input` and `compositionend` must run before block-editor's
	// `input-rules.js` element-level listeners, which call `getValue()`
	// reading `record.current` updated by our `onInput`. Use capture phase
	// so we fire before any ancestor bubble handlers.
	onSelection( 'input', [ inputAndSelection.onInput ], true );
	onSelection( 'compositionstart', [ inputAndSelection.onCompositionStart ] );
	onSelection(
		'compositionend',
		[ inputAndSelection.onCompositionEnd ],
		true
	);
	onSelection( 'selectionchange', [
		inputAndSelection.handleSelectionChange,
	] );
	// Capture, so the field handles focus before the block's focus handler,
	// as when it listened on its own element.
	onTarget(
		'focusin',
		[ inputAndSelection.onFocus, selectObject.onFocusIn ],
		true
	);
	onTarget( 'pointerdown', [
		inputAndSelection.onPointerDown,
		selectionChangeCompat.onDown,
	] );
	onTarget( 'keydown', [ selectionChangeCompat.onDown ] );
	onSelection( 'keydown', [ deleteHandler.onKeyDown ] );
	onTarget( 'click', [ selectObject.onClick ] );

	// On the window, so the block editor's copy handler on the document runs
	// first. `onCopy` checks which field the copy is for.
	function onCopy( event: Event ) {
		forSelectionPath( event, [ copyHandler.onCopy ], () => true );
	}
	subscribeDelegatedListener( defaultView!, 'copy', onCopy );
	subscribeDelegatedListener( defaultView!, 'cut', onCopy );
}

export function useEventListeners( props: EventListenerProps ) {
	const propsRef = useRef( props );
	useInsertionEffect( () => {
		propsRef.current = props;
	} );

	return useRefEffect( ( element: HTMLElement ) => {
		const { ownerDocument } = element;
		fields.set( element, { element, props: propsRef } );
		if ( ! documents.has( ownerDocument ) ) {
			documents.add( ownerDocument );
			addListeners( ownerDocument );
		}
		return () => {
			fields.delete( element );
		};
	}, [] );
}
