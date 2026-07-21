// Block event handlers keyed by client ID, so the host can resolve them from
// the block hierarchy (getBlockParents). A ref is stored, not the handlers
// directly, so the host always calls the latest render's handlers.
const handlersByClientId = new Map();

// The event types any block has had a handler for. Append-only: a WeakMap
// cannot be enumerated to recompute this, and a type is never worth removing
// (the host just keeps a listener that finds no handler). The host attaches a
// native listener per type actually in use rather than a hardcoded list.
const eventTypes = new Set();
let eventTypesSnapshot = [];
const subscribers = new Set();

/**
 * Collects the `on*` event handlers from a set of props, e.g. a block's merged
 * `wrapperProps`, keyed by event type. The prop name is the event type
 * (`onKeyDown` handles `keydown`), so no per-event mapping is kept.
 *
 * @param {Object} props Props to read handlers from.
 *
 * @return {Object|undefined} The handlers by event type, or undefined when
 *                            there are none.
 */
export function getEventHandlers( props ) {
	let handlers;

	for ( const name in props ) {
		if ( /^on[A-Z]/.test( name ) && typeof props[ name ] === 'function' ) {
			handlers = handlers || {};
			handlers[ name.slice( 2 ).toLowerCase() ] = props[ name ];
		}
	}

	return handlers;
}

/**
 * Stores a block's handlers, keyed by its client ID.
 *
 * @param {string} clientId    Block client ID.
 * @param {Object} handlersRef Ref holding the block's handlers by event type.
 */
export function setBlockEventHandlers( clientId, handlersRef ) {
	handlersByClientId.set( clientId, handlersRef );
}

/**
 * @param {string} clientId Block client ID.
 */
export function deleteBlockEventHandlers( clientId ) {
	handlersByClientId.delete( clientId );
}

/**
 * Records the event types a block has handlers for, so the host listens for
 * them. Append-only.
 *
 * @param {Object} handlers Handlers by event type.
 */
export function noteEventTypes( handlers ) {
	let grew = false;
	for ( const type in handlers ) {
		if ( ! eventTypes.has( type ) ) {
			eventTypes.add( type );
			grew = true;
		}
	}

	if ( grew ) {
		eventTypesSnapshot = [ ...eventTypes ];
		subscribers.forEach( ( callback ) => callback() );
	}
}

/**
 * @param {string} clientId Block client ID.
 *
 * @return {Object|undefined} The block's current handlers by event type.
 */
export function getBlockEventHandlers( clientId ) {
	return handlersByClientId.get( clientId )?.current;
}

/**
 * Subscribes to changes in the set of event types in use.
 *
 * @param {Function} callback Called when the set changes.
 *
 * @return {Function} Unsubscribe function.
 */
export function subscribeEventTypes( callback ) {
	subscribers.add( callback );
	return () => subscribers.delete( callback );
}

/**
 * @return {string[]} The event types with a registered handler. Stable
 *                    reference until the set changes.
 */
export function getEventTypes() {
	return eventTypesSnapshot;
}
