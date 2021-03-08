function createNonceMiddleware( nonce, middlewareOptions = {} ) {
	let { requestFilter, siteUrl } = middlewareOptions;
	if ( ! requestFilter ) {
		if ( siteUrl ) {
			requestFilter = createSameSiteFilter( siteUrl );
		} else {
			requestFilter = createSameHostFilter( window.location.href );
		}
	}
	function middleware( options, next ) {
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

		if ( 'withNonce' in options && options.withNonce === false ) {
			return next( options );
		}

		if ( ! requestFilter( options ) ) {
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

export default createNonceMiddleware;

export function createSameHostFilter( referenceUrl ) {
	return function ( options ) {
		if ( options.path && ! options.url ) {
			return true;
		}

		if ( options.url && isSameHost( options.url, referenceUrl ) ) {
			return true;
		}

		return false;
	};
}

function isSameHost( subjectUrl, referenceUrl ) {
	const parsed = new URL( subjectUrl );
	const reference = new URL( referenceUrl );
	return (
		parsed.host === reference.host && parsed.protocol === reference.protocol
	);
}

export function createSameSiteFilter( referenceUrl ) {
	return function ( options ) {
		if ( options.path && ! options.url ) {
			return isUnderPath( options.path, referenceUrl );
		}

		if (
			options.url &&
			isSameHost( options.url, referenceUrl ) &&
			isUnderPath( options.url, referenceUrl )
		) {
			return true;
		}

		return false;
	};
}
function isUnderPath( subjectUrl, referenceUrl ) {
	let targetPathname;
	if ( subjectUrl.startsWith( '/' ) ) {
		targetPathname = subjectUrl;
	} else {
		const parsed = new URL( subjectUrl );
		targetPathname = parsed.pathname;
	}
	const reference = new URL( referenceUrl );
	return (
		! reference.pathname || targetPathname.startsWith( reference.pathname )
	);
}
