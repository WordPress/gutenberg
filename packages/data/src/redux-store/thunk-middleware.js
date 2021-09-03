export default function createThunkMiddleware( args ) {
	return () => ( next ) => ( action ) => {
		if ( typeof action === 'function' ) {
			const retval = action( args );
			return retval;
		}

		return next( action );
	};
}
