'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const getCacheDirectory = require( './get-cache-directory' );
const md5 = require( '../md5' );
const { parseConfig, getConfigFilePath } = require( './parse-config' );
const postProcessConfig = require( './post-process-config' );

/**
 * @typedef {import('./parse-config').WPRootConfig} WPRootConfig
 * @typedef {import('./parse-config').WPEnvironmentConfig} WPEnvironmentConfig
 */

/**
 * wp-env configuration.
 *
 * @typedef WPConfig
 * @property {string}                               name                    Name of the environment.
 * @property {string}                               configDirectoryPath     Path to the .wp-env.json file.
 * @property {string}                               workDirectoryPath       Path to the work directory located in ~/.wp-env.
 * @property {string}                               dockerComposeConfigPath Path to the docker-compose.yml file.
 * @property {boolean}                              detectedLocalConfig     If true, wp-env detected local config and used it.
 * @property {Object.<string, string>}              lifecycleScripts        Any lifecycle scripts that we might need to execute.
 * @property {Object.<string, WPEnvironmentConfig>} env                     Specific config for different environments.
 * @property {boolean}                              debug                   True if debug mode is enabled.
 */

/**
 * Loads any configuration from a given directory.
 *
 * @param {string} configDirectoryPath The directory we want to load the config from.
 *
 * @return {WPConfig} The config object we've loaded.
 */
module.exports = async function loadConfig( configDirectoryPath ) {
	const configFilePath = getConfigFilePath( configDirectoryPath );

	const cacheDirectoryPath = path.resolve(
		await getCacheDirectory(),
		md5( configFilePath )
	);

	// Parse any configuration we found in the given directory.
	// This comes merged and prepared for internal consumption.
	let config = await parseConfig( configDirectoryPath, cacheDirectoryPath );

	// Make sure to perform any additional post-processing that
	// may be needed before the config object is ready for
	// consumption elsewhere in the tool.
	config = postProcessConfig( config );

	return {
		name: path.basename( configDirectoryPath ),
		dockerComposeConfigPath: path.resolve(
			cacheDirectoryPath,
			'docker-compose.yml'
		),
		configDirectoryPath,
		workDirectoryPath: cacheDirectoryPath,
		detectedLocalConfig: await hasLocalConfig( [
			configFilePath,
			getConfigFilePath( configDirectoryPath, 'override' ),
		] ),
		lifecycleScripts: config.lifecycleScripts,
		env: config.env,
	};
};

/**
 * Checks to see whether or not there is any configuration present in the directory.
 *
 * @param {string[]} configFilePaths The config files we want to check for existence.
 *
 * @return {Promise<boolean>} A promise indicating whether or not a local config is present.
 */
async function hasLocalConfig( configFilePaths ) {
	for ( const filePath of configFilePaths ) {
		try {
			await fs.stat( filePath );
			return true;
		} catch {}
	}

	return false;
}
