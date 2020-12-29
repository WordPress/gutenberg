'use strict';
/**
 * External dependencies
 */
const fs = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const { ValidationError } = require( './validate-config' );

/**
 * Reads the config JSON from the filesystem and returns it as a JS object
 * compatible with the env package.
 *
 * @param {string} name       The name of the file for error messages.
 * @param {string} configPath The path to the JSON file to read.
 *
 * @return {Object} the raw config data.
 */
module.exports = async function readRawConfigFile( name, configPath ) {
	try {
		return withBackCompat(
			JSON.parse( await fs.readFile( configPath, 'utf8' ) )
		);
	} catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			return null;
		} else if ( error instanceof SyntaxError ) {
			throw new ValidationError(
				`Invalid ${ name }: ${ error.message }`
			);
		} else {
			throw new ValidationError(
				`Could not read ${ name }: ${ error.message }`
			);
		}
	}
};

/**
 * Used to maintain back compatibility with older versions of the .wp-env.json
 * file. Returns an object in the shape of the currently expected .wp-env.json
 * version.
 *
 * @param {Object} rawConfig config right after being read from a file.
 * @return {Object} Same config with any old-format values converted into the
 *                  shape of the currently expected format.
 */
function withBackCompat( rawConfig ) {
	// Convert testsPort into new env.tests format.
	if ( rawConfig.testsPort !== undefined ) {
		rawConfig.env = {
			...( rawConfig.env || {} ),
			tests: {
				port: rawConfig.testsPort,
				...( rawConfig.env && rawConfig.env.tests
					? rawConfig.env.tests
					: {} ),
			},
		};
	}
	delete rawConfig.testsPort;
	return rawConfig;
}
