'use strict';
/**
 * Internal dependencies
 */
const addOrReplacePort = require( './add-or-replace-port' );
const { ValidationError } = require( './validate-config' );

/**
 * @typedef {import('./config').WPServiceConfig} WPServiceConfig
 */

/**
 * Performs any additional post-processing on the config object.
 *
 * @param {WPServiceConfig} config The config to process.
 *
 * @return {WPServiceConfig} The config after post-processing.
 */
module.exports = function postProcessConfig( config ) {
	config = appendPortToWPConfigs( config );

	validatePortUniqueness( config );

	return config;
};

/**
 * Appends the configured port to certain wp-config options.
 *
 * @param {WPServiceConfig} config The config to process.
 *
 * @return {WPServiceConfig} The config after post-processing.
 */
function appendPortToWPConfigs( config ) {
	const options = [ 'WP_TESTS_DOMAIN', 'WP_SITEURL', 'WP_HOME' ];

	// We are only interested in editing the config options for environment-specific configs.
	// If we made this change to the root config it would cause problems since they would
	// be mapped to all environments even though the ports will be different.
	let port;
	for ( const env in config.env ) {
		// There's nothing to do without any wp-config options set.
		if ( config.env[ env ].config === undefined ) {
			continue;
		}

		// Use the environment-specific port if available, otherwise, fall back to the root.
		if ( config.env[ env ].port !== undefined ) {
			port = config.env[ env ].port;
		} else {
			port = env === 'tests' ? config.testsPort : config.port;
		}

		if ( port === undefined ) {
			continue;
		}

		// Make sure that the port is on the option if it's present.
		for ( const option of options ) {
			if ( config.env[ env ].config[ option ] === undefined ) {
				continue;
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
 * @param {WPServiceConfig} config The config to process.
 */
function validatePortUniqueness( config ) {
	// We're going to build a map of the environments and their port
	// so we can accomodate root-level config options more easily.
	const environmentPorts = {};

	// Start by translating the root options into an environment-specific one.
	if ( config.port !== undefined ) {
		environmentPorts.development = config.port;
	}
	if ( config.testsPort !== undefined ) {
		environmentPorts.tests = config.testsPort;
	}

	// Add all of the environments to the map. This will
	// overwrite any root-level options if necessary.
	for ( const env in config.env ) {
		if ( config.env[ env ].port !== undefined ) {
			environmentPorts[ env ] = config.env[ env ].port;
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
}
