'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const readRawConfigFile = require( './read-raw-config-file' );
const {
	parseSourceString,
	includeTestsPath,
} = require( './parse-source-string' );
const {
	ValidationError,
	checkPort,
	checkStringArray,
	checkObjectWithValues,
	checkVersion,
	checkValidURL,
} = require( './validate-config' );
const getConfigFromEnvironmentVars = require( './get-config-from-environment-vars' );
const detectDirectoryType = require( './detect-directory-type' );
const { getLatestWordPressVersion } = require( '../wordpress' );
const mergeConfigs = require( './merge-configs' );

/**
 * @typedef {import('./parse-source-string').WPSource} WPSource
 */

/**
 * The root configuration options.
 *
 * @typedef WPRootConfigOptions
 * @property {number}                               port                          The port to use in the development environment.
 * @property {number}                               testsPort                     The port to use in the tests environment.
 * @property {Object.<string, string|null>}         lifecycleScripts              The scripts to run at certain points in the command lifecycle.
 * @property {Object.<string, string|null>}         lifecycleScripts.afterStart   The script to run after the "start" command has completed.
 * @property {Object.<string, string|null>}         lifecycleScripts.afterClean   The script to run after the "clean" command has completed.
 * @property {Object.<string, string|null>}         lifecycleScripts.afterDestroy The script to run after the "destroy" command has completed.
 * @property {Object.<string, WPEnvironmentConfig>} env                           The environment-specific configuration options.
 */

/**
 * The environment-specific configuration options. (development/tests/etc)
 *
 * @typedef WPEnvironmentConfig
 * @property {WPSource}                  coreSource    The WordPress installation to load in the environment.
 * @property {WPSource[]}                pluginSources Plugins to load in the environment.
 * @property {WPSource[]}                themeSources  Themes to load in the environment.
 * @property {number}                    port          The port to use.
 * @property {Object}                    config        Mapping of wp-config.php constants to their desired values.
 * @property {Object.<string, WPSource>} mappings      Mapping of WordPress directories to local directories which should be mounted.
 * @property {string|null}               phpVersion    Version of PHP to use in the environments, of the format 0.0.
 */

/**
 * The root configuration options.
 *
 * @typedef {WPEnvironmentConfig & WPRootConfigOptions} WPRootConfig
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
 * An object containing all of the default configuration options for environment-specific configurations.
 * Unless otherwise set at the root-level or the environment-level, these are the values that will be
 * parsed into the environment. This is useful for tracking known configuration options since these
 * are the only configuration options that can be set in each environment.
 */
const DEFAULT_ENVIRONMENT_CONFIG = {
	core: null,
	phpVersion: null,
	plugins: [],
	themes: [],
	port: 8888,
	testsPort: 8889,
	mappings: {},
	config: {
		FS_METHOD: 'direct',
		WP_DEBUG: true,
		SCRIPT_DEBUG: true,
		WP_ENVIRONMENT_TYPE: 'local',
		WP_PHP_BINARY: 'php',
		WP_TESTS_EMAIL: 'admin@example.org',
		WP_TESTS_TITLE: 'Test Blog',
		WP_TESTS_DOMAIN: 'localhost',
		WP_SITEURL: 'http://localhost',
		WP_HOME: 'http://localhost',
	},
};

/**
 * Given a directory, this parses any relevant config files and
 * constructs an object in the format used internally.
 *
 *
 * @param {string} configDirectoryPath A path to the directory we are parsing the config for.
 * @param {string} cacheDirectoryPath  Path to the work directory located in ~/.wp-env.
 *
 * @return {Promise<WPRootConfig>} Parsed config.
 */
