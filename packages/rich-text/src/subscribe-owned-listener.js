/**
 * WordPress dependencies
 */
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { ownsSelection } from './owns-selection';
import { unlock } from './lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

// ownerDocument -> eventTypeKey -> WeakMap< element, Set< callback > >
//
// One shared delegated subscription per document, event type and phase.
// Subscribing each element separately would bind every subscriber to the
// document, so a single event would run all of them to let all but one
// filter itself out: with an editable element per block that is O(blocks)
// on every keystroke. Instead the owning elements are resolved from the
// event and the selection, which only ever walks two ancestor chains.
//
// The inner registry is a `WeakMap` so removing an editable element (or the
// iframe holding it) lets it be garbage-collected, matching
// `subscribeDelegatedListener`.
const registries = new WeakMap();

function dispatch( elements, ownerDocument, event ) {
	const fired = new Set();

	function fire( node ) {
		const callbacks = elements.get( node );
		if ( ! callbacks || fired.has( node ) ) {
			return;
		}
		fired.add( node );
		for ( const callback of callbacks ) {
			callback( event );
		}
	}

	// Events targeting the element or one of its descendants: every element
	// containing the target is on the target's ancestor chain.
	for ( let node = event.target; node; node = node.parentNode ) {
		fire( node );
	}

	const { activeElement } = ownerDocument;
	if ( ! activeElement ) {
		return;
	}

	// A focused element always owns the selection.
	fire( activeElement );

	// An element owning the selection through a focused editing host contains
	// the selection anchor, so only the anchor's ancestor chain can qualify.
	const anchorNode = ownerDocument.defaultView?.getSelection()?.anchorNode;
	for ( let node = anchorNode; node; node = node.parentNode ) {
		if ( elements.get( node ) && ownsSelection( node ) ) {
			fire( node );
		}
	}
}

/**
 * Subscribes a callback for events owned by the given editable element:
 * events targeting the element or its descendants, and events targeting a
 * focused editing host (e.g. an editable block editor canvas wrapper) while
 * the element contains the selection. In the latter case events target the
 * host, never the element, so an element-bound listener would not fire.
 *
 * @param {HTMLElement} element   The editable element.
 * @param {string}      eventType DOM event name.
 * @param {Function}    callback  Listener to be invoked with the event.
 * @param {boolean}     capture   Use the capture phase. Defaults to `false`.
 *
 * @return {Function} Unsubscribe function.
 */
export function subscribeOwnedListener(
	element,
	eventType,
	callback,
	capture = false
) {
	const { ownerDocument } = element;

	let perDocument = registries.get( ownerDocument );
	if ( ! perDocument ) {
		perDocument = new Map();
		registries.set( ownerDocument, perDocument );
	}

	const key = capture ? `${ eventType }:capture` : eventType;
	let elements = perDocument.get( key );
	if ( ! elements ) {
		elements = new WeakMap();
		perDocument.set( key, elements );
		subscribeDelegatedListener(
			ownerDocument,
			eventType,
			( event ) => dispatch( elements, ownerDocument, event ),
			capture
		);
	}

	let callbacks = elements.get( element );
	if ( ! callbacks ) {
		callbacks = new Set();
		elements.set( element, callbacks );
	}
	callbacks.add( callback );

	return () => {
		callbacks.delete( callback );
	};
}
