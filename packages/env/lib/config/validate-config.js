'use strict';

/**
 * @typedef {import('./config').WPServiceConfig} WPServiceConfig
 * @typedef {import('./config').WPSource} WPSource
 */

/**
 * Error subtype which indicates that an expected validation erorr occured
 * while reading wp-env configuration.
 */
class ValidationError extends Error {}

/**
 * Validates a config object by throwing a ValidationError if any of its properties
 * do not match the required format.
 *
 * @param {Object}  config      A config object to validate.
 * @param {?string} envLocation Identifies if the error occured in a specific environment property.
 * @return {Object} The passed config object with no modifications.
 */
function validateConfig( config, envLocation ) {
	const envPrefix = envLocation ? `env.${ envLocation }.` : '';
	if ( config.core !== null && typeof config.core !== 'string' ) {
		throw new ValidationError(
			`Invalid .wp-env.json: "${ envPrefix }core" must be null or a string.`
		);
	}

	if (
		! Array.isArray( config.plugins ) ||
		config.plugins.some( ( plugin ) => typeof plugin !== 'string' )
	) {
		throw new ValidationError(
			`Invalid .wp-env.json: "${ envPrefix }plugins" must be an array of strings.`
		);
	}

	if (
		! Array.isArray( config.themes ) ||
		config.themes.some( ( theme ) => typeof theme !== 'string' )
	) {
		throw new ValidationError(
			`Invalid .wp-env.json: "${ envPrefix }themes" must be an array of strings.`
		);
	}

	if ( ! Number.isInteger( config.port ) ) {
		throw new ValidationError(
			`Invalid .wp-env.json: "${ envPrefix }port" must be an integer.`
		);
	}

	if ( typeof config.config !== 'object' ) {
		throw new ValidationError(
			`Invalid .wp-env.json: "${ envPrefix }config" must be an object.`
		);
	}

	if ( typeof config.mappings !== 'object' ) {
		throw new ValidationError(
			`Invalid .wp-env.json: "${ envPrefix }mappings" must be an object.`
		);
	}

	for ( const [ wpDir, localDir ] of Object.entries( config.mappings ) ) {
		if ( ! localDir || typeof localDir !== 'string' ) {
			throw new ValidationError(
				`Invalid .wp-env.json: "${ envPrefix }mappings.${ wpDir }" should be a string.`
			);
		}
	}

	if (
		config.phpVersion &&
		! (
			typeof config.phpVersion === 'string' &&
			config.phpVersion.length === 3
		)
	) {
		throw new ValidationError(
			`Invalid .wp-env.json: "${ envPrefix }phpVersion" must be a string of the format "0.0".`
		);
	}

	return config;
}

module.exports = {
	validateConfig,
	ValidationError,
};
