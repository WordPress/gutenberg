import { privateApis as composePrivateApis } from '@wordpress/compose';
import { ownsSelection } from './owns-selection';
import { unlock } from './lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

// ownerDocument -> eventTypeKey -> WeakMap< element, Set< callback > >.
//
// Subscribers share one delegated listener per document, event type and phase.
// `dispatch` works out which elements own the event and fires their callbacks,
// rather than every subscriber checking whether it owns the event: bound to the
// document, all of them run on every event, which with an editable element per
// block is O(blocks) per keystroke. The element map is weak so a detached
// element (or the iframe holding it) can be garbage-collected.
const registries = new WeakMap();

/**
 * Fires the callbacks of every subscribed element that owns the event.
 *
 * An element owns the event when it contains the target (the event happened
 * inside it) or `ownsSelection` is true (it owns the selection through a focused
 * editing host, e.g. the block editor canvas wrapper). That can only hold for
 * an ancestor of the target, an ancestor of the selection anchor, or the
 * focused element, so only those chains are walked, rather than testing every
 * subscriber. The check is the same one an element-bound listener would make;
 * it is only asked of the nodes that could pass it.
 *
 * @param {WeakMap}  elements      Subscribed elements mapped to their callbacks.
 * @param {Document} ownerDocument Document the listener is attached to.
 * @param {Event}    event         The event to dispatch.
 */
function dispatch( elements, ownerDocument, event ) {
	const { activeElement } = ownerDocument;
	const anchorNode = ownerDocument.defaultView?.getSelection()?.anchorNode;
	const fired = new Set();

	for ( const start of [ event.target, anchorNode, activeElement ] ) {
		for ( let node = start; node; node = node.parentNode ) {
			const callbacks = elements.get( node );
			if ( ! callbacks || fired.has( node ) ) {
				continue;
			}
			if ( node.contains( event.target ) || ownsSelection( node ) ) {
				fired.add( node );
				for ( const callback of callbacks ) {
					callback( event );
				}
			}
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

	let byEvent = registries.get( ownerDocument );
	if ( ! byEvent ) {
		byEvent = new Map();
		registries.set( ownerDocument, byEvent );
	}

	const key = capture ? `${ eventType }:capture` : eventType;
	let elements = byEvent.get( key );
	if ( ! elements ) {
		elements = new WeakMap();
		byEvent.set( key, elements );
		// One delegated listener per document, event type and phase, bound to
		// the document so it is reached for every event and lets `dispatch`
		// pick the owners. Riding the delegated listener keeps owned and
		// element-bound subscribers in DOM order relative to each other.
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
