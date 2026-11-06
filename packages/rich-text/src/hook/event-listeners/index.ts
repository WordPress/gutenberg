import { useRef, useInsertionEffect } from '@wordpress/element';
import type { RefObject } from 'react';
import * as copyHandler from './copy-handler';
import * as selectObject from './select-object';
import * as formatBoundaries from './format-boundaries';
import * as deleteHandler from './delete';
import * as inputAndSelection from './input-and-selection';
import * as selectionChangeCompat from './selection-change-compat';
import { ownsSelection } from '../../owns-selection';
import type { EventListenerProps, RichTextField } from '../types';

type FieldHandler = ( field: RichTextField, event: any ) => void;

/**
 * Per event type, the handlers for the fields on the path from the selection
 * and for the fields on the path from the event target. Editing events use the
 * selection: it also finds the field when a focused editing host around it
 * (e.g. the editable canvas wrapper) is the target.
 */
type Handlers = Record<
	string,
	{ selection?: FieldHandler[]; target?: FieldHandler[] }
>;

// Run before any other handler (window capture), so the handlers after them
// see a record in sync with the DOM, and so they can stop those handlers.
const first: Handlers = {
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
	keydown: {
		selection: [
			inputAndSelection.handleSelectionChange,
			formatBoundaries.onKeyDown,
		],
		target: [ selectionChangeCompat.onDown ],
	},
	beforeinput: { selection: [ inputAndSelection.handleSelectionChange ] },
	copy: { selection: [ inputAndSelection.handleSelectionChange ] },
	cut: { selection: [ inputAndSelection.handleSelectionChange ] },
	paste: { selection: [ inputAndSelection.handleSelectionChange ] },
	// `input` and `compositionend` must run before block-editor's
	// `input-rules.js` element-level listeners, which call `getValue()`
	// reading `record.current` updated by our `onInput`. Use capture phase
	// so we fire before any ancestor bubble handlers.
	input: { selection: [ inputAndSelection.onInput ] },
	compositionstart: { selection: [ inputAndSelection.onCompositionStart ] },
	compositionend: { selection: [ inputAndSelection.onCompositionEnd ] },
	selectionchange: { selection: [ inputAndSelection.handleSelectionChange ] },
	focusin: { target: [ inputAndSelection.onFocus, selectObject.onFocusIn ] },
	pointerdown: {
		target: [
			inputAndSelection.onPointerDown,
			selectionChangeCompat.onDown,
		],
	},
};

// Run after all other handlers (window bubble), like the browser's default
// action, so any other handler can prevent them.
const defaults: Handlers = {
	beforeinput: { selection: [ deleteHandler.onBeforeInput ] },
	copy: { selection: [ copyHandler.onCopy ] },
	cut: { selection: [ copyHandler.onCopy ] },
	click: { target: [ selectObject.onClick ] },
};

// Each mounted field adds an entry here instead of its own listeners. The
// listeners are added once per document and look up the fields.
const fields = new WeakMap< Node, RichTextField >();
const documents = new WeakSet< Document >();

function forEachField(
	node: Node | null | undefined,
	callback: ( field: RichTextField ) => void
) {
	for ( ; node; node = node.parentNode ) {
		const field = fields.get( node );
		if ( field ) {
			callback( field );
		}
	}
}

function addListeners(
	ownerDocument: Document,
	handlers: Handlers,
	capture: boolean
) {
	const defaultView = ownerDocument.defaultView!;
	for ( const [ eventType, { selection, target } ] of Object.entries(
		handlers
	) ) {
		defaultView.addEventListener(
			eventType,
			( event ) => {
				if ( selection ) {
					// Without a selection, an editable can still be focused.
					const anchorNode = defaultView.getSelection()?.anchorNode;
					forEachField(
						anchorNode ?? ownerDocument.activeElement,
						( field ) => {
							if ( ownsSelection( field.element ) ) {
								for ( const handler of selection ) {
									handler( field, event );
								}
							}
						}
					);
				}
				if ( target ) {
					forEachField( event.target as Node, ( field ) => {
						for ( const handler of target ) {
							handler( field, event );
						}
					} );
				}
			},
			capture
		);
	}
}

// The latest props, for the listeners to read when an event arrives.
export function useEventListenerProps( props: EventListenerProps ) {
	const propsRef = useRef( props );
	useInsertionEffect( () => {
		propsRef.current = props;
	} );
	return propsRef;
}

export function addField(
	element: HTMLElement,
	props: RefObject< EventListenerProps >
) {
	const { ownerDocument } = element;
	fields.set( element, { element, props } );
	if ( ! documents.has( ownerDocument ) ) {
		documents.add( ownerDocument );
		addListeners( ownerDocument, first, true );
		addListeners( ownerDocument, defaults, false );
	}
	return () => {
		fields.delete( element );
	};
}
