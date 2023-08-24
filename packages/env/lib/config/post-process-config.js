'use strict';
/**
 * Internal dependencies
 */
const mergeConfigs = require( './merge-configs' );
const addOrReplacePort = require( './add-or-replace-port' );
const { ValidationError } = require( './validate-config' );

/**
 * @typedef {import('./parse-config').WPRootConfig} WPRootConfig
 * @typedef {import('./parse-config').WPEnvironmentConfig} WPEnvironmentConfig
 */

/**
 * Performs any additional post-processing on the config object.
 *
 * @param {WPEnvironmentConfig} config The config to process.
 *
 * @return {WPEnvironmentConfig} The config after post-processing.
 */
module.exports = function postProcessConfig( config ) {
	// Make sure that we're operating on a config object that has
	// complete environment configs for convenience.
	config = mergeRootToEnvironments( config );

	config = appendPortToWPConfigs( config );

	validate( config );
	return config;
};

/**
 * Merges the root config and each environment together in order to make sure each environment has
 * a full config object to work with internally. This makes it easier than having to try and
 * resolve the full config options every time we want to use them for something.
 *
 * @param {WPEnvironmentConfig} config The config to process.
 *
 * @return {WPRootConfig} The config object with the root options merged together with the environment-specific options.
 */
function mergeRootToEnvironments( config ) {
	// Some root-level options need to be handled early because they have a special
	// cascade behavior that would break the normal merge. After merging we then
	// delete them to avoid that breakage and add them back before we return.
	const removedRootOptions = {};
	if (
		config.port !== undefined &&
		config.env.development.port === undefined
	) {
		removedRootOptions.port = config.port;
		config.env.development.port = config.port;
		delete config.port;
	}
	if (
		config.testsPort !== undefined &&
		config.env.tests.port === undefined
	) {
		removedRootOptions.testsPort = config.testsPort;
		config.env.tests.port = config.testsPort;
		delete config.testsPort;
	}
	if ( config.lifecycleScripts !== undefined ) {
		removedRootOptions.lifecycleScripts = config.lifecycleScripts;
		delete config.lifecycleScripts;
	}

	// Check if ssl is set and if it is, move it to the environment configs.
	if ( config.ssl !== undefined && config.ssl.cert && config.ssl.key ) {
		removedRootOptions.ssl = {};

		// Create ssl objects if they don't exist.
		if ( config.env.development.ssl === undefined ) {
			config.env.development.ssl = {};
		}
		if ( config.env.tests.ssl === undefined ) {
			config.env.tests.ssl = {};
		}

		// Move the ssl options to the environment configs.
		if ( config.ssl.port !== undefined ) {
			if (
				config.env.development.ssl !== undefined &&
				config.env.development.ssl.port === undefined
			) {
				config.env.development.ssl = {};
				config.env.development.ssl.cert = config.ssl.cert;
				config.env.development.ssl.key = config.ssl.key;
				config.env.development.ssl.port = config.ssl.port;
				removedRootOptions.ssl.port = config.ssl.port;
			}
		}
		if ( config.ssl.testsPort !== undefined ) {
			if (
				config.env.tests.ssl !== undefined &&
				config.env.tests.ssl.port === undefined
			) {
				config.env.tests.ssl = {};
				config.env.tests.ssl.cert = config.ssl.cert;
				config.env.tests.ssl.key = config.ssl.key;
				config.env.tests.ssl.port = config.ssl.testsPort;
				removedRootOptions.ssl.testsPort = config.ssl.testsPort;
			}
		}
		removedRootOptions.ssl.cert = config.ssl.cert;
		removedRootOptions.ssl.key = config.ssl.key;
		delete config.ssl;
	} else if (
		config.ssl !== undefined &&
		config.ssl.cert === undefined &&
		config.ssl.key === undefined
	) {
		removedRootOptions.ssl = config.ssl;
		delete config.ssl;
	}

	// Merge the root config and the environment configs together so that
	// we can ignore the root config and have full environment configs.
	for ( const env in config.env ) {
		config.env[ env ] = mergeConfigs(
			deepCopyRootOptions( config ),
			config.env[ env ]
		);
	}

	// Set any root-level options we reset back.
	for ( const option in removedRootOptions ) {
		config[ option ] = removedRootOptions[ option ];
	}

	return config;
}

/**
 * Appends the configured port to certain wp-config options.
 *
 * @param {WPRootConfig} config The config to process.
 *
 * @return {WPRootConfig} The config after post-processing.
 */
