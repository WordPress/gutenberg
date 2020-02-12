'use strict';
/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * @typedef {import('./config').Config} Config
 */

/**
 * Creates a docker-compose config object which, when serialized into a
 * docker-compose.yml file, tells docker-compose how to run the environment.
 *
 * @param {Config} config A wp-env config object.
 * @return {Object} A docker-compose config object, ready to serialize into YAML.
 */
module.exports = function buildDockerComposeConfig( config ) {
	const pluginMounts = config.pluginSources.flatMap( ( source ) => [
		`${ source.path }:/var/www/html/wp-content/plugins/${ source.basename }`,

		// If this is is the Gutenberg plugin, then mount its E2E test plugins.
		// TODO: Implement an API that lets Gutenberg mount test plugins without this workaround.
		...( fs.existsSync( path.resolve( source.path, 'gutenberg.php' ) )
			? [
					`${ source.path }/packages/e2e-tests/plugins:/var/www/html/wp-content/plugins/gutenberg-test-plugins`,
					`${ source.path }/packages/e2e-tests/mu-plugins:/var/www/html/wp-content/mu-plugins`,
			  ]
			: [] ),
	] );

	const themeMounts = config.themeSources.map(
		( source ) =>
			`${ source.path }:/var/www/html/wp-content/themes/${ source.basename }`
	);

	const developmentMounts = [
		`${
			config.coreSource ? config.coreSource.path : 'wordpress'
		}:/var/www/html`,
		...pluginMounts,
		...themeMounts,
	];

	const testsMounts = [
		`${
			config.coreSource ? config.coreSource.testsPath : 'tests-wordpress'
		}:/var/www/html`,
		...pluginMounts,
		...themeMounts,
	];

	return {
		version: '3.7',
		services: {
			mysql: {
				image: 'mariadb',
				environment: {
					MYSQL_ALLOW_EMPTY_PASSWORD: 'yes',
				},
			},
			wordpress: {
				depends_on: [ 'mysql' ],
				image: 'wordpress',
				ports: [ '${WP_ENV_PORT:-8888}:80' ],
				environment: {
					WORDPRESS_DEBUG: '1',
					WORDPRESS_DB_NAME: 'wordpress',
				},
				volumes: developmentMounts,
			},
			'tests-wordpress': {
				depends_on: [ 'mysql' ],
				image: 'wordpress',
				ports: [ '${WP_ENV_TESTS_PORT:-8889}:80' ],
				environment: {
					WORDPRESS_DEBUG: '1',
					WORDPRESS_DB_NAME: 'tests-wordpress',
				},
				volumes: testsMounts,
			},
			cli: {
				depends_on: [ 'wordpress' ],
				image: 'wordpress:cli',
				volumes: developmentMounts,
			},
			'tests-cli': {
				depends_on: [ 'wordpress' ],
				image: 'wordpress:cli',
				volumes: testsMounts,
			},
			composer: {
				image: 'composer',
				volumes: [ `${ config.configDirectoryPath }:/app` ],
			},
		},
		volumes: {
			...( ! config.coreSource && { wordpress: {} } ),
			...( ! config.coreSource && { 'tests-wordpress': {} } ),
		},
	};
};
