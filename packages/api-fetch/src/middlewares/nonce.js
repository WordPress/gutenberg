function createNonceMiddleware( nonce, middlewareOptions = {} ) {
	const { shouldSendNonce = sameHostFilter } = middlewareOptions;
	function middleware( options, next ) {
		const { headers = {} } = options;

		// If an 'X-WP-Nonce' header (or any case-insensitive variation
		// thereof) was specified, no need to add a nonce header.
		for ( const headerName in headers ) {
			if ( headerName.toLowerCase() === 'x-wp-nonce' ) {
				return next( options );
			}
		}

		if ( 'withNonce' in options && options.withNonce === false ) {
			return next( options );
		}

		if ( ! shouldSendNonce( options ) ) {
			return next( options );
		}

		return next( {
			...options,
			headers: {
				...headers,
				'X-WP-Nonce': middleware.nonce,
			},
		} );
	}

	middleware.nonce = nonce;

	return middleware;
}

export function sameHostFilter( options ) {
	// Same-host request, safe to send nonce
	if ( options.path && ! options.url ) {
		return true;
	}

	if ( options.url ) {
		const parsed = new URL( options.url );
		const current = window.location;
		// Same-host request, safe to send nonce
		if (
			parsed.host === current.host &&
			parsed.protocol === current.protocol
		) {
			return true;
		}
	}

	return false;
}

export default createNonceMiddleware;
