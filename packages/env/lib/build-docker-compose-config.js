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

/**
 * @typedef {import('./config').WPConfig} WPConfig
 * @typedef {import('./config').WPServiceConfig} WPServiceConfig
 */

/**
 * Gets the volume mounts for an individual service.
 *
 * @param {WPServiceConfig} config           The service config to get the mounts from.
 * @param {string}          wordpressDefault The default internal path for the WordPress
 *                                           source code (such as tests-wordpress).
 *
 * @return {string[]} An array of volumes to mount in string format.
 */
function getMounts( config, wordpressDefault = 'wordpress' ) {
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

	const coreMount = `${
		config.coreSource ? config.coreSource.path : wordpressDefault
	}:/var/www/html`;

	return [
		...new Set( [
			coreMount,
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
	const developmentMounts = getMounts( config.env.development );
	const testsMounts = getMounts( config.env.tests, 'tests-wordpress' );

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

	// Set the WordPress, WP-CLI, PHPUnit PHP version if defined.
	const developmentPhpVersion = config.env.development.phpVersion
		? config.env.development.phpVersion
		: '';
	const testsPhpVersion = config.env.tests.phpVersion
		? config.env.tests.phpVersion
		: '';

	// Set the WordPress images with the PHP version tag.
	const developmentWpImage = `wordpress${
		developmentPhpVersion ? ':php' + developmentPhpVersion : ''
	}`;
	const testsWpImage = `wordpress${
		testsPhpVersion ? ':php' + testsPhpVersion : ''
	}`;
	// Set the WordPress CLI images with the PHP version tag.
	const developmentWpCliImage = `wordpress:cli${
		! developmentPhpVersion || developmentPhpVersion.length === 0
			? ''
			: '-php' + developmentPhpVersion
	}`;
	const testsWpCliImage = `wordpress:cli${
		! testsPhpVersion || testsPhpVersion.length === 0
			? ''
			: '-php' + testsPhpVersion
	}`;

	// Defaults are to use the most recent version of PHPUnit that provides
	// support for the specified version of PHP.
	// PHP Unit is assumed to be for Tests so use the testsPhpVersion.
	let phpunitTag = 'latest';
	const phpunitPhpVersion = '-php-' + testsPhpVersion + '-fpm';
	if ( testsPhpVersion === '5.6' ) {
		phpunitTag = '5' + phpunitPhpVersion;
	} else if ( testsPhpVersion === '7.0' ) {
		phpunitTag = '6' + phpunitPhpVersion;
	} else if ( testsPhpVersion === '7.1' ) {
		phpunitTag = '7' + phpunitPhpVersion;
	} else if ( [ '7.2', '7.3', '7.4' ].indexOf( testsPhpVersion ) >= 0 ) {
		phpunitTag = '8' + phpunitPhpVersion;
	} else if ( testsPhpVersion === '8.0' ) {
		phpunitTag = '9' + phpunitPhpVersion;
	}
	const phpunitImage = `wordpressdevelop/phpunit:${ phpunitTag }`;

	// The www-data user in wordpress:cli has a different UID (82) to the
	// www-data user in wordpress (33). Ensure we use the wordpress www-data
	// user for CLI commands.
	// https://github.com/docker-library/wordpress/issues/256
	const cliUser = '33:33';

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
					MYSQL_ROOT_PASSWORD:
						dbEnv.credentials.WORDPRESS_DB_PASSWORD,
					MYSQL_DATABASE: dbEnv.tests.WORDPRESS_DB_NAME,
				},
				volumes: [ 'mysql-test:/var/lib/mysql' ],
			},
			wordpress: {
				build: '.',
				depends_on: [ 'mysql' ],
				image: developmentWpImage,
				ports: [ developmentPorts ],
				environment: {
					...dbEnv.credentials,
					...dbEnv.development,
				},
				volumes: developmentMounts,
			},
			'tests-wordpress': {
				depends_on: [ 'tests-mysql' ],
				image: testsWpImage,
				ports: [ testsPorts ],
				environment: {
					...dbEnv.credentials,
					...dbEnv.tests,
				},
				volumes: testsMounts,
			},
			cli: {
				depends_on: [ 'wordpress' ],
				image: developmentWpCliImage,
				volumes: developmentMounts,
				user: cliUser,
				environment: {
					...dbEnv.credentials,
					...dbEnv.development,
				},
			},
			'tests-cli': {
				depends_on: [ 'tests-wordpress' ],
				image: testsWpCliImage,
				volumes: testsMounts,
				user: cliUser,
				environment: {
					...dbEnv.credentials,
					...dbEnv.tests,
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
					WP_PHPUNIT__TESTS_CONFIG:
						'/var/www/html/phpunit-wp-config.php',
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
		},
	};
};
