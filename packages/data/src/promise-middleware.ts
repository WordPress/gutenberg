/**
 * External dependencies
 */
import type { Middleware } from 'redux';
import isPromise from 'is-promise';

/**
 * Simplest possible promise redux middleware.
 */
const promiseMiddleware: Middleware = () => ( next ) => ( action ) => {
	if ( isPromise( action ) ) {
		return action.then( ( resolvedAction ) => {
			if ( resolvedAction ) {
				return next( resolvedAction );
			}
			return undefined;
		} );
	}

	return next( action );
};

export default promiseMiddleware;
