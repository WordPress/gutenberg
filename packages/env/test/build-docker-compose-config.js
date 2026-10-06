/**
 * Internal dependencies
 */
const buildDockerComposeConfig = require( '../lib/build-docker-compose-config' );

// The basic config keys which build docker compose config requires.
const CONFIG = {
	mappings: {},
	pluginSources: [],
	themeSources: [],
	port: 8888,
	configDirectoryPath: '/path/to/config',
};

describe( 'buildDockerComposeConfig', () => {
	it( 'should map directories before individual sources', () => {
		const envConfig = {
			...CONFIG,
			mappings: {
				'wp-content/plugins': {
					path: '/path/to/wp-plugins',
				},
			},
			pluginSources: [
				{ path: '/path/to/local/plugin', basename: 'test-name' },
			],
		};
		const dockerConfig = buildDockerComposeConfig( {
			env: { development: envConfig, tests: envConfig },
		} );
		const { volumes } = dockerConfig.services.wordpress;
		expect( volumes ).toEqual( [
			'wordpress:/var/www/html', // WordPress root
			'/path/to/wp-plugins:/var/www/html/wp-content/plugins', // Mapped plugins root
			'/path/to/local/plugin:/var/www/html/wp-content/plugins/test-name', // Mapped plugin
		] );
	} );

	it( 'should add all specified sources to tests, dev, and cli services', () => {
		const envConfig = {
			...CONFIG,
			mappings: {
				'wp-content/plugins': {
					path: '/path/to/wp-plugins',
				},
			},
			pluginSources: [
				{ path: '/path/to/local/plugin', basename: 'test-name' },
			],
			themeSources: [
				{ path: '/path/to/local/theme', basename: 'test-theme' },
			],
		};
		const dockerConfig = buildDockerComposeConfig( {
			env: { development: envConfig, tests: envConfig },
		} );
		const devVolumes = dockerConfig.services.wordpress.volumes;
		const cliVolumes = dockerConfig.services.cli.volumes;
		expect( devVolumes ).toEqual( cliVolumes );

		const testsVolumes = dockerConfig.services[ 'tests-wordpress' ].volumes;
		const testsCliVolumes = dockerConfig.services[ 'tests-cli' ].volumes;
		expect( testsVolumes ).toEqual( testsCliVolumes );

		const localSources = [
			'/path/to/wp-plugins:/var/www/html/wp-content/plugins',
			'/path/to/local/plugin:/var/www/html/wp-content/plugins/test-name',
			'/path/to/local/theme:/var/www/html/wp-content/themes/test-theme',
		];

		expect( devVolumes ).toEqual( expect.arrayContaining( localSources ) );
		expect( testsVolumes ).toEqual(
			expect.arrayContaining( localSources )
		);
	} );

	it( 'should let Docker Compose choose the MariaDB version from WP_ENV_MARIADB_VERSION', () => {
		const dockerConfig = buildDockerComposeConfig( {
			env: { development: CONFIG, tests: CONFIG },
		} );

		expect( dockerConfig.services.mysql.image ).toBe(
			'mariadb:${WP_ENV_MARIADB_VERSION:-latest}'
		);
		expect( dockerConfig.services[ 'tests-mysql' ].image ).toBe(
			'mariadb:${WP_ENV_MARIADB_VERSION:-latest}'
		);
	} );

	it( 'should create a separate database for each environment', () => {
		const { services } = buildDockerComposeConfig( {
			env: { development: CONFIG, tests: CONFIG },
		} );

		expect( services.mysql.environment.MYSQL_DATABASE ).toBe( 'wordpress' );
		expect( services[ 'tests-mysql' ].environment.MYSQL_DATABASE ).toBe(
			'tests-wordpress'
		);
		expect( services[ 'tests-mysql' ].volumes ).toEqual( [
			'mysql-test:/var/lib/mysql',
		] );
		for ( const service of [ 'tests-wordpress', 'tests-cli', 'phpunit' ] ) {
			expect( services[ service ].environment ).toEqual(
				expect.objectContaining( {
					WORDPRESS_DB_NAME: 'tests-wordpress',
					WORDPRESS_DB_HOST: 'tests-mysql',
				} )
			);
		}
	} );
} );
