/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' ).promises;

/**
 * Options for cache parsing.
 *
 * @typedef WPEnvCacheOptions
 * @property {string} workDirectoryPath Path to the work directory located in ~/.wp-env.
 */

const CACHE_FILE_NAME = 'wp-env-cache.json';

/**
 * This function can be used to compare a possible new cache value against an
 * existing cache value. For example, we can use this to check if the configuration
 * has changed in a new run of wp-env start.
 *
 * @param {string}            key     A unique identifier for the cache.
 * @param {any}               value   The value to check against the existing cache.
 * @param {WPEnvCacheOptions} options Parsing options
 *
 * @return {boolean} If true, the value is different from the cache which exists.
 */
async function didCacheChange( key, value, options ) {
	const existingValue = await getCache( key, options );
	return value !== existingValue;
}

/**
 * This function persists the given cache value to the cache file. It creates the
 * file if it does not exist yet, and overwrites the existing cache value for the
 * given key if it already exists.
 *
 * @param {string}            key     A unique identifier for the cache.
 * @param {any}               value   The value to persist.
 * @param {WPEnvCacheOptions} options Parsing options
 */
async function setCache( key, value, options ) {
	const existingCache = await getCacheFile( options );
	existingCache[ key ] = value;

	await fs.writeFile(
		getPathToCacheFile( options.workDirectoryPath ),
		JSON.stringify( existingCache )
	);
}

/**
 * This function retrieves the cache associated with the given key from the file.
 * Returns undefined if the key does not exist or if the cache file has not been
 * created yet.
 *
 * @param {string}            key     The unique identifier for the cache value.
 * @param {WPEnvCacheOptions} options Parsing options
 *
 * @return {any?} The cache value. Undefined if it has not been set or if the cache
 *                file has not been created.
 */
async function getCache( key, options ) {
	const cache = await getCacheFile( options );
	return cache[ key ];
}

/**
 * Returns the data stored in the cache file as a JS object. Instead of throwing
 * an error, simply returns an empty object if the file cannot be retrieved.
 *
 * @param {WPEnvCacheOptions} options Parsing options
 *
 * @return {Object} The data from the cache file. Empty if the file does not exist.
 */
async function getCacheFile( { workDirectoryPath } ) {
	const filename = getPathToCacheFile( workDirectoryPath );
	try {
		const rawCache = await fs.readFile( filename );
		return JSON.parse( rawCache );
	} catch {
		return {};
	}
}

function getPathToCacheFile( workDirectoryPath ) {
	return path.resolve( workDirectoryPath, CACHE_FILE_NAME );
}

module.exports = { didCacheChange, setCache, getCache, getCacheFile };
