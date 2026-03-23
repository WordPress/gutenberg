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
const { ValidationError } = require( './validate-config' );
const postProcessConfig = require( './post-process-config' );
const { createPortResolver } = require( '../resolve-available-ports' );

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
 * @param {string}      configDirectoryPath  The directory we want to load the config from.
 * @param {string|null} customConfigPath     Optional custom config file path.
 * @param {Object}      options              Options for loading the config.
 * @param {boolean}     options.resolvePorts Whether HTTP ports should be resolved for this command.
 * @param {boolean}     options.autoPort     CLI override for automatic port selection.
 * @param {Object}      options.spinner      A CLI spinner used by the port resolver.
 *
 * @return {Promise<WPConfig>} The config object we've loaded.
 */
module.exports = async function loadConfig(
	configDirectoryPath,
	customConfigPath = null,
	{ resolvePorts = false, autoPort, spinner } = {}
) {
	const configFilePath = getConfigFilePath(
		configDirectoryPath,
		'local',
		customConfigPath
	);

	// If a custom config path was provided, verify the file exists.
	if ( customConfigPath ) {
		try {
			await fs.stat( configFilePath );
		} catch ( error ) {
			throw new ValidationError(
				`Config file not found: ${ configFilePath }`
			);
		}
	}

	const cacheDirectoryPath = path.resolve(
		await getCacheDirectory(),
		md5( configFilePath )
	);

	// Parse any configuration we found in the given directory.
	// This comes merged and prepared for internal consumption.
	let config = await parseConfig(
		configDirectoryPath,
		cacheDirectoryPath,
		customConfigPath
	);

	let portResolver;
	if ( resolvePorts ) {
		let shouldAutoPort =
			autoPort !== undefined ? autoPort : config.autoPort;

		// Automatic port selection is undesirable in CI where determinism matters.
		if ( process.env.CI ) {
			shouldAutoPort = false;
		}

		if ( shouldAutoPort ) {
			portResolver = createPortResolver( spinner );
		}
	}

	// Make sure to perform any additional post-processing that
	// may be needed before the config object is ready for
	// consumption elsewhere in the tool.
	config = await postProcessConfig( config, { portResolver } );

	return {
		name: path.basename( configDirectoryPath ),
		dockerComposeConfigPath: path.resolve(
			cacheDirectoryPath,
			'docker-compose.yml'
		),
		configDirectoryPath,
		workDirectoryPath: cacheDirectoryPath,
		customConfigPath,
		testsEnvironment: config.testsEnvironment !== false,
		detectedLocalConfig: await hasLocalConfig( [
			configFilePath,
			getConfigFilePath(
				configDirectoryPath,
				'override',
				customConfigPath
			),
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