function appendPortToWPConfigs( config ) {
	const options = [ 'WP_TESTS_DOMAIN', 'WP_SITEURL', 'WP_HOME' ];

	// We are only interested in editing the config options for environment-specific configs.
	// If we made this change to the root config it would cause problems since they would
	// be mapped to all environments even though the ports will be different.
	for ( const env in config.env ) {
		// There's nothing to do without any wp-config options set.
		if ( config.env[ env ].config === undefined ) {
			continue;
		}

		if ( config.env[ env ].port === undefined ) {
			continue;
		}

		// Make sure that the port is on the option if it's present.
		for ( const option of options ) {
			if ( config.env[ env ].config[ option ] === undefined ) {
				continue;
			}

			let port = config.env[ env ].port;
			if (
				config.env[ env ].ssl &&
				config.env[ env ].ssl.cert &&
				config.env[ env ].ssl.key
			) {
				port = config.env[ env ].ssl.port;
				if (
					config.env[ env ].config[ option ].startsWith( 'http://' )
				) {
					config.env[ env ].config[ option ] =
						'https://' +
						config.env[ env ].config[ option ].substring( 7 );
				}
			}
			config.env[ env ].config[ option ] = addOrReplacePort(
				config.env[ env ].config[ option ],
				port,
				// Don't replace the port if one is already set on WP_HOME.
				option !== 'WP_HOME'
			);
		}
	}

	return config;
}

/**
 * Examines the config to make sure that none of the environments share the same port.
 *
 * @param {WPRootConfig} config The config to process.
 */
function validatePortUniqueness( config ) {
	// We're going to build a map of the environments and their port
	// so we can accomodate root-level config options more easily.
	const environmentPorts = {};
	const environmentSSLPorts = {};

	// Add all of the environments to the map. This will
	// overwrite any root-level options if necessary.
	for ( const env in config.env ) {
		if ( config.env[ env ].port === undefined ) {
			throw new ValidationError(
				`The "${ env }" environment has an invalid port.`
			);
		}
		if (
			config.env[ env ].ssl !== undefined &&
			config.env[ env ].ssl.cert &&
			config.env[ env ].ssl.key &&
			! config.env[ env ].ssl.port
		) {
			throw new ValidationError(
				`The "${ env }" environment has an invalid SSL port.`
			);
		}

		environmentPorts[ env ] = config.env[ env ].port;

		if (
			config.env[ env ].ssl !== undefined &&
			config.env[ env ].ssl.port &&
			config.env[ env ].ssl.cert &&
			config.env[ env ].ssl.key
		) {
			environmentSSLPorts[ env ] = config.env[ env ].ssl.port;
		}
	}

	// This search isn't very performant, but, we won't ever be
	// checking more than a few entries so it doesn't matter.
	for ( const env in environmentPorts ) {
		for ( const check in environmentPorts ) {
			if ( env === check ) {
				continue;
			}

			if ( environmentPorts[ env ] === environmentPorts[ check ] ) {
				throw new ValidationError(
					`The "${ env }" and "${ check }" environments may not have the same port.`
				);
			}
		}
	}

	for ( const env in environmentSSLPorts ) {
		for ( const check in environmentSSLPorts ) {
			if ( env === check ) {
				continue;
			}

			if ( environmentSSLPorts[ env ] === environmentSSLPorts[ check ] ) {
				throw new ValidationError(
					`The "${ env }" and "${ check }" environments may not have the same SSL port.`
				);
			}
		}
	}
}

/**
 * Perform any validation that can only happen after post-processing has occurred.
 *
 * @param {WPRootConfig} config The config to validate.
 */
function validate( config ) {
	validatePortUniqueness( config );
}

/**
 * Creates a deep copy of the root options in the config object that we can use to avoid
 * accidentally sharing object state between different environments.
 *
 * @param {WPRootConfig} config The root config object to copy.
 *
 * @return {WPRootConfig} A deep copy of the root config object.
 */
function deepCopyRootOptions( config ) {
	// Create a shallow clone of the object first so we can operate on it safetly.
	const rootConfig = Object.assign( {}, config );

	// Since we're only dealing with the root options we don't want the environments.
	delete rootConfig.env;

	if ( rootConfig.config !== undefined ) {
		rootConfig.config = Object.assign( {}, rootConfig.config );
	}
	if ( rootConfig.mappings !== undefined ) {
		rootConfig.mappings = Object.assign( {}, rootConfig.mappings );
	}
	if ( rootConfig.pluginSources !== undefined ) {
		rootConfig.pluginSources = [ ...rootConfig.pluginSources ];
	}
	if ( rootConfig.themeSources !== undefined ) {
		rootConfig.themeSources = [ ...rootConfig.themeSources ];
	}

	return rootConfig;
}