async function parseConfig( configDirectoryPath, cacheDirectoryPath ) {
	// The local config will be used to override any defaults.
	const localConfig = await parseConfigFile(
		getConfigFilePath( configDirectoryPath ),
		{ cacheDirectoryPath }
	);

	// Any overrides that can be used in place
	// of properties set by the local config.
	const overrideConfig = await parseConfigFile(
		getConfigFilePath( configDirectoryPath, 'override' ),
		{ cacheDirectoryPath }
	);

	// It's important to know whether or not the user
	// has configured the tool using a JSON file.
	const hasUserConfig = localConfig || overrideConfig;

	// The default config will be used when no local config
	// file is present in this directory. We should also
	// infer the project type when there is no local
	// config file present to use.
	const defaultConfig = await getDefaultConfig( configDirectoryPath, {
		shouldInferType: ! hasUserConfig,
		cacheDirectoryPath,
	} );

	// Users can provide overrides in environment
	// variables that supercede all other options.
	const environmentVarOverrides =
		getEnvironmentVarOverrides( cacheDirectoryPath );

	// Merge all of our configs so that we have a complete object
	// containing the desired options in order of precedence.
	return mergeConfigs(
		defaultConfig,
		localConfig ?? {},
		overrideConfig ?? {},
		environmentVarOverrides
	);
}

/**
 * Gets the path to the config file.
 *
 * @param {string} configDirectoryPath The path to the directory containing config files.
 * @param {string} type                The type of config file we're interested in: 'local' or 'override'.
 *
 * @return {string} The path to the config file.
 */
function getConfigFilePath( configDirectoryPath, type = 'local' ) {
	let fileName;
	switch ( type ) {
		case 'local': {
			fileName = '.wp-env.json';
			break;
		}

		case 'override': {
			fileName = '.wp-env.override.json';
			break;
		}

		default: {
			throw new Error( `Invalid config file type "${ type }.` );
		}
	}

	return path.resolve( configDirectoryPath, fileName );
}

/**
 * Gets the default config that can be overridden.
 *
 * @param {string} configDirectoryPath        A path to the config file's directory.
 * @param {Object} options
 * @param {string} options.shouldInferType    Indicates whether or not we should infer the type of project wp-env is being used in.
 * @param {string} options.cacheDirectoryPath Path to the work directory located in ~/.wp-env.
 *
 * @return {Promise<WPEnvironmentConfig>} The default config object.
 */
async function getDefaultConfig(
	configDirectoryPath,
	{ shouldInferType, cacheDirectoryPath }
) {
	const detectedDirectoryType = shouldInferType
		? await detectDirectoryType( configDirectoryPath )
		: null;

	// The default configuration should contain all possible options and
	// environments whether they're empty or not. This makes using the
	// config objects easier because once merged we don't need to
	// verify that a given option exists before using it.
	const rawConfig = {
		// Since the root config is the base "environment" config for
		// all environments, we will start with those defaults.
		...DEFAULT_ENVIRONMENT_CONFIG,

		// When the current directory has no configuration file we support a zero-config mode of operation.
		// This works by using the default options and inferring how to map the current directory based
		// on the contents of the directory.
		core:
			detectedDirectoryType === 'core'
				? '.'
				: DEFAULT_ENVIRONMENT_CONFIG.core,
		plugins:
			detectedDirectoryType === 'plugin'
				? [ '.' ]
				: DEFAULT_ENVIRONMENT_CONFIG.plugins,
		themes:
			detectedDirectoryType === 'theme'
				? [ '.' ]
				: DEFAULT_ENVIRONMENT_CONFIG.themes,

		// These configuration options are root-only and should not be present
		// on environment-specific configuration objects.
		lifecycleScripts: {
			afterStart: null,
			afterClean: null,
			afterDestroy: null,
		},
		env: {
			development: {},
			tests: {
				config: {
					WP_DEBUG: false,
					SCRIPT_DEBUG: false,
				},
			},
		},
	};

	return await parseRootConfig( 'default', rawConfig, {
		cacheDirectoryPath,
	} );
}

/**
 * Gets a service configuration object containing overrides from our environment variables.
 *
 * @param {string} cacheDirectoryPath Path to the work directory located in ~/.wp-env.
 *
 * @return {WPEnvironmentConfig} An object containing the environment variable overrides.
 */
