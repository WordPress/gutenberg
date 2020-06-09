'use strict';
/**
 * External dependencies
 */
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const os = require( 'os' );
const crypto = require( 'crypto' );

/**
 * Internal dependencies
 */
const detectDirectoryType = require( './detect-directory-type' );
const { validateConfig, ValidationError } = require( './validate-config' );
const readRawConfigFile = require( './read-raw-config-file' );

/**
 * wp-env configuration.
 *
 * @typedef WPConfig
 * @property {string}      name                     Name of the environment.
 * @property {string}      configDirectoryPath      Path to the .wp-env.json file.
 * @property {string}      workDirectoryPath        Path to the work directory located in ~/.wp-env.
 * @property {string}      dockerComposeConfigPath  Path to the docker-compose.yml file.
 * @property {Object.<string, WPServiceConfig>} env Specific config for different services.
 * @property {boolean}     debug                    True if debug mode is enabled.
 */

/**
 * Base-level config for any particular service. (development/tests/etc)
 *
 * @typedef WPServiceConfig
 * @property {?WPSource}                 coreSource    The WordPress installation to load in the environment.
 * @property {WPSource[]}                pluginSources Plugins to load in the environment.
 * @property {WPSource[]}                themeSources  Themes to load in the environment.
 * @property {number}                    port          The port on which to start the development WordPress environment.
 * @property {Object}                    config        Mapping of wp-config.php constants to their desired values.
 * @property {Object.<string, WPSource>} mappings      Mapping of WordPress directories to local directories which should be mounted.
 */

/**
 * A WordPress installation, plugin or theme to be loaded into the environment.
 *
 * @typedef WPSource
 * @property {'local'|'git'|'zip'} type     The source type.
 * @property {string}              path     The path to the WordPress installation, plugin or theme.
 * @property {?string}             url      The URL to the source download if the source type is not local.
 * @property {?string}             ref      The git ref for the source if the source type is 'git'.
 * @property {string}              basename Name that identifies the WordPress installation, plugin or theme.
 */

/**
 * Reads, parses, and validates the given .wp-env.json file into a wp-env config
 * object for internal use.
 *
 * @param {string} configPath Path to the .wp-env.json file.
 *
 * @return {WPConfig} A wp-env config object.
 */
async function readConfig( configPath ) {
	const configDirectoryPath = path.dirname( configPath );
	const workDirectoryPath = path.resolve(
		await getHomeDirectory(),
		md5( configPath )
	);

	// The specified base configuration from .wp-env.json or from the local
	// source type which was automatically detected.
	const baseConfig =
		( await readRawConfigFile( '.wp-env.json', configPath ) ) ||
		getDefaultBaseConfig();

	// Overriden .wp-env.json on a per-user case.
	const overrideConfig =
		( await readRawConfigFile(
			'.wp-env.override.json',
			configPath.replace( /\.wp-env\.json$/, '.wp-env.override.json' )
		) ) || {};

	// A handy merge function which lets us deep-merge the wp-config values
	// instead of overwriting them. This is for merging environment
	const mergeWpServiceConfigs = ( ...configs ) => {
		// Returns an array of nested values in the config object. For example,
		// an array of all the wp-config objects.
		const getNestedValues = ( key, defaultValue = {} ) =>
			configs.map( ( config ) => config[ key ] || defaultValue );

		return {
			...Object.assign( {}, ...configs ),
			config: {
				...Object.assign( {}, ...getNestedValues( 'config' ) ),
			},
		};
	};

	// Configuration applicable to all environments.
	const defaultWpServiceConfig = mergeWpServiceConfigs(
		{
			core: null,
			plugins: [],
			themes: [],
			port: 8888,
			mappings: {},
			config: {
				WP_DEBUG: true,
				SCRIPT_DEBUG: true,
				WP_PHP_BINARY: 'php',
				WP_TESTS_EMAIL: 'admin@example.org',
				WP_TESTS_TITLE: 'Test Blog',
				WP_TESTS_DOMAIN: 'http://localhost',
				WP_SITEURL: 'http://localhost',
				WP_HOME: 'http://localhost',
			},
		},
		baseConfig,
		overrideConfig
	);

	// Configuration specific to each environment. Will be merged with any
	// other specified environments.
	const environmentDefaults = {
		env: {
			development: {}, // No overrides needed, but it should exist.
			tests: {
				config: { WP_DEBUG: false, SCRIPT_DEBUG: false },
				port: 8889,
			},
		},
	};

	// A unique array of the environments specified in the config options.
	// Needed so that we can override settings per-environment, rather than
	// overwriting each environment key.
	const getEnvKeys = ( config ) => Object.keys( config.env || {} );
	const allEnvs = [
		...new Set( [
			...getEnvKeys( environmentDefaults ),
			...getEnvKeys( baseConfig ),
			...getEnvKeys( overrideConfig ),
		] ),
	];

	const getEnvConfig = ( config, envName ) =>
		config.env && config.env[ envName ] ? config.env[ envName ] : {};

	// Merge each of the specified environment-level overrides.
	const env = allEnvs.reduce( ( result, environment ) => {
		result[ environment ] = validateConfig(
			mergeWpServiceConfigs(
				defaultWpServiceConfig,
				getEnvConfig( environmentDefaults, environment ),
				getEnvConfig( baseConfig, environment ),
				getEnvConfig( overrideConfig, environment )
			),
			{
				workDirectoryPath,
				environment,
			}
		);
		return result;
	}, {} );

	return withOverrides( {
		name: path.basename( configDirectoryPath ),
		dockerComposeConfigPath: path.resolve(
			workDirectoryPath,
			'docker-compose.yml'
		),
		configDirectoryPath,
		workDirectoryPath,
		env,
	} );
}

