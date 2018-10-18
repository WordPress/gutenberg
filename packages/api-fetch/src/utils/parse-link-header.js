/**
 * Accept a link header string and return an object describing specified links.
 *
 * Currently only supports rel="next". Could be replaced with parse-link-header
 * module from npm: implements the same interface.
 *
 * @param {string} linkHeader A link header string.
 * @return {Object|boolean} An object describing matched link relations, or null.
 */
export default ( linkHeader ) => {
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