function getEnvironmentVarOverrides( cacheDirectoryPath ) {
	const overrides = getConfigFromEnvironmentVars( cacheDirectoryPath );

	// Create a service config object so we can merge it with the others
	// and override anything that the configuration options need to.
	const overrideConfig = {
		lifecycleScripts: overrides.lifecycleScripts,
		env: {
			development: {},
			tests: {},
		},
	};

	// We're going to take care to set it at both the root-level and the
	// environment level. This is not totally necessary, but, it's a
	// better representation of how broad the override is.

	if ( overrides.port ) {
		overrideConfig.port = overrides.port;
		overrideConfig.env.development.port = overrides.port;
	}

	if ( overrides.testsPort ) {
		overrideConfig.testsPort = overrides.testsPort;
		overrideConfig.env.tests.port = overrides.testsPort;
	}

	if ( overrides.coreSource ) {
		overrideConfig.coreSource = overrides.coreSource;
		overrideConfig.env.development.coreSource = overrides.coreSource;
		overrideConfig.env.tests.coreSource = overrides.coreSource;
	}

	if ( overrides.phpVersion ) {
		overrideConfig.phpVersion = overrides.phpVersion;
		overrideConfig.env.development.phpVersion = overrides.phpVersion;
		overrideConfig.env.tests.phpVersion = overrides.phpVersion;
	}

	return overrideConfig;
}

/**
 * Parses a raw config into an unvalidated service config.
 *
 * @param {string} configFile                 The config file that we're parsing.
 * @param {Object} options
 * @param {string} options.cacheDirectoryPath Path to the work directory located in ~/.wp-env.
 *
 * @return {Promise<WPRootConfig|null>} The parsed root config object.
 */
async function parseConfigFile( configFile, options ) {
	const rawConfig = await readRawConfigFile( configFile );
	if ( ! rawConfig ) {
		return null;
	}

	return await parseRootConfig( configFile, rawConfig, options );
}

/**
 * Parses the root config object.
 *
 * @param {string} configFile                 The config file we're parsing.
 * @param {Object} rawConfig                  The raw config we're parsing.
 * @param {Object} options
 * @param {string} options.cacheDirectoryPath Path to the work directory located in ~/.wp-env.
 *
 * @return {Promise<WPRootConfig>} The root config object.
 */
async function parseRootConfig( configFile, rawConfig, options ) {
	const parsedConfig = await parseEnvironmentConfig(
		configFile,
		null,
		rawConfig,
		{
			...options,
			rootConfig: true,
		}
	);

	// Parse any root-only options.
	if ( rawConfig.testsPort !== undefined ) {
		checkPort( configFile, `testsPort`, rawConfig.testsPort );
		parsedConfig.testsPort = rawConfig.testsPort;
	}
	parsedConfig.lifecycleScripts = {};
	if ( rawConfig.lifecycleScripts ) {
		checkObjectWithValues(
			configFile,
			'lifecycleScripts',
			rawConfig.lifecycleScripts,
			[ 'null', 'string' ],
			true
		);
		parsedConfig.lifecycleScripts = rawConfig.lifecycleScripts;
	}

	// Parse the environment-specific configs so they're accessible to the root.
	parsedConfig.env = {};
	if ( rawConfig.env ) {
		checkObjectWithValues(
			configFile,
			'env',
			rawConfig.env,
			[ 'object' ],
			false
		);
		for ( const env in rawConfig.env ) {
			parsedConfig.env[ env ] = await parseEnvironmentConfig(
				configFile,
				env,
				rawConfig.env[ env ],
				options
			);
		}
	}

	return parsedConfig;
}

/**
 * Parses and validates a raw config object and returns a validated service config to use internally.
 *
 * @param {string}      configFile                 The config file that we're parsing.
 * @param {string|null} environment                If set, the environment that we're parsing the config for.
 * @param {Object}      config                     A config object to parse.
 * @param {Object}      options
 * @param {string}      options.cacheDirectoryPath Path to the work directory located in ~/.wp-env.
 * @param {boolean}     options.rootConfig         Indicates whether or not this is the root config object.
 *
 * @return {Promise<WPEnvironmentConfig>} The environment config object.
 */
