'use strict';
/**
 * External dependencies
 */
const path = require( 'path' );
const yaml = require( 'node-yaml' );

/**
 * Internal dependencies
 */
const { ValidationError } = require( './config/validate-config' );

/**
 * @typedef {import('./config').WPConfig} WPConfig
 */

/**
 * Creates a docker-compose override config object, from a file on disk, which
 * overrides the docker-compose run-time the environment.
 *
 * @param {WPConfig} config             A wp-env config object.
 *
 * @return {Object} The docker-compose.override.yml file read as a YAML object.
 */
module.exports = async function readDockerComposeOverride( config ) {
	const dockerComposeOverridePath = path.resolve(
		config.configDirectoryPath,
		'docker-compose.override.yml'
	);

	// Get document, or throw exception on error
	try {
		return await yaml.read( dockerComposeOverridePath, {
			encoding: 'utf8',
		} );
	} catch ( error ) {
		if ( error instanceof SyntaxError ) {
			throw new ValidationError(
				`Invalid ${ dockerComposeOverridePath }: ${ error.message }`
			);
		} else {
			/**
			 * Default "empty" Docker Compose override file contents.
			 */
			return {
				version: '3.7',
				services: {},
				volumes: {},
			};
		}
	}
};
