'use strict';
/**
 * Internal dependencies
 */
const buildDockerComposeConfig = require( '../runtime/docker/build-docker-compose-config' );
const getHostUser = require( '../runtime/docker/get-host-user' );

// The basic config keys which build docker compose config requires.
const CONFIG = {
	mappings: {},
	pluginSources: [],
	themeSources: [],
	port: 8888,
	configDirectoryPath: '/path/to/config',
};

jest.mock( '../runtime/docker/get-host-user', () => jest.fn() );
getHostUser.mockImplementation( () => {
	return {
		name: 'test',
		uid: 1,
		gid: 2,
		fullUser: '1:2',
	};
} );

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
			workDirectoryPath: '/path',
			env: { development: envConfig, tests: envConfig },
		} );
		const { volumes } = dockerConfig.services.wordpress;
		expect( volumes ).toEqual( [
			'wordpress:/var/www/html', // WordPress root.
			'/path/WordPress-PHPUnit/tests/phpunit:/wordpress-phpunit', // WordPress test library,
			'user-home:/home/test',
			'/path/to/wp-plugins:/var/www/html/wp-content/plugins', // Mapped plugins root.
			'/path/to/local/plugin:/var/www/html/wp-content/plugins/test-name', // Mapped plugin.
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
			workDirectoryPath: '/path',
			env: { development: envConfig, tests: envConfig },
		} );
		const devVolumes = dockerConfig.services.wordpress.volumes;
		const cliVolumes = dockerConfig.services.cli.volumes;
		expect( devVolumes ).toEqual( cliVolumes );

		const testsVolumes = dockerConfig.services[ 'tests-wordpress' ].volumes;
		const testsCliVolumes = dockerConfig.services[ 'tests-cli' ].volumes;
		expect( testsVolumes ).toEqual( testsCliVolumes );

		let localSources = [
			'/path/to/wp-plugins:/var/www/html/wp-content/plugins',
			'/path/WordPress-PHPUnit/tests/phpunit:/wordpress-phpunit',
			'user-home:/home/test',
			'/path/to/local/plugin:/var/www/html/wp-content/plugins/test-name',
			'/path/to/local/theme:/var/www/html/wp-content/themes/test-theme',
		];
		expect( devVolumes ).toEqual( expect.arrayContaining( localSources ) );

		localSources = [
			'/path/to/wp-plugins:/var/www/html/wp-content/plugins',
			'/path/tests-WordPress-PHPUnit/tests/phpunit:/wordpress-phpunit',
			'tests-user-home:/home/test',
			'/path/to/local/plugin:/var/www/html/wp-content/plugins/test-name',
			'/path/to/local/theme:/var/www/html/wp-content/themes/test-theme',
		];
		expect( testsVolumes ).toEqual(
			expect.arrayContaining( localSources )
		);
	} );

	it( 'should create "wordpress" and "tests-wordpress" volumes if they are needed by containers', () => {
		// CONFIG has no coreSource entry, so there are no core sources on the
		// local filesystem, so a volume should be created to contain core
		// sources.
		const dockerConfig = buildDockerComposeConfig( {
			workDirectoryPath: '/path',
			env: { development: CONFIG, tests: CONFIG },
		} );

		expect( dockerConfig.volumes.wordpress ).not.toBe( undefined );
		expect( dockerConfig.volumes[ 'tests-wordpress' ] ).not.toBe(
			undefined
		);
	} );

	it( 'should NOT create "wordpress" and "tests-wordpress" volumes if they are not needed by containers', () => {
		const envConfig = {
			...CONFIG,
			coreSource: {
				path: '/some/random/path',
				local: true,
			},
		};

		const dockerConfig = buildDockerComposeConfig( {
			workDirectoryPath: '/path',
			env: { development: envConfig, tests: envConfig },
		} );

		expect( dockerConfig.volumes.wordpress ).toBe( undefined );
		expect( dockerConfig.volumes[ 'tests-wordpress' ] ).toBe( undefined );
	} );

	it( 'should add healthcheck to mysql services', () => {
		const config = buildDockerComposeConfig( {
			workDirectoryPath: '/some/path',
			env: {
				development: {
					port: 8888,
					mysqlPort: 3306,
					coreSource: null,
					pluginSources: [],
					themeSources: [],
					mappings: {},
				},
				tests: {
					port: 8889,
					mysqlPort: 3307,
					coreSource: null,
					pluginSources: [],
					themeSources: [],
					mappings: {},
				},
			},
		} );

		expect( config.services.mysql.healthcheck ).toBeDefined();
		expect( config.services.mysql.healthcheck.test ).toEqual( [
			'CMD',
			'healthcheck.sh',
			'--connect',
			'--innodb_initialized',
		] );
		expect( config.services.mysql.healthcheck.interval ).toBe( '5s' );
		expect( config.services.mysql.healthcheck.timeout ).toBe( '10s' );
		expect( config.services.mysql.healthcheck.retries ).toBe( 12 );
		expect( config.services.mysql.healthcheck.start_period ).toBe( '60s' );

		// Verify MARIADB_AUTO_UPGRADE is set for existing installations
		expect( config.services.mysql.environment.MARIADB_AUTO_UPGRADE ).toBe(
			'1'
		);

		expect( config.services[ 'tests-mysql' ].healthcheck ).toBeDefined();
		expect( config.services[ 'tests-mysql' ].healthcheck.test ).toEqual( [
			'CMD',
			'healthcheck.sh',
			'--connect',
			'--innodb_initialized',
		] );
		expect(
			config.services[ 'tests-mysql' ].environment.MARIADB_AUTO_UPGRADE
		).toBe( '1' );
	} );

	it( 'should use service_healthy condition for WordPress depends_on', () => {
		const config = buildDockerComposeConfig( {
			workDirectoryPath: '/some/path',
			env: {
				development: {
					port: 8888,
					mysqlPort: 3306,
					coreSource: null,
					pluginSources: [],
					themeSources: [],
					mappings: {},
				},
				tests: {
					port: 8889,
					mysqlPort: 3307,
					coreSource: null,
					pluginSources: [],
					themeSources: [],
					mappings: {},
				},
			},
		} );

		expect( config.services.wordpress.depends_on ).toEqual( {
			mysql: { condition: 'service_healthy' },
		} );
		expect( config.services[ 'tests-wordpress' ].depends_on ).toEqual( {
			'tests-mysql': { condition: 'service_healthy' },
		} );
	} );
} );
