/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

// Apply query arguments to both URL and Path, whichever is present.
const modifyQuery = ( { path, url, ...options }, queryArgs ) => ( {
	...options,
	url: url && addQueryArgs( url, queryArgs ),
	path: path && addQueryArgs( path, queryArgs ),
} );

// Duplicates parsing functionality from apiFetch.
const parseResponse = ( response ) => response.json ?
	response.json() :
	Promise.reject( response );

const parseLinkHeader = ( linkHeader ) => {
	if ( ! linkHeader ) {
		return {};
	}
	const match = linkHeader.match( /<([^>]+)>; rel="next"/ );
	return match ? {
		next: match[ 1 ],
	} : {};
};

const getNextPageUrl = ( response ) => {
	const { next } = parseLinkHeader( response.headers.get( 'link' ) );
	return next;
};

const requestContainsUnboundedQuery = ( options ) => {
	const pathIsUnbounded = options.path && options.path.indexOf( 'per_page=-1' ) !== -1;
	const urlIsUnbounded = options.url && options.url.indexOf( 'per_page=-1' ) !== -1;
	return pathIsUnbounded || urlIsUnbounded;
};

// The REST API enforces an upper limit on the per_page option. To handle large
// collections, apiFetch consumers can pass `per_page=-1`; this middleware will
// then recursively assemble a full response array from all available pages.
const fetchAllMiddleware = async ( options, next ) => {
	if ( options.parse === false ) {
		// If a consumer has opted out of parsing, do not apply middleware.
		return next( options );
	}
	if ( ! requestContainsUnboundedQuery( options ) ) {
		// If neither url nor path is requesting all items, do not apply middleware.
		return next( options );
	}

	// Retrieve requested page of results.
	const response = await next( {
		...modifyQuery( options, {
			per_page: 100,
		} ),
		// Ensure headers are returned for page 1.
		parse: false,
	} );

	const results = await parseResponse( response );

	if ( ! Array.isArray( results ) ) {
		// We have no reliable way of merging non-array results.
		return results;
	}

	let nextPage = getNextPageUrl( response );

	if ( ! nextPage ) {
		// There are no further pages to request.
		return results;
	}

	// Iteratively fetch all remaining pages until no "next" header is found.
	let mergedResults = [].concat( results );
	while ( nextPage ) {
		const nextResponse = await next( {
			...options,
			// Ensure the URL for the next page is used instead of any provided path.
			path: undefined,
			url: nextPage,
			// Ensure we still get headers so we can identify the next page.
			parse: false,
		} );
		const nextResults = await parseResponse( nextResponse );
		mergedResults = mergedResults.concat( nextResults );
		nextPage = getNextPageUrl( nextResponse );
	}
	return mergedResults;
};

export default fetchAllMiddleware;
