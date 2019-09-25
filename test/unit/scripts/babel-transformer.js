const fs = require( 'fs' );
const babelJest = require( 'babel-jest' );
const babelJestTransformer = babelJest.createTransformer();

module.exports = {
	// This transformer extends the babel-jest transformer.
	...babelJestTransformer,

	/**
	 * A cache key generator that extends babel-jest's cache key generator,
	 * but adds some additional handling for invalidating the cache when a
	 * change to a block.json file is made.
	 *
	 * @param {string} src      The source of the file being transformed.
	 * @param {string} filename The filename of the file being transformed.
	 * @param {...any} args     Any other args passed to the function.
	 *
	 * @return {string} The cache key for the file.
	 */
	getCacheKey( src, filename, ...args ) {
		const isBlockIndex = /block-library[\/\\]src[\/\\].+[\/\\]index\.js/.test( filename );

		if ( ! isBlockIndex ) {
			return babelJestTransformer.getCacheKey( src, filename, ...args );
		}

		const blockJSONFilename = filename.replace( 'index.js', 'block.json' );

		if ( ! fs.existsSync( blockJSONFilename ) ) {
			return babelJestTransformer.getCacheKey( src, filename, ...args );
		}

		// If the file is a block index file and there's a block json file, generate the
		// jest cache key for this file by concatenating the block index and block json
		// src together. This will result in the cache key changing and the cache being
		// invalidated for the index when any changes to the json are made.
		const blockJSONSrc = fs.readFileSync( blockJSONFilename );
		return babelJestTransformer.getCacheKey( `${ src }\n${ blockJSONSrc }`, filename, ...args );
	},
};
