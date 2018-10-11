/**
 * External dependencies
 */
import isPromise from 'is-promise';

/**
 * Simplest possible promise redux middleware.
 *
 * @return {function} middleware.
 */
const promiseMiddleware = () => ( next ) => ( action ) => {
	if ( isPromise( action ) ) {
		return action.then( ( resolvedAction ) => {
			if ( resolvedAction ) {
				return next( resolvedAction );
			}
		} );
	}

	return next( action );
};

export default promiseMiddleware;
