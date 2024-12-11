/**
 * External dependencies
 */
import isPromise from 'is-promise';
import type { Middleware } from 'redux';

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
