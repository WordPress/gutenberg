import { privateApis as composePrivateApis } from '@wordpress/compose';
import { ownsSelection } from './owns-selection';
import { unlock } from './lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

// ownerDocument -> eventTypeKey -> WeakMap< element, callbacks >.
//
// Subscribers share one delegated listener per document, event type and phase.
// Its callback works out which element owns the event and fires its callbacks,
// rather than every subscriber checking whether it owns the event: bound to the
// document, all of them run on every event, which with an editable element per
// block is O(blocks) per keystroke. The element map is weak so a detached
// element (or the iframe holding it) can be garbage-collected.
// An element's callbacks, in the order they fire: those subscribed to fire
// first, then the others, each in subscription order.
type Callbacks = {
	first: Set< EventListener >;
	rest: Set< EventListener >;
};

const registries = new WeakMap<
	Document,
	Map< string, WeakMap< Node, Callbacks > >
>();

/**
 * Listens for events on the element. Unlike an element listener, it also
 * fires when the selection is inside the element but a focused editing host
 * around it (e.g. the editable canvas wrapper) is the event target.
 *
 * @param element   The editable element.
 * @param eventType DOM event name.
 * @param callback  Listener to be invoked with the event.
 * @param capture   Use the capture phase. Defaults to `false`.
 * @param first     Fire before the callbacks of the element not subscribed
 *                  with `first`, whenever subscribed, as rich text's own
 *                  listeners must. Defaults to `false`.
 *
 * @return Unsubscribe function.
 */
export function subscribeOwnedListener(
	element: HTMLElement,
	eventType: string,
	callback: EventListener,
	capture = false,
	first = false
) {
	const { ownerDocument } = element;

	let byEvent = registries.get( ownerDocument );
	if ( ! byEvent ) {
		byEvent = new Map();
		registries.set( ownerDocument, byEvent );
	}

	const key = capture ? `${ eventType }:capture` : eventType;
	const elements = byEvent.get( key ) ?? new WeakMap();
	if ( ! byEvent.has( key ) ) {
		byEvent.set( key, elements );
		// One delegated listener per document, event type and phase, bound to
		// the document so it is reached for every event. Riding the delegated
		// listener keeps owned and element-bound subscribers in DOM order
		// relative to each other.
		subscribeDelegatedListener(
			ownerDocument,
			eventType,
			( event: Event ) => {
				// These are editing and selection events, so the element that
				// owns the event owns the selection, and it contains the
				// selection anchor. Walk up from the anchor, testing
				// `ownsSelection`, rather than testing every subscriber. When
				// there is no selection an editable can still be focused, so
				// start from the focused element instead.
				const { defaultView, activeElement } = ownerDocument;
				const anchorNode = defaultView?.getSelection()?.anchorNode;
				for (
					let node: Node | null = anchorNode ?? activeElement;
					node;
					node = node.parentNode
				) {
					const callbacks = elements.get( node );
					if ( callbacks && ownsSelection( node as HTMLElement ) ) {
						for ( const cb of callbacks.first ) {
							cb( event );
						}
						for ( const cb of callbacks.rest ) {
							cb( event );
						}
					}
				}
			},
			capture
		);
	}

	let callbacks = elements.get( element );
	if ( ! callbacks ) {
		callbacks = { first: new Set(), rest: new Set() };
		elements.set( element, callbacks );
	}
	const set = first ? callbacks.first : callbacks.rest;
	set.add( callback );

	return () => {
		set.delete( callback );
	};
}