async function getDefaultBaseConfig( configPath ) {
	const configDirectoryPath = path.dirname( configPath );
	const type = await detectDirectoryType( configDirectoryPath );

	if ( type === 'core' ) {
		return { core: '.' };
	} else if ( type === 'plugin' ) {
		return { plugins: [ '.' ] };
	} else if ( type === 'theme' ) {
		return { themes: [ '.' ] };
	}

	throw new ValidationError(
		`No .wp-env.json file found at '${ configPath }' and could not determine if '${ configDirectoryPath }' is a WordPress installation, a plugin, or a theme.`
	);
}

/**
 * Overrides keys in the config object with set environment variables or options
 * which should be merged.
 *
 * @param {WPConfig} config fully parsed configuration object.
 * @return {WPConfig} configuration object with overrides applied.
 */
function withOverrides( config ) {
	// Override port numbers with environment variables.
	config.env.development.port =
		getNumberFromEnvVariable( 'WP_ENV_PORT' ) ||
		config.env.development.port;
	config.env.tests.port =
		getNumberFromEnvVariable( 'WP_ENV_TESTS_PORT' ) ||
		config.env.tests.port;

	const updateEnvUrl = (
		configKey,
		environments = [ 'development', 'tests' ]
	) => {
		environments.forEach( ( envKey ) => {
			try {
				const baseUrl = new URL(
					config.env[ envKey ].config[ configKey ]
				);
				baseUrl.port = config.env[ envKey ].port;
				config.env[ envKey ].config[ configKey ] = baseUrl.toString();
			} catch ( error ) {
				throw new ValidationError(
					`Invalid .wp-env.json: config.${ configKey } must be a valid URL.`
				);
			}
		} );
	};

	// Update wp config options to include the correct port number in the URL.
	updateEnvUrl( 'WP_TESTS_DOMAIN' );
	updateEnvUrl( 'WP_SITEURL' );
	updateEnvUrl( 'WP_HOME' );

	return config;
}

/**
 * Parses an environment variable which should be a number.
 *
 * Throws an error if the variable cannot be parsed to a number.
 * Returns null if the environment variable has not been specified.
 *
 * @param {string} varName The environment variable to check (e.g. WP_ENV_PORT).
 * @return {null|number} The number. Null if it does not exist.
 */
function getNumberFromEnvVariable( varName ) {
	// Allow use of the default if it does not exist.
	if ( ! process.env[ varName ] ) {
		return null;
	}

	const maybeNumber = parseInt( process.env[ varName ] );

	// Throw an error if it is not parseable as a number.
	if ( isNaN( maybeNumber ) ) {
		throw new ValidationError(
			`Invalid environment variable: ${ varName } must be a number.`
		);
	}

	return maybeNumber;
}

/**
 * Gets the `wp-env` home directory in which generated files are created.
 *
 * By default, '~/.wp-env/'. On Linux, '~/wp-env/'. Can be overriden with the
 * WP_ENV_HOME environment variable.
 *
 * @return {Promise<string>} The absolute path to the `wp-env` home directory.
 */
async function getHomeDirectory() {
	// Allow user to override download location.
	if ( process.env.WP_ENV_HOME ) {
		return path.resolve( process.env.WP_ENV_HOME );
	}

	/**
	 * Installing docker with Snap Packages on Linux is common, but does not
	 * support hidden directories. Therefore we use a public directory on Linux.
	 *
	 * @see https://github.com/WordPress/gutenberg/issues/20180#issuecomment-587046325
	 */
	return path.resolve(
		os.homedir(),
		!! ( await fs.stat( '/snap' ).catch( () => false ) )
			? 'wp-env'
			: '.wp-env'
	);
}

/**
 * Hashes the given string using the MD5 algorithm.
 *
 * @param {string} data The string to hash.
 * @return {string} An MD5 hash string.
 */
function md5( data ) {
	return crypto.createHash( 'md5' ).update( data ).digest( 'hex' );
}

module.exports = {
	ValidationError,
	readConfig,
};
