'use strict';
/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { hasSameCoreSource } = require( './wordpress' );
const { dbEnv } = require( './config' );
const getHostUser = require( './get-host-user' );

/**
 * @typedef {import('./config').WPConfig} WPConfig
 * @typedef {import('./config').WPServiceConfig} WPServiceConfig
 */

/**
 * Gets the volume mounts for an individual service.
 *
 * @param {string}          workDirectoryPath The working directory for wp-env.
 * @param {WPServiceConfig} config            The service config to get the mounts from.
 * @param {string}          hostUsername      The username of the host running wp-env.
 * @param {string}          wordpressDefault  The default internal path for the WordPress
 *                                            source code (such as tests-wordpress).
 *
 * @return {string[]} An array of volumes to mount in string format.
 */
function getMounts(
	workDirectoryPath,
	config,
	hostUsername,
	wordpressDefault = 'wordpress'
) {
	// Top-level WordPress directory mounts (like wp-content/themes)
	const directoryMounts = Object.entries( config.mappings ).map(
		( [ wpDir, source ] ) => `${ source.path }:/var/www/html/${ wpDir }`
	);

	const pluginMounts = config.pluginSources.map(
		( source ) =>
			`${ source.path }:/var/www/html/wp-content/plugins/${ source.basename }`
	);

	const themeMounts = config.themeSources.map(
		( source ) =>
			`${ source.path }:/var/www/html/wp-content/themes/${ source.basename }`
	);

	const userHomeMount =
		wordpressDefault === 'wordpress'
			? `user-home:/home/${ hostUsername }`
			: `tests-user-home:/home/${ hostUsername }`;

	const corePHPUnitMount = `${ path.join(
		workDirectoryPath,
		wordpressDefault === 'wordpress'
			? 'WordPress-PHPUnit'
			: 'tests-WordPress-PHPUnit',
		'tests',
		'phpunit'
	) }:/wordpress-phpunit`;

	const coreMount = `${
		config.coreSource ? config.coreSource.path : wordpressDefault
	}:/var/www/html`;

	return [
		...new Set( [
			coreMount, // Must be first because of some operations later that expect it to be!
			corePHPUnitMount,
			userHomeMount,
			...directoryMounts,
			...pluginMounts,
			...themeMounts,
		] ),
	];
}

/**
 * Creates a docker-compose config object which, when serialized into a
 * docker-compose.yml file, tells docker-compose how to run the environment.
 *
 * @param {WPConfig} config A wp-env config object.
 *
 * @return {Object} A docker-compose config object, ready to serialize into YAML.
 */
