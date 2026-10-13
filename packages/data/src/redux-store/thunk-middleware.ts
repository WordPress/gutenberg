import type { Middleware } from 'redux';

export default function createThunkMiddleware( args: unknown ): Middleware {
	return () => ( next ) => ( action ) => {
		if ( typeof action === 'function' ) {
			return action( args );
		}

		return next( action );
	};
}
