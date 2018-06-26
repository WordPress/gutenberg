/**
 * External dependencies
 */
import { create, all } from 'rungen';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

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
 * Normalizes the given object argument to a sync iterable
 * yielding on a singular or array of generator yields or promise resolution.
 *
 * @param {*} object Object to normalize.
 *
 * @return {Generator} Iterable actions.
 */
export function toSyncIterable( object ) {
	// If it's an array make sure that each value is yielded separately
	if ( Array.isArray( object ) ) {
		object = all( object );
	}

	// Normalize as iterable...
	if ( isIterable( object ) ) {
		return object;
	}

	return ( function* () {
		return yield object;
	}() );
}

export default function createStoreRuntime( store ) {
	const actionControl = ( value, next ) => {
		if ( ! isActionLike( value ) ) {
			return false;
		}
		store.dispatch( value );
		next();
		return true;
	};

	const promiseControl = ( value, next, rungen, yieldNext, raiseNext ) => {
		if ( ! value || typeof value.then !== 'function' ) {
			return false;
		}
		value.then( yieldNext, raiseNext );
		return true;
	};

	const syncIterableRuntime = create( [
		promiseControl,
		actionControl,
	] );
	const asyncIterableRuntime = async ( actionCreator ) => {
		deprecated( 'Asynchronous generators support in Resolvers', {
			version: '3.3',
			alternative: 'Simple generators',
			plugin: 'Gutenberg',
		} );
		for await ( const maybeAction of actionCreator ) {
			// Dispatch if it quacks like an action.
			if ( isActionLike( maybeAction ) ) {
				store.dispatch( maybeAction );
			}
		}
	};

	return ( actionCreator, onSuccess ) => {
		if ( isAsyncIterable( actionCreator ) ) {
			// Todo dispatch deprecated
			asyncIterableRuntime( actionCreator ).then( onSuccess );
			return;
		}

		// Attempt to normalize the action creator as async iterable.
		actionCreator = toSyncIterable( actionCreator );
		syncIterableRuntime( actionCreator, onSuccess );
	};
}