module.exports = function buildDockerComposeConfig( config ) {
	// Since we are mounting files from the host operating system
	// we want to create the host user in some of our containers.
	// This ensures ownership parity and lets us access files
	// and folders between the containers and the host.
	const hostUser = getHostUser();

	const developmentMounts = getMounts(
		config.workDirectoryPath,
		config.env.development,
		hostUser.name
	);
	const testsMounts = getMounts(
		config.workDirectoryPath,
		config.env.tests,
		hostUser.name,
		'tests-wordpress'
	);

	// When both tests and development reference the same WP source, we need to
	// ensure that tests pulls from a copy of the files so that it maintains
	// a separate DB and config. Additionally, if the source type is local we
	// need to ensure:
	//
	// 1. That changes the user makes within the "core" directory are
	//    served in both the development and tests environments.
	// 2. That the development and tests environment use separate
	//    databases and `wp-content/uploads`.
	//
	// To do this we copy the local "core" files ($wordpress) to a tests
	// directory ($tests-wordpress) and instruct the tests environment
	// to source its files like so:
	//
	// - wp-config.php        <- $tests-wordpress/wp-config.php
	// - wp-config-sample.php <- $tests-wordpress/wp-config.php
	// - wp-content           <- $tests-wordpress/wp-content
	// - *                    <- $wordpress/*
	//
	// https://github.com/WordPress/gutenberg/issues/21164
	if (
		config.env.development.coreSource &&
		hasSameCoreSource( [ config.env.development, config.env.tests ] )
	) {
		const wpSource = config.env.development.coreSource;
		testsMounts.shift(); // Remove normal core mount.
		testsMounts.unshift(
			...[
				`${ wpSource.testsPath }:/var/www/html`,
				...( wpSource.type === 'local'
					? fs
							.readdirSync( wpSource.path )
							.filter(
								( filename ) =>
									filename !== 'wp-config.php' &&
									filename !== 'wp-config-sample.php' &&
									filename !== 'wp-content'
							)
							.map(
								( filename ) =>
									`${ path.join(
										wpSource.path,
										filename
									) }:/var/www/html/${ filename }`
							)
					: [] ),
			]
		);
	}

	// Set the default ports based on the config values.
	const developmentPorts = `\${WP_ENV_PORT:-${ config.env.development.port }}:80`;
	const testsPorts = `\${WP_ENV_TESTS_PORT:-${ config.env.tests.port }}:80`;

	// Defaults are to use the most recent version of PHPUnit that provides
	// support for the specified version of PHP.
	// PHP Unit is assumed to be for Tests so use the testsPhpVersion.
	let phpunitTag = 'latest';
	const phpunitPhpVersion = '-php-' + config.env.tests.phpVersion + '-fpm';
	if ( config.env.tests.phpVersion === '5.6' ) {
		phpunitTag = '5' + phpunitPhpVersion;
	} else if ( config.env.tests.phpVersion === '7.0' ) {
		phpunitTag = '6' + phpunitPhpVersion;
	} else if ( config.env.tests.phpVersion === '7.1' ) {
		phpunitTag = '7' + phpunitPhpVersion;
	} else if ( config.env.tests.phpVersion === '7.2' ) {
		phpunitTag = '8' + phpunitPhpVersion;
	} else if (
		[ '7.3', '7.4', '8.0', '8.1', '8.2' ].indexOf(
			config.env.tests.phpVersion
		) >= 0
	) {
		phpunitTag = '9' + phpunitPhpVersion;
	}
	const phpunitImage = `wordpressdevelop/phpunit:${ phpunitTag }`;

	// If the user mounted their own uploads folder, we should not override it in the phpunit service.
	const isMappingTestUploads = testsMounts.some( ( mount ) =>
		mount.endsWith( ':/var/www/html/wp-content/uploads' )
	);

	return {
		version: '3.7',
		services: {
			mysql: {
				image: 'mariadb',
				ports: [ '3306' ],
				environment: {
					MYSQL_ROOT_HOST: '%',
					MYSQL_ROOT_PASSWORD:
						dbEnv.credentials.WORDPRESS_DB_PASSWORD,
					MYSQL_DATABASE: dbEnv.development.WORDPRESS_DB_NAME,
				},
				volumes: [ 'mysql:/var/lib/mysql' ],
			},
			'tests-mysql': {
				image: 'mariadb',
				ports: [ '3306' ],
				environment: {
					MYSQL_ROOT_HOST: '%',
					MYSQL_ROOT_PASSWORD:
						dbEnv.credentials.WORDPRESS_DB_PASSWORD,
					MYSQL_DATABASE: dbEnv.tests.WORDPRESS_DB_NAME,
				},
				volumes: [ 'mysql-test:/var/lib/mysql' ],
			},
			wordpress: {
				depends_on: [ 'mysql' ],
				build: {
					context: '.',
					dockerfile: 'WordPress.Dockerfile',
					args: {
						HOST_USERNAME: hostUser.name,
						HOST_UID: hostUser.uid,
						HOST_GID: hostUser.gid,
					},
				},
				ports: [ developmentPorts ],
				environment: {
					APACHE_RUN_USER: '#' + hostUser.uid,
					APACHE_RUN_GROUP: '#' + hostUser.gid,
					...dbEnv.credentials,
					...dbEnv.development,
					WP_TESTS_DIR: '/wordpress-phpunit',
				},
				volumes: developmentMounts,
			},
			'tests-wordpress': {
				depends_on: [ 'tests-mysql' ],
				build: {
					context: '.',
					dockerfile: 'Tests-WordPress.Dockerfile',
					args: {
						HOST_USERNAME: hostUser.name,
						HOST_UID: hostUser.uid,
						HOST_GID: hostUser.gid,
					},
				},
				ports: [ testsPorts ],
				environment: {
					APACHE_RUN_USER: '#' + hostUser.uid,
					APACHE_RUN_GROUP: '#' + hostUser.gid,
					...dbEnv.credentials,
					...dbEnv.tests,
					WP_TESTS_DIR: '/wordpress-phpunit',
				},
				volumes: testsMounts,
			},
			cli: {
				depends_on: [ 'wordpress' ],
				build: {
					context: '.',
					dockerfile: 'CLI.Dockerfile',
					args: {
						HOST_USERNAME: hostUser.name,
						HOST_UID: hostUser.uid,
						HOST_GID: hostUser.gid,
					},
				},
				volumes: developmentMounts,
				user: hostUser.fullUser,
				environment: {
					...dbEnv.credentials,
					...dbEnv.development,
					WP_TESTS_DIR: '/wordpress-phpunit',
				},
			},
			'tests-cli': {
				depends_on: [ 'tests-wordpress' ],
				build: {
					context: '.',
					dockerfile: 'Tests-CLI.Dockerfile',
					args: {
						HOST_USERNAME: hostUser.name,
						HOST_UID: hostUser.uid,
						HOST_GID: hostUser.gid,
					},
				},
				volumes: testsMounts,
				user: hostUser.fullUser,
				environment: {
					...dbEnv.credentials,
					...dbEnv.tests,
					WP_TESTS_DIR: '/wordpress-phpunit',
				},
			},
			composer: {
				image: 'composer',
				volumes: [ `${ config.configDirectoryPath }:/app` ],
			},
			phpunit: {
				image: phpunitImage,
				depends_on: [ 'tests-wordpress' ],
				volumes: [
					...testsMounts,
					...( ! isMappingTestUploads
						? [ 'phpunit-uploads:/var/www/html/wp-content/uploads' ]
						: [] ),
				],
				environment: {
					LOCAL_DIR: 'html',
					WP_TESTS_DIR: '/wordpress-phpunit',
					...dbEnv.credentials,
					...dbEnv.tests,
				},
			},
		},
		volumes: {
			...( ! config.env.development.coreSource && { wordpress: {} } ),
			...( ! config.env.tests.coreSource && { 'tests-wordpress': {} } ),
			mysql: {},
			'mysql-test': {},
			'phpunit-uploads': {},
			'user-home': {},
			'tests-user-home': {},
		},
	};
};
