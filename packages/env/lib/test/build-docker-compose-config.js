import { createRequire } from 'node:module';
import { afterAll, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const getHostUserPath = require.resolve( '../runtime/docker/get-host-user' );
const originalGetHostUser = require( getHostUserPath );
const getHostUser = vi.fn( () => ( {
	name: 'test',
	uid: 1,
	gid: 2,
	fullUser: '1:2',
} ) );
require.cache[ getHostUserPath ].exports = getHostUser;
const buildDockerComposeConfig = require( '../runtime/docker/build-docker-compose-config' );
const {
	wordpressDockerFileContents,
	getLoopbackPortConfig,
} = require( '../runtime/docker/docker-config' );

afterAll( () => {
	require.cache[ getHostUserPath ].exports = originalGetHostUser;
	delete require.cache[
		require.resolve( '../runtime/docker/build-docker-compose-config' )
	];
} );

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

	describe( 'mariadbVersion', () => {
		const MODERN_HEALTHCHECK = {
			test: [
				'CMD',
				'healthcheck.sh',
				'--connect',
				'--innodb_initialized',
			],
			interval: '5s',
			timeout: '10s',
			retries: 12,
			start_period: '60s',
		};

		const PINNED_HEALTHCHECK = {
			test: [
				'CMD-SHELL',
				'if command -v healthcheck.sh > /dev/null; then healthcheck.sh --connect --innodb_initialized; else mysqladmin ping -h 127.0.0.1 --protocol=tcp -uroot -p"$$MYSQL_ROOT_PASSWORD"; fi',
			],
			interval: '5s',
			timeout: '10s',
			retries: 12,
			start_period: '60s',
		};

		function buildWithVersions( development, tests ) {
			return buildDockerComposeConfig( {
				workDirectoryPath: '/path',
				env: {
					development: { ...CONFIG, mariadbVersion: development },
					tests: { ...CONFIG, mariadbVersion: tests },
				},
			} );
		}

		it( 'uses mariadb:lts and the current health check by default', () => {
			const config = buildDockerComposeConfig( {
				workDirectoryPath: '/path',
				env: { development: CONFIG, tests: CONFIG },
			} );

			for ( const service of [ 'mysql', 'tests-mysql' ] ) {
				expect( config.services[ service ].image ).toBe(
					'mariadb:lts'
				);
				expect( config.services[ service ].healthcheck ).toEqual(
					MODERN_HEALTHCHECK
				);
			}
		} );

		it( 'treats null the same as unset', () => {
			const config = buildWithVersions( null, null );

			expect( config.services.mysql.image ).toBe( 'mariadb:lts' );
			expect( config.services.mysql.healthcheck ).toEqual(
				MODERN_HEALTHCHECK
			);
		} );

		it( 'uses each environment’s own version', () => {
			const config = buildWithVersions( '10.3', 'latest' );

			expect( config.services.mysql.image ).toBe( 'mariadb:10.3' );
			expect( config.services.mysql.healthcheck ).toEqual(
				PINNED_HEALTHCHECK
			);
			expect( config.services[ 'tests-mysql' ].image ).toBe(
				'mariadb:latest'
			);
			expect( config.services[ 'tests-mysql' ].healthcheck ).toEqual(
				MODERN_HEALTHCHECK
			);
		} );

		it.each( [
			'5',
			'5.5',
			'10.0',
			'10.3',
			'10.3.39',
			'10.5.8',
			'10.6.4',
			'10',
			'10.11',
			'11',
			'11.4.2',
		] )(
			'uses the health check that detects healthcheck.sh for %j',
			( version ) => {
				const config = buildWithVersions( version, version );

				expect( config.services.mysql.image ).toBe(
					`mariadb:${ version }`
				);
				expect( config.services.mysql.healthcheck ).toEqual(
					PINNED_HEALTHCHECK
				);
				expect( config.services[ 'tests-mysql' ].healthcheck ).toEqual(
					PINNED_HEALTHCHECK
				);
			}
		);

		it.each( [ 'lts', 'latest' ] )(
			'uses the current health check for %j',
			( version ) => {
				const config = buildWithVersions( version, version );

				expect( config.services.mysql.image ).toBe(
					`mariadb:${ version }`
				);
				expect( config.services.mysql.healthcheck ).toEqual(
					MODERN_HEALTHCHECK
				);
			}
		);
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

	describe( 'testsEnvironment', () => {
		it( 'should omit tests services when testsEnvironment is false', () => {
			const dockerConfig = buildDockerComposeConfig( {
				testsEnvironment: false,
				workDirectoryPath: '/path',
				env: {
					development: CONFIG,
					tests: CONFIG,
				},
			} );

			// Development services should exist.
			expect( dockerConfig.services.mysql ).toBeDefined();
			expect( dockerConfig.services.wordpress ).toBeDefined();
			expect( dockerConfig.services.cli ).toBeDefined();
			expect( dockerConfig.services.phpmyadmin ).toBeDefined();

			// Tests services should not exist.
			expect( dockerConfig.services[ 'tests-mysql' ] ).toBeUndefined();
			expect(
				dockerConfig.services[ 'tests-wordpress' ]
			).toBeUndefined();
			expect( dockerConfig.services[ 'tests-cli' ] ).toBeUndefined();
			expect(
				dockerConfig.services[ 'tests-phpmyadmin' ]
			).toBeUndefined();
		} );

		it( 'should omit tests volumes when testsEnvironment is false', () => {
			const dockerConfig = buildDockerComposeConfig( {
				testsEnvironment: false,
				workDirectoryPath: '/path',
				env: {
					development: CONFIG,
					tests: CONFIG,
				},
			} );

			// Development volumes should exist.
			expect( dockerConfig.volumes.wordpress ).toBeDefined();
			expect( dockerConfig.volumes.mysql ).toBeDefined();
			expect( dockerConfig.volumes[ 'user-home' ] ).toBeDefined();

			// Tests volumes should not exist.
			expect( dockerConfig.volumes[ 'tests-wordpress' ] ).toBeUndefined();
			expect( dockerConfig.volumes[ 'mysql-test' ] ).toBeUndefined();
			expect( dockerConfig.volumes[ 'tests-user-home' ] ).toBeUndefined();
		} );

		it( 'should include tests services by default', () => {
			const dockerConfig = buildDockerComposeConfig( {
				workDirectoryPath: '/path',
				env: {
					development: CONFIG,
					tests: CONFIG,
				},
			} );

			expect( dockerConfig.services[ 'tests-mysql' ] ).toBeDefined();
			expect( dockerConfig.services[ 'tests-wordpress' ] ).toBeDefined();
			expect( dockerConfig.services[ 'tests-cli' ] ).toBeDefined();
		} );
	} );
} );

describe( 'getLoopbackPortConfig', () => {
	it( 'returns Apache Listen and VirtualHost edits for a non-default port using an anchored sed pattern', () => {
		const out = getLoopbackPortConfig( 8888 );
		expect( out ).toContain( 'Listen 8888' );
		expect( out ).toContain( '/etc/apache2/ports.conf' );
		expect( out ).toContain( '<VirtualHost *:80 *:8888>' );
		expect( out ).toContain(
			'/etc/apache2/sites-enabled/000-default.conf'
		);
		// Guard against a future "simplification" to a greedy s/80/.../g
		// that would also match e.g. unrelated "80" substrings.
		expect( out ).not.toMatch( /s\|80\|/ );
		expect( out ).toMatch( /s\|<VirtualHost \\\*:80>\|/ );
	} );

	it( 'returns an empty string for port 80 (Apache already listens there)', () => {
		expect( getLoopbackPortConfig( 80 ) ).toBe( '' );
	} );

	it( 'returns an empty string for port 443 (wp-env does not configure SSL)', () => {
		expect( getLoopbackPortConfig( 443 ) ).toBe( '' );
	} );
} );

describe( 'wordpressDockerFileContents', () => {
	it( 'injects the resolved per-environment port into the generated Dockerfile', () => {
		const config = {
			xdebug: 'off',
			spx: 'off',
			env: {
				development: { port: 8888, phpVersion: null },
				tests: { port: 8889, phpVersion: null },
			},
		};
		const dockerfile = wordpressDockerFileContents( 'tests', config );
		// Proves getLoopbackPortConfig is wired in AND that each environment
		// uses its own port (not the development port).
		expect( dockerfile ).toContain( 'Listen 8889' );
		expect( dockerfile ).not.toContain( 'Listen 8888' );
	} );
} );
