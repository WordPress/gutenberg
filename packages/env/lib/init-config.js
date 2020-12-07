/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' ).promises;
const yaml = require( 'js-yaml' );
const os = require( 'os' );

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
 * @param {string}  options.xdebug  The Xdebug mode to set. Defaults to "off".
 * @return {WPConfig} The-env config object.
 */
module.exports = async function initConfig( {
	spinner,
	debug,
	xdebug = 'off',
} ) {
	const configPath = path.resolve( '.wp-env.json' );
	const config = await readConfig( configPath );
	config.debug = debug;

	await fs.mkdir( config.workDirectoryPath, { recursive: true } );

	const dockerComposeConfig = buildDockerComposeConfig( config );
	await fs.writeFile(
		config.dockerComposeConfigPath,
		yaml.dump( dockerComposeConfig )
	);

	await fs.writeFile(
		path.resolve( config.workDirectoryPath, 'Dockerfile' ),
		dockerFileContents(
			dockerComposeConfig.services.wordpress.image,
			xdebug
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

function dockerFileContents( image, xdebugMode ) {
	const isLinux = os.type() === 'Linux';
	// Discover client host does not appear to work on macOS with Docker.
	const clientDetectSettings = isLinux
		? 'xdebug.discover_client_host=true'
		: 'xdebug.client_host="host.docker.internal"';

	return `FROM ${ image }

RUN apt -qy install $PHPIZE_DEPS \\
	&& pecl install xdebug \\
	&& docker-php-ext-enable xdebug

RUN touch /usr/local/etc/php/php.ini
RUN echo 'xdebug.start_with_request=yes' >> /usr/local/etc/php/php.ini
RUN echo 'xdebug.mode=${ xdebugMode }' >> /usr/local/etc/php/php.ini
RUN echo '${ clientDetectSettings }' >> /usr/local/etc/php/php.ini
`;
}
