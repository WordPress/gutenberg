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
	// Swap back to requesting the max of 100 items per page.
	// TODO: This feels brittle. Is there a better way to manage request parameters?
	path: options.path && `${ options.path.replace( /(\&?per_page)=-1/, '$1=100' ) }&page=1`,
	url: options.url && `${ options.url.replace( /(\&?per_page)=-1/, '$1=100' ) }&page=1`,
} );

const setRequestedPage = ( options, page ) => ( {
	...options,
	path: options.path && options.path.replace( '&page=1', `&page=${ page }` ),
	url: options.url && options.url.replace( '&page=1', `&page=${ page }` ),
} );

// The REST API enforces an upper limit of 100 on the per_page option. To handle
// large collections, apiFetch consumers can pass `per_page=-1` and this middleware
// function will recursively assemble a full response by paging over all available
// pages of API data.
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
		const pageOneParsed = await parseResponse( pageOneResults, options.parse );

		const totalPages = pageOneResults.headers && pageOneResults.headers.get( 'X-WP-TotalPages' );

		// Build an array of options objects for each remaining page.
		const remainingPageRequests = Array.from( {
			length: totalPages - 1,
		} ).map( ( _, idx ) => {
			// Specify the page to request. First additional request is index 0 but page 2, etc.
			// Build these URLs based on pageOptions to avoid repeating the per_page adjustment.
			return setRequestedPage( pageOptions, idx + 2 );
		} );

		return remainingPageRequests.reduce(
			// Request each remaining page in sequence, and return a merged array.
			async ( previousPageRequest, nextPageOptions ) => {
				const resultsCollection = await previousPageRequest;
				// TODO: Circular dependency
				const nextPage = await apiFetch( nextPageOptions );
				return resultsCollection.concat( nextPage );
			},
			// Ensure that the first page is parsed properly, as specified in the original options.
			[].concat( pageOneParsed )
		);
	} catch ( e ) {
		return Promise.reject( e );
	}
};

export default fetchAllMiddleware;
