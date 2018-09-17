/**
 * Simplest possible promise redux middleware.
 *
 * @return {function} middleware.
 */
const promiseMiddleware = () => ( next ) => ( action ) => {
	if ( action instanceof Promise ) {
		return action.then( next );
	}

	return next( action );
};

export default promiseMiddleware;