async function parseEnvironmentConfig(
	configFile,
	environment,
	config,
	options
) {
	if ( ! config ) {
		return {};
	}

	const environmentPrefix = environment ? environment + '.' : '';

	// Before we move forward with parsing we should make sure that there aren't any
	// configuration options that do not exist. This helps prevent silent failures
	// when a user sets up their configuration incorrectly.
	for ( const key in config ) {
		if ( DEFAULT_ENVIRONMENT_CONFIG[ key ] !== undefined ) {
			continue;
		}

		// We should also check root-only options for the root config
		// because these aren't part of the above defaults but are
		// configuration options that we will parse.
		switch ( key ) {
			case 'testsPort':
			case 'lifecycleScripts':
			case 'env': {
				if ( options.rootConfig ) {
					continue;
				}

				break;
			}
		}

		throw new ValidationError(
			`Invalid ${ configFile }: "${ environmentPrefix }${ key }" is not a configuration option.`
		);
	}

	// Parse each option individually so that we can handle the validation
	// and any conversion that is required to use the option.
	const parsedConfig = {};

	if ( config.port !== undefined ) {
		checkPort( configFile, `${ environmentPrefix }port`, config.port );
		parsedConfig.port = config.port;
	}

	if ( config.phpVersion !== undefined ) {
		// Support null as a valid input.
		if ( config.phpVersion !== null ) {
			checkVersion(
				configFile,
				`${ environmentPrefix }phpVersion`,
				config.phpVersion
			);
		}
		parsedConfig.phpVersion = config.phpVersion;
	}

	if ( config.core !== undefined ) {
		parsedConfig.coreSource = includeTestsPath(
			await parseCoreSource( config.core, options ),
			options
		);
	}

	if ( config.plugins !== undefined ) {
		checkStringArray(
			configFile,
			`${ environmentPrefix }plugins`,
			config.plugins
		);
		parsedConfig.pluginSources = config.plugins.map( ( sourceString ) =>
			parseSourceString( sourceString, options )
		);
	}

	if ( config.themes !== undefined ) {
		checkStringArray(
			configFile,
			`${ environmentPrefix }themes`,
			config.themes
		);
		parsedConfig.themeSources = config.themes.map( ( sourceString ) =>
			parseSourceString( sourceString, options )
		);
	}

	if ( config.config !== undefined ) {
		checkObjectWithValues(
			configFile,
			`${ environmentPrefix }config`,
			config.config,
			[ 'string', 'number', 'boolean' ],
			true
		);
		parsedConfig.config = config.config;

		// There are some configuration options that have a special purpose and need to be validated too.
		for ( const key in parsedConfig.config ) {
			switch ( key ) {
				case 'WP_HOME':
				case 'WP_SITEURL': {
					checkValidURL(
						configFile,
						`${ environmentPrefix }config.${ key }`,
						parsedConfig.config[ key ]
					);
					break;
				}
			}
		}
	}

	if ( config.mappings !== undefined ) {
		checkObjectWithValues(
			configFile,
			`${ environmentPrefix }mappings`,
			config.mappings,
			[ 'string' ],
			false
		);
		parsedConfig.mappings = Object.entries( config.mappings ).reduce(
			( result, [ wpDir, localDir ] ) => {
				const source = parseSourceString( localDir, options );
				result[ wpDir ] = source;
				return result;
			},
			{}
		);
	}

	return parsedConfig;
}

/**
 * Parses a WordPress Core source string or defaults to the latest version.
 *
 * @param {string|null} coreSource The WordPress course source string to parse.
 * @param {Object}      options    Options to use while parsing.
 * @return {Promise<Object>} The parsed source object.
 */
async function parseCoreSource( coreSource, options ) {
	// An empty source means we should use the latest version of WordPress.
	if ( ! coreSource ) {
		const wpVersion = await getLatestWordPressVersion( options );
		if ( ! wpVersion ) {
			throw new ValidationError(
				'Could not find the latest WordPress version. There may be a network issue.'
			);
		}

		coreSource = `WordPress/WordPress#${ wpVersion }`;
	}
	return parseSourceString( coreSource, options );
}

module.exports = {
	parseConfig,
	getConfigFilePath,
};
