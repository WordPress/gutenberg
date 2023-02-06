/**
 * External dependencies
 */
const path = require( 'path' );
const { writeFile, mkdir } = require( 'fs' ).promises;
const { existsSync } = require( 'fs' );
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
 * ./.wp-env.json, creates ~/.wp-env, ~/.wp-env/docker-compose.yml, and
 * ~/.wp-env/Dockerfile.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner      A CLI spinner which indicates progress.
 * @param {boolean} options.debug        True if debug mode is enabled.
 * @param {string}  options.xdebug       The Xdebug mode to set. Defaults to "off".
 * @param {boolean} options.writeChanges If true, writes the parsed config to the
 *                                       required docker files like docker-compose
 *                                       and Dockerfile. By default, this is false
 *                                       and only the `start` command writes any
 *                                       changes.
 * @return {WPConfig} The-env config object.
 */
module.exports = async function initConfig( {
	spinner,
	debug,
	xdebug = 'off',
	writeChanges = false,
} ) {
	const configPath = path.resolve( '.wp-env.json' );
	const config = await readConfig( configPath );
	config.debug = debug;

	// Adding this to the config allows the start command to understand that the
	// config has changed when only the xdebug param has changed. This is needed
	// so that Docker will rebuild the image whenever the xdebug flag changes.
	config.xdebug = xdebug;

	const dockerComposeConfig = buildDockerComposeConfig( config );

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

	/**
	 * We avoid writing changes most of the time so that we can better pass params
	 * to the start command. For example, say you start wp-env with Xdebug enabled.
	 * If you then run another command, like opening bash in the wp instance, it
	 * would turn off Xdebug in the Dockerfile because it wouldn't have the --xdebug
	 * arg. This basically makes it such that wp-env start is the only command
	 * which updates any of the Docker configuration.
	 */
	if ( writeChanges ) {
		await mkdir( config.workDirectoryPath, { recursive: true } );

		await writeFile(
			config.dockerComposeConfigPath,
			yaml.dump( dockerComposeConfig )
		);

		await writeFile(
			path.resolve( config.workDirectoryPath, 'Dockerfile' ),
			dockerFileContents(
				dockerComposeConfig.services.wordpress.image,
				config
			)
		);
	} else if ( ! existsSync( config.workDirectoryPath ) ) {
		spinner.fail(
			'wp-env has not yet been initialized. Please run `wp-env start` to install the WordPress instance before using any other commands. This is only necessary to set up the environment for the first time; it is typically not necessary for the instance to be running after that in order to use other commands.'
		);
		process.exit( 1 );
	}

	return config;
};

/**
 * Checks the configured PHP version
 * against the minimum version supported by Xdebug
 *
 * @param {WPConfig} config
 * @return {boolean} Whether the PHP version is supported by Xdebug
 */
function checkXdebugPhpCompatibility( config ) {
	// By default, an undefined phpVersion uses the version on the docker image,
	// which is supported by Xdebug 3.
	const phpCompatibility = true;

	// If PHP version is defined
	// ensure it meets the Xdebug minimum compatibility requirment.
	if ( config.env.development.phpVersion ) {
		const versionTokens = config.env.development.phpVersion.split( '.' );
		const majorVer = parseInt( versionTokens[ 0 ] );
		const minorVer = parseInt( versionTokens[ 1 ] );

		if ( isNaN( majorVer ) || isNaN( minorVer ) ) {
			throw new Error(
				'Something went wrong when parsing the PHP version.'
			);
		}

		// Xdebug 3 supports 7.2 and higher
		// Ensure user has specified a compatible PHP version.
		if ( majorVer < 7 || ( majorVer === 7 && minorVer < 2 ) ) {
			throw new Error( 'Cannot use XDebug 3 on PHP < 7.2.' );
		}
	}

	return phpCompatibility;
}

/**
 * Generates the Dockerfile used by wp-env's development instance.
 *
 * @param {string}   image  The base docker image to use.
 * @param {WPConfig} config The configuration object.
 *
 * @return {string} The dockerfile contents.
 */
function dockerFileContents( image, config ) {
	// Don't install XDebug unless it is explicitly required.
	let shouldInstallXdebug = false;

	if ( config.xdebug !== 'off' ) {
		const usingCompatiblePhp = checkXdebugPhpCompatibility( config );

		if ( usingCompatiblePhp ) {
			shouldInstallXdebug = true;
		}
	}

	return `FROM ${ image }

RUN apt-get -qy install $PHPIZE_DEPS && touch /usr/local/etc/php/php.ini
${ shouldInstallXdebug ? installXdebug( config.xdebug ) : '' }
`;
}

function installXdebug( enableXdebug ) {
	const isLinux = os.type() === 'Linux';
	// Discover client host does not appear to work on macOS with Docker.
	const clientDetectSettings = isLinux
		? 'xdebug.discover_client_host=true'
		: 'xdebug.client_host="host.docker.internal"';

	return `
# Install Xdebug:
RUN if [ -z "$(pecl list | grep xdebug)" ] ; then pecl install xdebug ; fi
RUN docker-php-ext-enable xdebug
RUN echo 'xdebug.start_with_request=yes' >> /usr/local/etc/php/php.ini
RUN echo 'xdebug.mode=${ enableXdebug }' >> /usr/local/etc/php/php.ini
RUN echo '${ clientDetectSettings }' >> /usr/local/etc/php/php.ini
	`;
}
