/**
 * Adds a callback to a shared `addEventListener` on the given target (a
 * `Window` or `Document`). Only one underlying native listener is attached
 * per (target, event type); subsequent subscribers join an in-JS `Set` that
 * fans out the event.
 *
 * RichText attaches several listeners (`copy`, `cut`, `pointerdown`,
 * `pointerup`, `selectionchange`, etc.) to `defaultView` / `ownerDocument`.
 * Each instance previously added its own listener; the handlers then
 * short-circuit if the rich-text isn't the active one. With many rich-text
 * instances mounted at once, that's a lot of redundant JS↔C++ boundary
 * crossings on mount. Sharing collapses them.
 *
 * The native listener is registered lazily on the first subscribe and is
 * not removed when the last subscriber unsubscribes — defaultView /
 * ownerDocument outlive the rich-text instances anyway, and never carrying
 * an empty registry costs only one stable native listener per (target,
 * event type) pair.
 *
 * @param {EventTarget} target          Window or Document to listen on.
 * @param {string}      eventType       DOM event name.
 * @param {Function}    callback        Listener to be invoked with the event.
 * @param {boolean}     [capture=false] Use the capture phase. Required when
 *                                      ancestor listeners (e.g. writing-flow)
 *                                      gate on `event.defaultPrevented`, since
 *                                      a bubble-phase document listener fires
 *                                      after them.
 * @return {Function} Unsubscribe function.
 */
const registries = new WeakMap();

export function subscribeSharedListener(
	target,
	eventType,
	callback,
	capture = false
) {
	let perTarget = registries.get( target );
	if ( ! perTarget ) {
		perTarget = new Map();
		registries.set( target, perTarget );
	}
	const key = capture ? `${ eventType }:capture` : eventType;
	let listeners = perTarget.get( key );
	if ( ! listeners ) {
		listeners = new Set();
		perTarget.set( key, listeners );
		target.addEventListener(
			eventType,
			( event ) => {
				for ( const cb of listeners ) {
					cb( event );
				}
			},
			capture
		);
	}
	listeners.add( callback );
	return () => {
		listeners.delete( callback );
	};
}
