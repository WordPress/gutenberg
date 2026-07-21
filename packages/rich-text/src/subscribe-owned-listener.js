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
// Subscribers share one subscription per document, event type and phase, and
// `dispatch` works out which elements own the event. Do not give each element
// its own subscription: they all bind to the document, so every subscriber
// would run on every event just to discover it wasn't the one that owned it.
// With an editable element per block that is O(blocks) per keystroke.
//
// The inner map is weak so a removed editable element (or the iframe holding
// it) can be garbage-collected.
const registries = new WeakMap();

function dispatch( elements, ownerDocument, event, capture ) {
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

	// Fires the subscribed elements on an ancestor chain, innermost first for
	// bubble and outermost first for capture, as the DOM would. Only reachable
	// with editable elements nested in each other, but getting the phase wrong
	// there is near impossible to debug.
	function fireChain( from, isOwned ) {
		let captured;
		for ( let node = from; node; node = node.parentNode ) {
			if ( ! elements.get( node ) || ( isOwned && ! isOwned( node ) ) ) {
				continue;
			}
			if ( ! capture ) {
				fire( node );
			} else {
				if ( ! captured ) {
					captured = [];
				}
				captured.push( node );
			}
		}
		if ( captured ) {
			for ( let i = captured.length - 1; i >= 0; i-- ) {
				fire( captured[ i ] );
			}
		}
	}

	// Any element containing the target is an ancestor of it.
	fireChain( event.target );

	const { activeElement } = ownerDocument;
	if ( ! activeElement ) {
		return;
	}

	// A focused element owns the selection even when the selection sits
	// elsewhere, so it may not appear on the anchor chain below.
	fire( activeElement );

	// An element owning the selection through a focused editing host has to
	// contain the anchor, so nothing off the anchor chain can qualify.
	// `ownsSelection` is called whole, repeating the anchor check the walk
	// already made, so the two can't drift apart.
	const anchorNode = ownerDocument.defaultView?.getSelection()?.anchorNode;
	fireChain( anchorNode, ownsSelection );
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
		// This rides the delegated listener for ordering, not for filtering:
		// being bound to the document, it is reached for every event and
		// `dispatch` picks the owners itself. Sharing the one native listener
		// keeps owned and element-bound subscribers in DOM order relative to
		// each other. Listening on the document directly would instead order
		// them by whichever native listener happened to be registered first.
		subscribeDelegatedListener(
			ownerDocument,
			eventType,
			( event ) => dispatch( elements, ownerDocument, event, capture ),
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
