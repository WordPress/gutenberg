/**
 * External dependencies
 */
const { resolve } = require( 'path' );

/**
 * @typedef {import('../config').Config} Config
 * @typedef {import('../config').Source} Source
 */

/**
 * @callback pathFinder
 * @return {?string} If found, an absolute path which works in the docker image.
 */

/**
 * Given a local path contained by one of the sources, returns the internal path.
 *
 * Note that the given local path must be included in the docker environment
 * already via one of the sources. The local path is for your local filesystem,
 * and the the internal path is for Docker filesystem.
 *
 * We look through plugins, themes, mappings, and the core source in that order
 * until finding the source which is a parent directory of the given path. We
 * then generate an absolute path based on the parent source which works in the
 * docker image.
 *
 * @param {Config} config Parsed wp-env config object.
 * @param {string} path   The local path which should be converted.
 * @return {?string} If found, the path to the
 */
module.exports = function getDockerPath( config, path ) {
	path = resolve( path );
	const pathFinders = [
		getPathFinder( path, config.pluginSources, true, 'wp-content/plugins' ),
		getPathFinder( path, config.themeSources, true, 'wp-content/themes' ),
		getPathFinder( path, config.mappings ),
		getPathFinder( path, [ config.coreSource ], false, '' ),
	];
	while ( pathFinders.length ) {
		// Removes the next path finder and calls it.
		const result = pathFinders.shift()();
		if ( result ) {
			return result;
		}
	}
	return null;
};

/**
 * Returns a function which computes the internal path of searchPath.
 *
 * Returns an absolute path which works in the docker container if the
 * searchPath is a child of one of the sources. Returns undefined if none of the
 * sources contain the searchPath.
 *
 * @param {string}  searchPath   The path value whose parent we are trying to find.
 * @param {Source[]|Object.<string, Source>} sources A collection of sources to
 *                               look through.
 * @param {boolean} withBasename If true, include the parent source's basename
 *                               in the returned internal docker path.
 * @param {string}  wpPath       If set, used for the internal WordPress path.
 *                               If not set, the key of the source in the sources
 *                               collection is assumed to be the internal path.
 *
 * @return {pathFinder} A function which when called, tries to compute the path.
 */
function getPathFinder(
	searchPath,
	sources,
	withBasename = false,
	wpPath = null
) {
	return () => {
		// If sources is an array, maybeWpPath is an array index. So we used the
		// the passed wpPath in that scenario.
		for ( const [ maybeWpPath, { path, basename } ] of Object.entries(
			sources
		) ) {
			// This works because searchPath and path are both absolute paths
			// for the local filesystem, so searchPath will start with the
			// entirety of the absolute path of any of its parent directories.
			if ( searchPath.startsWith( path ) ) {
				const internalPath = wpPath === null ? maybeWpPath : wpPath;
				const relativePath = searchPath.substring( path.length );

				return `/var/www/html/${ internalPath }${
					withBasename ? `/${ basename }` : ''
				}${ relativePath }`;
			}
		}
		return null;
	};
}
