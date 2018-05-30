/**
 * External dependencies
 */
import jQuery from 'jquery';

const wpApiSettings = window.wpApiSettings;

function apiRequest( options ) {
	options = apiRequest.buildAjaxOptions( options );
	return apiRequest.transport( options );
}

apiRequest.buildAjaxOptions = function( options ) {
	let url = options.url;
	let path = options.path;
	let namespaceTrimmed, endpointTrimmed, apiRoot;
	let headers, addNonceHeader, headerName;

	if (
		typeof options.namespace === 'string' &&
			typeof options.endpoint === 'string'
	) {
		namespaceTrimmed = options.namespace.replace( /^\/|\/$/g, '' );
		endpointTrimmed = options.endpoint.replace( /^\//, '' );
		if ( endpointTrimmed ) {
			path = namespaceTrimmed + '/' + endpointTrimmed;
		} else {
			path = namespaceTrimmed;
		}
	}
	if ( typeof path === 'string' ) {
		apiRoot = wpApiSettings.root;
		path = path.replace( /^\//, '' );

		// API root may already include query parameter prefix if site is
		// configured to use plain permalinks.
		if ( 'string' === typeof apiRoot && -1 !== apiRoot.indexOf( '?' ) ) {
			path = path.replace( '?', '&' );
		}

		url = apiRoot + path;
	}

	// If ?_wpnonce=... is present, no need to add a nonce header.
	addNonceHeader = ! ( options.data && options.data._wpnonce );

	headers = options.headers || {};

	// If an 'X-WP-Nonce' header (or any case-insensitive variation
	// thereof) was specified, no need to add a nonce header.
	if ( addNonceHeader ) {
		for ( headerName in headers ) {
			if ( headers.hasOwnProperty( headerName ) ) {
				if ( headerName.toLowerCase() === 'x-wp-nonce' ) {
					addNonceHeader = false;
					break;
				}
			}
		}
	}

	if ( addNonceHeader ) {
		// Do not mutate the original headers object, if any.
		headers = jQuery.extend( {
			'X-WP-Nonce': wpApiSettings.nonce,
		}, headers );
	}

	// Do not mutate the original options object.
	options = jQuery.extend( {}, options, {
		headers: headers,
		url: url,
	} );

	delete options.path;
	delete options.namespace;
	delete options.endpoint;

	return options;
};

apiRequest.transport = jQuery.ajax;

export default apiRequest;
