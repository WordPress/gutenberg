/**
 * Simplest possible promise redux middleware.
 *
 * @return {function} middleware.
 */
const promiseMiddleware = () => ( next ) => ( action ) => {
	if ( action instanceof Promise ) {
		return action.then( ( resolvedAction ) => {
			if ( resolvedAction ) {
				return next( resolvedAction );
			}
		} );
	}

	return next( action );
};

export default promiseMiddleware;
