export default function createThunkMiddleware( args ) {
	return () => ( next ) => ( action ) => {
		if ( typeof action === 'function' ) {
			return action( args );
		}

		return next( action );
	};
}
