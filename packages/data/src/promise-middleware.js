/**
 * WordPress dependencies
 */
import { isPromise } from '@wordpress/redux-routine';

/**
 * Simplest possible promise redux middleware.
 *
 * @return {Function} middleware.
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
