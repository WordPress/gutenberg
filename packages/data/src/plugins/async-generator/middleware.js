/**
 * Returns true if the given argument appears to be a dispatchable action.
 *
 * @param {*} action Object to test.
 *
 * @return {boolean} Whether object is action-like.
 */
function isActionLike( action ) {
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
function isAsyncIterable( object ) {
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
function isIterable( object ) {
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

		for ( const maybeAction of object ) {
			yield maybeAction;
		}
	}() );
}

/**
 * Simplest possible promise redux middleware.
 *
 * @param {Object} store Redux store.
 *
 * @return {function} middleware.
 */
const asyncGeneratorMiddleware = ( store ) => ( next ) => ( action ) => {
	if ( ! isAsyncIterable( action ) ) {
		return next( action );
	}

	const runtime = async ( fulfillment ) => {
		for await ( const maybeAction of fulfillment ) {
		// Dispatch if it quacks like an action.
			if ( isActionLike( maybeAction ) ) {
				store.dispatch( maybeAction );
			}
		}
	};

	return runtime( action );
};

export default asyncGeneratorMiddleware;
