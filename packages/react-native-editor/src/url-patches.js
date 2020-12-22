// This provides a simple patch for the unimplemented URL.prototype.search
// getter - it removes any existing URL fragment, and returns the string
// following (and including) the first '?'
// This is needed for certain middlewares used in api-fetch which process URL
// parameters, and they are incorrectly merged when this is left unimplemented.
Object.defineProperties( global.URL.prototype, {
	search: {
		get() {
			const queryParameters = this._url
				.split( '#' )[ 0 ]
				.split( '?' )
				.slice( 1 )
				.join( '?' );
			return queryParameters ? `?${ queryParameters }` : '';
		},
	},
} );
