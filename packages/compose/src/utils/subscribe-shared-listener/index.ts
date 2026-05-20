/**
 * Adds a callback to a shared `addEventListener`. Only one underlying
 * native listener is attached per (root, event type, phase); subscribers
 * join an in-JS registry that dispatches events along the DOM ancestry
 * of `event.target`.
 *
 * The model mirrors React's synthetic event system: a single root
 * listener handles every event of a given type, and callbacks bound to
 * an `Element` only fire when that element is on the target's path.
 * Callbacks bound to a `Document` always fire (document is the root of
 * every event in that document); callbacks bound to a `Window` always
 * fire as a flat fan-out, since `window` isn't on the DOM tree.
 *
 * @param target    `Element`, `Document`, or `Window` to bind the
 *                  callback to. For `Element`, the callback only fires
 *                  when the event happens on the element or a
 *                  descendant.
 * @param eventType DOM event name.
 * @param callback  Listener to be invoked with the event.
 * @param capture   Use the capture phase. Required when ancestor
 *                  listeners gate on `event.defaultPrevented`, since a
 *                  bubble-phase root listener fires after them. Defaults
 *                  to `false`.
 * @return Unsubscribe function.
 */
type Listener = ( event: Event ) => void;

// root -> eventTypeKey -> subscribedTarget -> Set<callback>
const registries = new WeakMap<
	EventTarget,
	Map< string, Map< EventTarget, Set< Listener > > >
>();

function getRoot( target: EventTarget ): EventTarget {
	// Detect Document / Window via duck typing (works across realms —
	// the iframe's `Document` constructor is distinct from the parent
	// window's, so `instanceof` is unreliable).
	if ( ( target as Document ).nodeType === 9 /* DOCUMENT_NODE */ ) {
		return target;
	}
	if ( ( target as Window ).window === target ) {
		return target;
	}
	// Assume Element/Node.
	return ( target as Node ).ownerDocument as Document;
}

export default function subscribeSharedListener(
	target: EventTarget,
	eventType: string,
	callback: Listener,
	capture: boolean = false
): () => void {
	const root = getRoot( target );
	// Duck-type detection (cross-realm safe).
	const isWindow = ( root as Window ).window === root;

	let perRoot = registries.get( root );
	if ( ! perRoot ) {
		perRoot = new Map();
		registries.set( root, perRoot );
	}
	const key = capture ? `${ eventType }:capture` : eventType;
	let perEvent = perRoot.get( key );
	if ( ! perEvent ) {
		perEvent = new Map< EventTarget, Set< Listener > >();
		perRoot.set( key, perEvent );
		const subscribers = perEvent;
		root.addEventListener(
			eventType,
			( event ) => {
				if ( isWindow ) {
					// Window has no DOM ancestry — fan out to all
					// window-bound callbacks.
					for ( const set of subscribers.values() ) {
						for ( const cb of set ) {
							cb( event );
						}
					}
					return;
				}
				// Walk the target → root ancestry, dispatching callbacks
				// for any node in the path. Bubble order matches the walk
				// direction, so dispatch inline (no path array). Capture
				// has to materialise the path to iterate in reverse.
				if ( capture ) {
					const path: Array< Node | Document > = [];
					let current: Node | null = event.target as Node | null;
					while ( current ) {
						path.push( current );
						if ( current === root ) {
							break;
						}
						current = current.parentNode;
					}
					for ( let i = path.length - 1; i >= 0; i-- ) {
						const set = subscribers.get( path[ i ] );
						if ( set ) {
							for ( const cb of set ) {
								cb( event );
							}
						}
					}
				} else {
					let current: Node | null = event.target as Node | null;
					while ( current ) {
						const set = subscribers.get( current );
						if ( set ) {
							for ( const cb of set ) {
								cb( event );
							}
						}
						if ( current === root ) {
							break;
						}
						current = current.parentNode;
					}
				}
			},
			capture
		);
	}
	let set = perEvent.get( target );
	if ( ! set ) {
		set = new Set();
		perEvent.set( target, set );
	}
	set.add( callback );
	return () => {
		set?.delete( callback );
	};
}
