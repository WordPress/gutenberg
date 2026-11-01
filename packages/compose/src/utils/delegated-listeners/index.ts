import { useInsertionEffect, useRef } from '@wordpress/element';
import type { RefObject } from 'react';
import useRefEffect from '../../hooks/use-ref-effect';
import { ownsSelection } from '../owns-selection';

/**
 * A mounted element and the latest props its handlers read.
 */
export type DelegatedListenerField< P = any > = {
	element: HTMLElement;
	props: RefObject< P >;
};

type Handler = ( field: any, event: any ) => void;

/**
 * Per event type, the handlers for the elements on the path from the
 * selection that own it, and for the elements on the path from the event
 * target. Editing events use the selection: it also finds the element when a
 * focused editing host around it (e.g. the editable canvas wrapper) is the
 * target.
 */
type Handlers = Record< string, { selection?: Handler[]; target?: Handler[] } >;

/**
 * Handlers per phase. Listeners are added once per document, phase and event
 * type, and run the handlers of every mounted element the event is for.
 */
export type DelegatedListeners = {
	// Window capture: before any other handler.
	first?: Handlers;
	// Window bubble: after all other handlers, like the browser's default
	// action, so any of them can prevent these.
	default?: Handlers;
	// Capture on the document element: after the document's capture handlers
	// and before any element's.
	root?: Handlers;
};

type Phase = keyof DelegatedListeners;

type Registration = {
	field: DelegatedListenerField;
	listeners: DelegatedListeners;
};

// Per element, the registrations in mount order.
const registrations = new WeakMap< Node, Set< Registration > >();
// Per document, the phase and event type pairs that have a listener.
const listening = new WeakMap< Document, Set< string > >();

function runHandlers(
	node: Node | null | undefined,
	phase: Phase,
	eventType: string,
	lookup: 'selection' | 'target',
	event: Event
) {
	for ( ; node; node = node.parentNode ) {
		const set = registrations.get( node );
		if ( ! set ) {
			continue;
		}
		let owns: boolean | undefined;
		for ( const { field, listeners } of set ) {
			const handlers = listeners[ phase ]?.[ eventType ]?.[ lookup ];
			if ( ! handlers ) {
				continue;
			}
			if ( lookup === 'selection' ) {
				owns ??= ownsSelection( field.element );
				if ( ! owns ) {
					continue;
				}
			}
			for ( const handler of handlers ) {
				handler( field, event );
			}
		}
	}
}

function listen( ownerDocument: Document, phase: Phase, eventType: string ) {
	const defaultView = ownerDocument.defaultView!;
	const root = phase === 'root' ? ownerDocument.documentElement : defaultView;
	root.addEventListener(
		eventType,
		( event ) => {
			// Without a selection, an editable can still be focused.
			const anchorNode = defaultView.getSelection()?.anchorNode;
			runHandlers(
				anchorNode ?? ownerDocument.activeElement,
				phase,
				eventType,
				'selection',
				event
			);
			runHandlers(
				event.target as Node,
				phase,
				eventType,
				'target',
				event
			);
		},
		phase !== 'default'
	);
}

/**
 * Adds the element's handlers, instead of listeners of its own.
 *
 * @param element   The element.
 * @param listeners Handlers per phase, the same object for every element.
 * @param props     The latest props, which the handlers read.
 *
 * @return Removes the handlers.
 */
export function addDelegatedListeners(
	element: HTMLElement,
	listeners: DelegatedListeners,
	props: RefObject< any >
) {
	const { ownerDocument } = element;
	let types = listening.get( ownerDocument );
	if ( ! types ) {
		types = new Set();
		listening.set( ownerDocument, types );
	}
	for ( const phase in listeners ) {
		for ( const eventType in listeners[ phase as Phase ] ) {
			const key = `${ phase } ${ eventType }`;
			if ( ! types.has( key ) ) {
				types.add( key );
				listen( ownerDocument, phase as Phase, eventType );
			}
		}
	}

	let set = registrations.get( element );
	if ( ! set ) {
		set = new Set();
		registrations.set( element, set );
	}
	const registration = { field: { element, props }, listeners };
	set.add( registration );
	return () => {
		set.delete( registration );
	};
}

/**
 * Adds the element's handlers, instead of listeners of its own.
 *
 * @param listeners Handlers per phase, the same object for every element.
 * @param props     The latest props, which the handlers read.
 *
 * @return Ref callback.
 */
export function useDelegatedListeners< P >(
	listeners: DelegatedListeners,
	props: P
) {
	const propsRef = useRef( props );
	useInsertionEffect( () => {
		propsRef.current = props;
	} );
	return useRefEffect(
		( element: HTMLElement ) =>
			addDelegatedListeners( element, listeners, propsRef ),
		[ listeners ]
	);
}
