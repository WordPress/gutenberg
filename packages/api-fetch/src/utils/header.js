/**
 * Accept a link header string and return an object describing specified links.
 *
 * TODO: Consider replacing with parse-link-header npm package.
 *
 * This function returns the same shape of object as that module, but only
 * supports the "next" relation.
 *
 * @param {string} linkHeader A link header string.
 * @return {Object|boolean} An object describing matched link relations, or null.
 */
export const parseLinkHeader = ( linkHeader ) => {
	if ( ! linkHeader ) {
		return null;
	}
	const match = linkHeader.match( /<([^>]+)>; rel="next"/ );
	return match && {
		next: {
			rel: 'next',
			url: match[ 1 ],
		},
	};
};

/**
 * Return the "next" relation from a fetch response object's link header.
 *
 * @param {Object} response A fetch response object.
 * @return {string|null} The URL of the next page, or null.
 */
export const getNextLinkFromResponse = ( response ) => {
	const linkHeader = response.headers && response.headers.get( 'link' );
	if ( ! linkHeader ) {
		return null;
	}
	const links = parseLinkHeader( linkHeader );
	if ( ! links || ! links.next || ! links.next.url ) {
		return null;
	}
	return links.next.url;
};
