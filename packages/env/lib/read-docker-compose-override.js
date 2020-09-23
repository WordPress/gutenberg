'use strict';
/**
 * External dependencies
 */
const fs = require( 'fs' );
const yaml = require( 'js-yaml' );

/**
 * @typedef {import('./config').WPConfig} WPConfig
 */

/**
 * Creates a docker-compose override config object, from a file on disk, which
 * overrides the docker-compose run-time the environment.
 *
 * @param {WPConfig} config A wp-env config object.
 * @param {Object}  options
 * @param {Object}   options.spinner    A CLI spinner which indicates progress.
 * @param {boolean}  options.debug      True if debug mode is enabled.
 *
 * @return {Object} The docker-compose.override.yml file read as a YAML object.
 */
module.exports = function readDockerComposeOverride(
	config,
	{ spinner, debug }
) {
	const log = debug
		? ( message ) => {
				spinner.info( `Read Docker Compose Override: ${ message }` );
				spinner.start();
		  }
		: () => {};

	// Get document, or throw exception on error
	try {
		const dockerComposeOverride = yaml.safeLoad(
			fs.readFileSync( config.dockerComposeOverridePath, 'utf8' )
		);

		return dockerComposeOverride;
	} catch ( e ) {
		log( e );
		const dockerComposeOverride = function () {
			return { version: '3.7' };
		};
		fs.writeFile(
			config.dockerComposeOverridePath,
			yaml.dump( dockerComposeOverride )
		);

		return dockerComposeOverride;
	}
};
