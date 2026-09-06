import { privateApis as composePrivateApis } from '@wordpress/compose';
import { ownsSelection } from './owns-selection';
import { unlock } from './lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

// ownerDocument -> eventTypeKey -> WeakMap< element, Set< callback > >.
//
// Subscribers share one delegated listener per document, event type and phase.
// Its callback works out which element owns the event and fires its callbacks,
// rather than every subscriber checking whether it owns the event: bound to the
// document, all of them run on every event, which with an editable element per
// block is O(blocks) per keystroke. The element map is weak so a detached
// element (or the iframe holding it) can be garbage-collected.
const registries = new WeakMap();

/**
 * Listens for events on the element. Unlike an element listener, it also
 * fires when the selection is inside the element but a focused editing host
 * around it (e.g. the editable canvas wrapper) is the event target.
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
		// the document so it is reached for every event. Riding the delegated
		// listener keeps owned and element-bound subscribers in DOM order
		// relative to each other.
		subscribeDelegatedListener(
			ownerDocument,
			eventType,
			( event ) => {
				// These are editing and selection events, so the element that
				// owns the event owns the selection, and it contains the
				// selection anchor. Walk up from the anchor, testing
				// `ownsSelection`, rather than testing every subscriber. When
				// there is no selection an editable can still be focused, so
				// start from the focused element instead.
				const { defaultView, activeElement } = ownerDocument;
				const anchorNode = defaultView?.getSelection()?.anchorNode;
				for (
					let node = anchorNode ?? activeElement;
					node;
					node = node.parentNode
				) {
					const callbacks = elements.get( node );
					if ( callbacks && ownsSelection( node ) ) {
						for ( const cb of callbacks ) {
							cb( event );
						}
					}
				}
			},
			capture
		);
	}

	let set = elements.get( element );
	if ( ! set ) {
		set = new Set();
		elements.set( element, set );
	}
	set.add( callback );

	return () => {
		set.delete( callback );
	};
}
