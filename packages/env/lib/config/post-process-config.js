'use strict';
/**
 * Internal dependencies
 */
const addOrReplacePort = require( './add-or-replace-port' );

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
