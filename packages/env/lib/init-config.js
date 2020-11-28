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

/**
 * @typedef {import('./config').WPConfig} WPConfig
 */

/**
 * Initializes the local environment so that Docker commands can be run. Reads
 * ./.wp-env.json, creates ~/.wp-env, and creates ~/.wp-env/docker-compose.yml.
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

	const xDebugMode = 'debug';
	await fs.writeFile(
		path.resolve( config.workDirectoryPath, 'Dockerfile' ),
		dockerFileContents(
			dockerComposeConfig.services.wordpress.image,
			xDebugMode
		)
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
			) }`
		);
		spinner.start();
	}

	return config;
};

function dockerFileContents( image, xDebugMode ) {
	return `
FROM ${ image }

RUN apt -qy install $PHPIZE_DEPS \\
	&& pecl install xdebug \\
	&& docker-php-ext-enable xdebug

RUN touch /usr/local/etc/php/php.ini
RUN echo 'xdebug.start_with_request=yes' >> /usr/local/etc/php/php.ini
RUN echo 'xdebug.discover_client_host=1' >> /usr/local/etc/php/php.ini
RUN echo 'xdebug.mode=${ xDebugMode }' >> /usr/local/etc/php/php.ini
`;
}
