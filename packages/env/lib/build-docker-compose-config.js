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
 * The database healthcheck.
 *
 * MariaDB's `healthcheck.sh` runs when the image can use it: --connect
 * verifies a TCP connection and that the entrypoint has finished, and
 * --innodb_initialized ensures InnoDB is fully initialized. It connects as a
 * healthcheck user whose credentials the entrypoint writes to
 * `.my-healthcheck.cnf` in the data directory, and the MARIADB_AUTO_UPGRADE env
 * var ensures that user exists for existing installations.
 *
 * Images for older MariaDB versions may predate that user or the script (the
 * script was added to the images in 2022 and the user in 2023, and older tags
 * were never rebuilt). The file is in the data volume and the script is in the
 * image, so an older image can find a file a newer one left behind. The script
 * is used only when both exist, and the server is pinged over TCP otherwise,
 * with `mariadb-admin` (11.0+ only ships this name) or `mysqladmin` (versions
 * before 10.4 only ship this name). The image is checked at runtime rather
 * than by its tag, so every version, including `lts` and `latest`, uses the
 * same check. Using 127.0.0.1 rather than localhost avoids the Unix socket,
 * which the temporary server used to initialize a new volume answers before
 * the real server is listening.
 *
 * Timing is generous to support slow CI environments.
 */
const MARIADB_HEALTHCHECK = {
	test: [
		'CMD-SHELL',
		'if [ -f /var/lib/mysql/.my-healthcheck.cnf ] && command -v healthcheck.sh > /dev/null; then healthcheck.sh --connect --innodb_initialized; else "$$(command -v mariadb-admin || echo mysqladmin)" ping -h 127.0.0.1 --protocol=tcp -uroot -p"$$MYSQL_ROOT_PASSWORD"; fi',
	],
	interval: '5s',
	timeout: '10s',
	retries: 12,
	start_period: '60s',
};

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

	// Set the default ports based on the config values.
	const developmentPorts = `\${WP_ENV_PORT:-${ config.port }}:80`;
	const testsPorts = `\${WP_ENV_TESTS_PORT:-${ config.testsPort }}:80`;

	// The www-data user in wordpress:cli has a different UID (82) to the
	// www-data user in wordpress (33). Ensure we use the wordpress www-data
	// user for CLI commands.
	// https://github.com/docker-library/wordpress/issues/256
	const cliUser = '33:33';

	return {
		version: '3.7',
		services: {
			mysql: {
				image: 'mariadb:${WP_ENV_MARIADB_VERSION:-latest}',
				environment: {
					MYSQL_ALLOW_EMPTY_PASSWORD: 'yes',
					// Ensures healthcheck user is created for existing installations.
					MARIADB_AUTO_UPGRADE: '1',
				},
				healthcheck: MARIADB_HEALTHCHECK,
			},
			wordpress: {
				depends_on: {
					mysql: {
						condition: 'service_healthy',
					},
				},
				image: 'wordpress',
				ports: [ developmentPorts ],
				environment: {
					WORDPRESS_DB_NAME: 'wordpress',
					WORDPRESS_DB_USER: 'root',
					WORDPRESS_DB_PASSWORD: '',
				},
				volumes: developmentMounts,
			},
			'tests-wordpress': {
				depends_on: {
					mysql: {
						condition: 'service_healthy',
					},
				},
				image: 'wordpress',
				ports: [ testsPorts ],
				environment: {
					WORDPRESS_DB_NAME: 'tests-wordpress',
					WORDPRESS_DB_USER: 'root',
					WORDPRESS_DB_PASSWORD: '',
				},
				volumes: testsMounts,
			},
			cli: {
				depends_on: [ 'wordpress' ],
				image: 'wordpress:cli',
				volumes: developmentMounts,
				user: cliUser,
				environment: {
					WORDPRESS_DB_USER: 'root',
					WORDPRESS_DB_PASSWORD: '',
				},
			},
			'tests-cli': {
				depends_on: [ 'wordpress' ],
				image: 'wordpress:cli',
				volumes: testsMounts,
				user: cliUser,
				environment: {
					WORDPRESS_DB_USER: 'root',
					WORDPRESS_DB_PASSWORD: '',
				},
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
