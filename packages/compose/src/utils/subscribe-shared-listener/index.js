/**
 * Adds a callback to a shared `addEventListener` on the given target (a
 * `Window` or `Document`). Only one underlying native listener is attached
 * per (target, event type, phase); subsequent subscribers join an in-JS
 * `Set` that fans out the event.
 *
 * Many editor surfaces attach the same DOM listener once per component
 * instance (`copy`, `cut`, `pointerdown`, `pointerup`, `selectionchange`,
 * `focusin`, `mouseover`, etc.). Each instance previously called
 * `addEventListener` and short-circuited inside the handler when not the
 * active one. With many mounted instances that's redundant JS↔C++
 * boundary crossings on every event. Sharing collapses them.
 *
 * The native listener is registered lazily on the first subscribe and is
 * not removed when the last subscriber unsubscribes — `window` /
 * `document` outlive the component instances, and keeping one stable
 * native listener per (target, type, phase) is cheaper than churning the
 * registry.
 *
 * @param {EventTarget} target          Window or Document to listen on.
 * @param {string}      eventType       DOM event name.
 * @param {Function}    callback        Listener to be invoked with the event.
 * @param {boolean}     [capture=false] Use the capture phase. Required when
 *                                      ancestor listeners gate on
 *                                      `event.defaultPrevented`, since a
 *                                      bubble-phase document listener fires
 *                                      after them.
 * @return {Function} Unsubscribe function.
 */
const registries = new WeakMap();

export default function subscribeSharedListener(
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
