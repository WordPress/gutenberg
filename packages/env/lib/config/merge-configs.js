'use strict';
/**
 * @typedef {import('./parse-config').WPEnvironmentConfig} WPEnvironmentConfig
 */

/**
 * Deep-merges the values in the given service environment. This allows us to
 * merge the wp-config.php values instead of overwriting them.
 *
 * @param {WPEnvironmentConfig} defaultConfig The default config options.
 * @param {...string}           configs       The config options to merge.
 *
 * @return {WPEnvironmentConfig} The merged config object.
 */
module.exports = function mergeConfigs( defaultConfig, ...configs ) {
	// Start with our default config object. This has all
	// of the options filled out already and we can use
	// that to make performing the merge easier.
	let config = defaultConfig;

	// Merge the configs
	for ( const merge of configs ) {
		config = mergeConfig( config, merge );
	}

	return config;
};

/**
 * Merges a config object into another.
 *
 * @param {WPEnvironmentConfig} config  The config object to be merged into.
 * @param {WPEnvironmentConfig} toMerge The config object to merge.
 *
 * @return {WPEnvironmentConfig} The merged config object.
 */
function mergeConfig( config, toMerge ) {
	// Begin by updating any of the config options that the object already has.
	for ( const option in config ) {
		// We don't need to do anything if the merge source doesn't have a property to give.
		if ( toMerge[ option ] === undefined ) {
			continue;
		}

		switch ( option ) {
			// Some config options are merged together instead of entirely replaced.
			case 'config':
			case 'mappings':
			case 'lifecycleScripts': {
				config[ option ] = Object.assign(
					config[ option ],
					toMerge[ option ]
				);
				break;
			}

			// Environment-specific config options are recursively merged.
			case 'env': {
				for ( const environment in config.env ) {
					// Once again, we don't need to do anything if the merge source has nothing to give.
					if ( toMerge.env[ environment ] === undefined ) {
						continue;
					}

					config.env[ environment ] = mergeConfig(
						config.env[ environment ],
						toMerge.env[ environment ]
					);
				}
				break;
			}

			default: {
				config[ option ] = toMerge[ option ];
				break;
			}
		}
	}

	// Next, add any new options that the config object doesn't already have.
	for ( const option in toMerge ) {
		// Environment-specific config options should be checked individually.
		if ( option === 'env' ) {
			for ( const environment in toMerge.env ) {
				// The presence of the environment means it would have been merged above.
				if ( config.env[ environment ] !== undefined ) {
					continue;
				}

				config.env[ environment ] = toMerge[ environment ];
			}

			continue;
		}

		// As above, the presence of the option means it would have been merged above.
		if ( config[ option ] !== undefined ) {
			continue;
		}

		config[ option ] = toMerge[ option ];
	}

	return config;
}
