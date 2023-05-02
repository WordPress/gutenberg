'use strict';
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
const { loadConfig } = require( './config' );
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
	const config = await loadConfig( path.resolve( '.' ) );
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
			path.resolve( config.workDirectoryPath, 'WordPress.Dockerfile' ),
			wordpressDockerFileContents(
				getBaseDockerImage( config.env.development.phpVersion, false ),
				config
			)
		);
		await writeFile(
			path.resolve(
				config.workDirectoryPath,
				'Tests-WordPress.Dockerfile'
			),
			wordpressDockerFileContents(
				getBaseDockerImage( config.env.tests.phpVersion, false ),
				config
			)
		);

		await writeFile(
			path.resolve( config.workDirectoryPath, 'CLI.Dockerfile' ),
			cliDockerFileContents(
				getBaseDockerImage( config.env.development.phpVersion, true ),
				config
			)
		);
		await writeFile(
			path.resolve( config.workDirectoryPath, 'Tests-CLI.Dockerfile' ),
			cliDockerFileContents(
				getBaseDockerImage( config.env.tests.phpVersion, true ),
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
 * Gets the base docker image to use based on our input.
 *
 * @param {string}  phpVersion The version of PHP to get an image for.
 * @param {boolean} isCLI      Indicates whether or not the image is for a CLI.
 * @return {string} The Docker image to use.
 */
function getBaseDockerImage( phpVersion, isCLI ) {
	// We can rely on a consistent format for PHP versions.
	if ( phpVersion ) {
		phpVersion = ( isCLI ? '-' : ':' ) + 'php' + phpVersion;
	} else {
		phpVersion = '';
	}

	let wordpressImage = 'wordpress';
	if ( isCLI ) {
		wordpressImage += ':cli';
	}

	return wordpressImage + phpVersion;
}

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
 * Generates the Dockerfile used by wp-env's `wordpress` and `tests-wordpress` instances.
 *
 * @param {string}   image  The base docker image to use.
 * @param {WPConfig} config The configuration object.
 *
 * @return {string} The dockerfile contents.
 */
function wordpressDockerFileContents( image, config ) {
	// Don't install XDebug unless it is explicitly required.
	let shouldInstallXdebug = false;

	if ( config.xdebug !== 'off' ) {
		const usingCompatiblePhp = checkXdebugPhpCompatibility( config );

		if ( usingCompatiblePhp ) {
			shouldInstallXdebug = true;
		}
	}

	return `FROM ${ image }

# Update apt sources for archived versions of Debian.

# stretch (https://lists.debian.org/debian-devel-announce/2023/03/msg00006.html)
RUN sed -i 's|deb.debian.org/debian stretch|archive.debian.org/debian stretch|g' /etc/apt/sources.list
RUN sed -i 's|security.debian.org/debian-security stretch|archive.debian.org/debian-security stretch|g' /etc/apt/sources.list
RUN sed -i '/stretch-updates/d' /etc/apt/sources.list

# Prepare dependencies
RUN apt-get -qy install $PHPIZE_DEPS && touch /usr/local/etc/php/php.ini
${ shouldInstallXdebug ? installXdebug( config.xdebug ) : '' }

# Create the host's user so that we can match ownership in the container.
ARG HOST_USERNAME
ARG HOST_UID
ARG HOST_GID
# When the IDs are already in use we can still safely move on.
RUN groupadd -g $HOST_GID $HOST_USERNAME || true
RUN useradd -m -u $HOST_UID -g $HOST_GID $HOST_USERNAME || true

# Set up sudo so they can have root access when using 'run' commands.
RUN apt-get update -qy
RUN apt-get -qy install sudo
RUN echo "$HOST_USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
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

/**
 * Generates the Dockerfile used by wp-env's `cli` and `tests-cli` instances.
 *
 * @param {string} image The base docker image to use.
 *
 * @return {string} The dockerfile contents.
 */
function cliDockerFileContents( image ) {
	return `FROM ${ image }

# Switch to root so we can create users.
USER root
	
# Create the host's user so that we can match ownership in the container.
ARG HOST_USERNAME
ARG HOST_UID
ARG HOST_GID
# When the IDs are already in use we can still safely move on.
RUN addgroup -g $HOST_GID $HOST_USERNAME || true
RUN adduser -h /home/$HOST_USERNAME -G $( getent group $HOST_GID | cut -d: -f1 ) -u $HOST_UID $HOST_USERNAME || true

# Switch back now that we're done.
USER www-data

# Have the container sleep infinitely to keep it alive for us to run commands on it.
CMD [ "/bin/sh", "-c", "while true; do sleep 2073600; done" ]
`;
}
