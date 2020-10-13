/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' ).promises;
const yaml = require( 'js-yaml' );

/**
 * Internal dependencies
 */
const { readConfig } = require( './config' );
const buildDockerComposeConfig = require( './build-docker-compose-config' );
const readDockerComposeOverride = require( './read-docker-compose-override' );
/**
 * @typedef {import('./config').WPConfig} WPConfig
 */

/**
 * Initializes the local environment so that Docker commands can be run. Reads
 * ./.wp-env.json, creates ~/.wp-env, creates ~/.wp-env/docker-compose.yml,
 * creates ~/.wp-env/docker-compose.override.yml.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 *
 * @return {WPConfig} The-env config object.
 */
module.exports = async function initConfig( { spinner, debug } ) {
	const configPath = path.resolve( '.wp-env.json' );
	const config = await readConfig( configPath );
	config.debug = debug;

	await fs.mkdir( config.workDirectoryPath, { recursive: true } );

	const dockerComposeConfig = buildDockerComposeConfig( config );
	await fs.writeFile(
		config.dockerComposeConfigPath,
		yaml.dump( dockerComposeConfig )
	);

	const dockerComposeOverride = await readDockerComposeOverride( config );
	await fs.writeFile(
		config.dockerComposeOverrideConfigPath,
		yaml.dump( dockerComposeOverride )
	);

	if ( config.debug ) {
		spinner.info(
			`Config:\n${ JSON.stringify(
				config,
				null,
				4
			) }\n\nDocker Compose Config:\n${ JSON.stringify(
				dockerComposeConfig,
				null,
				4
			) }\n\nDocker Composer Override Config:\n${ JSON.stringify(
				dockerComposeOverride,
				null,
				4
			) }`
		);
		spinner.start();
	}

	return config;
};
