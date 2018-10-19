/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import apiFetch from '../';

// Duplicates parsing functionality from apiFetch.
function parseResponse( response, parse = true ) {
	if ( parse ) {
		return response.json ? response.json() : Promise.reject( response );
	}

	return response;
}

const capPerPageQuery = ( options ) => ( {
	...options,
	// Swap back to requesting the max number of items per page.
	path: options.path && addQueryArgs( options.path, {
		per_page: 100,
		page: 1,
	} ),
	url: options.url && addQueryArgs( options.url, {
		per_page: 100,
		page: 1,
	} ),
} );

const setRequestedPage = ( options, page ) => ( {
	...options,
	path: options.path && addQueryArgs( options.path, {
		page,
	} ),
	url: options.url && addQueryArgs( options.url, {
		page,
	} ),
} );

// The REST API enforces an upper limit on the per_page option. To handle large
// collections, apiFetch consumers can pass `per_page=-1`; this middleware will
// then recursively assemble a full response array from all available pages.
const fetchAllMiddleware = async ( options, next ) => {
	try {
		if ( options.url && options.url.indexOf( 'per_page=-1' ) < 0 ) {
			return next( options );
		}

		const pageOptions = capPerPageQuery( options );
		const pageOneResults = await next( {
			...pageOptions,
			// Ensure headers are returned for page 1.
			parse: false,
		} );

		const totalPages = pageOneResults.headers && pageOneResults.headers.get( 'X-WP-TotalPages' );

		// Build an array of options objects for each remaining page.
		const remainingPageRequests = Array.from( {
			length: totalPages - 1,
		} ).map( ( _, idx ) => {
			// Specify the page to request. First additional request is index 0 but page 2, etc.
			return setRequestedPage( pageOptions, idx + 2 );
		} );

		// Ensure the first page is parsed as specified.
		const pageOneParsed = await parseResponse( pageOneResults, options.parse );

		return remainingPageRequests.reduce(
			// Request each remaining page in sequence, and return a merged array.
			async ( previousPageRequest, nextPageOptions ) => {
				const resultsCollection = await previousPageRequest;
				const nextPage = await apiFetch( nextPageOptions );
				return resultsCollection.concat( nextPage );
			},
			[].concat( pageOneParsed )
		);
	} catch ( e ) {
		return Promise.reject( e );
	}
};

export default fetchAllMiddleware;
