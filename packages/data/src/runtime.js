
/**
 * Returns true if the given argument appears to be a dispatchable action.
 *
 * @param {*} action Object to test.
 *
 * @return {boolean} Whether object is action-like.
 */
export function isActionLike( action ) {
	return (
		!! action &&
		typeof action.type === 'string'
	);
}

/**
 * Returns true if the given object is an async iterable, or false otherwise.
 *
 * @param {*} object Object to test.
 *
 * @return {boolean} Whether object is an async iterable.
 */
export function isAsyncIterable( object ) {
	return (
		!! object &&
		typeof object[ Symbol.asyncIterator ] === 'function'
	);
}

/**
 * Returns true if the given object is iterable, or false otherwise.
 *
 * @param {*} object Object to test.
 *
 * @return {boolean} Whether object is iterable.
 */
export function isIterable( object ) {
	return (
		!! object &&
		typeof object[ Symbol.iterator ] === 'function'
	);
}

/**
 * Normalizes the given object argument to an async iterable, asynchronously
 * yielding on a singular or array of generator yields or promise resolution.
 *
 * @param {*} object Object to normalize.
 *
 * @return {AsyncGenerator} Async iterable actions.
 */
export function toAsyncIterable( object ) {
	if ( isAsyncIterable( object ) ) {
		return object;
	}

	return ( async function* () {
		// Normalize as iterable...
		if ( ! isIterable( object ) ) {
			object = [ object ];
		}

		for ( let maybeAction of object ) {
			// ...of Promises.
			if ( ! ( maybeAction instanceof Promise ) ) {
				maybeAction = Promise.resolve( maybeAction );
			}

			yield await maybeAction;
		}
	}() );
}

export default function createStoreRuntime( store ) {
	return async ( actionCreator ) => {
		if ( isActionLike( actionCreator ) ) {
			store.dispatch( actionCreator );
			return actionCreator;
		}

		// Attempt to normalize the action creator as async iterable.
		actionCreator = toAsyncIterable( actionCreator );
		let ret;
		do {
			ret = await actionCreator.next();
			// Dispatch if it quacks like an action.
			if ( isActionLike( ret.value ) ) {
				store.dispatch( ret.value );
			}
		} while ( ! ret.done );

		return ret.value;
	};
}
