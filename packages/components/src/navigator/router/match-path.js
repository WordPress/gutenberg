/**
 * External dependencies
 */
import pathToRegexp from 'path-to-regexp';

const cache = {};
const cacheLimit = 10000;
let cacheCount = 0;

function compilePath( path, options ) {
	const cacheKey = `${ options.end }${ options.strict }${ options.sensitive }`;
	const pathCache = cache[ cacheKey ] || ( cache[ cacheKey ] = {} );

	if ( pathCache[ path ] ) return pathCache[ path ];

	const keys = [];
	const regexp = pathToRegexp( path, keys, options );
	const result = { keys, regexp };

	if ( cacheCount < cacheLimit ) {
		pathCache[ path ] = result;
		cacheCount++;
	}

	return result;
}

/**
 * Public API for matching a URL pathname to a path.
 *
 * @param {string}       pathname Pathname
 * @param {string|Array} options  Matching options.
 * @return {Object} Matched path details
 */
function matchPath( pathname, options = {} ) {
	if ( typeof options === 'string' || Array.isArray( options ) ) {
		options = { path: options };
	}

	const { exact = false, path, sensitive = false, strict = false } = options;

	const paths = [].concat( path );

	return paths.reduce( ( matched, currentPath ) => {
		if ( ! currentPath && currentPath !== '' ) return null;
		if ( matched ) return matched;

		const { keys, regexp } = compilePath( currentPath, {
			end: exact,
			sensitive,
			strict,
		} );
		const match = regexp.exec( pathname );

		if ( ! match ) return null;

		const [ url, ...values ] = match;
		const isExact = pathname === url;

		if ( exact && ! isExact ) return null;

		return {
			// the matched portion of the URL
			isExact,

			// whether or not we matched exactly
			params: keys.reduce( ( memo, key, index ) => {
				memo[ key.name ] = values[ index ];
				return memo;
			}, {} ),

			path: currentPath,
			// the path used to match
			url: currentPath === '/' && url === '' ? '/' : url,
		};
	}, null );
}

export default matchPath;
