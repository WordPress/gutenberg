/**
 * @param {string} nonce
 * @return {import('../types').APIFetchMiddleware & { nonce: string }} A middleware to enhance a request with a nonce.
 */
function createNonceMiddleware( nonce ) {
	/**
	 * @type {import('../types').APIFetchMiddleware & { nonce: string }}
	 */
	const middleware = ( options, next ) => {
		const { headers = {} } = options;

		// If an 'X-WP-Nonce' header (or any case-insensitive variation
		// thereof) was specified, no need to add a nonce header.
		for ( const headerName in headers ) {
			if (
				headerName.toLowerCase() === 'x-wp-nonce' &&
				headers[ headerName ] === middleware.nonce
			) {
				return next( options );
			}
		}

		return next( {
			...options,
			headers: {
				...headers,
				'X-WP-Nonce': middleware.nonce,
			},
		} );
	};

	middleware.nonce = nonce;

	return middleware;
}

export default createNonceMiddleware;
