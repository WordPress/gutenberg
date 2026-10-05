import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
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
		expect( config.services.mysql.healthcheck.test[ 0 ] ).toBe(
			'CMD-SHELL'
		);
		expect( config.services.mysql.healthcheck.interval ).toBe( '5s' );
		expect( config.services.mysql.healthcheck.timeout ).toBe( '10s' );
		expect( config.services.mysql.healthcheck.retries ).toBe( 12 );
		expect( config.services.mysql.healthcheck.start_period ).toBe( '60s' );

		// Verify MARIADB_AUTO_UPGRADE is set for existing installations
		expect( config.services.mysql.environment.MARIADB_AUTO_UPGRADE ).toBe(
			'1'
		);

		expect( config.services[ 'tests-mysql' ].healthcheck ).toEqual(
			config.services.mysql.healthcheck
		);
		expect(
			config.services[ 'tests-mysql' ].environment.MARIADB_AUTO_UPGRADE
		).toBe( '1' );
	} );

	describe( 'mariadbVersion', () => {
		function buildWithVersions( development, tests ) {
			return buildDockerComposeConfig( {
				workDirectoryPath: '/path',
				env: {
					development: { ...CONFIG, mariadbVersion: development },
					tests: { ...CONFIG, mariadbVersion: tests },
				},
			} );
		}

		it( 'uses mariadb:lts by default', () => {
			const config = buildDockerComposeConfig( {
				workDirectoryPath: '/path',
				env: { development: CONFIG, tests: CONFIG },
			} );

			for ( const service of [ 'mysql', 'tests-mysql' ] ) {
				expect( config.services[ service ].image ).toBe(
					'mariadb:lts'
				);
			}
		} );

		it( 'treats null the same as unset', () => {
			const config = buildWithVersions( null, null );

			expect( config.services.mysql.image ).toBe( 'mariadb:lts' );
		} );

		it( 'uses each environment’s own version', () => {
			const config = buildWithVersions( '10.3', 'latest' );

			expect( config.services.mysql.image ).toBe( 'mariadb:10.3' );
			expect( config.services[ 'tests-mysql' ].image ).toBe(
				'mariadb:latest'
			);
		} );
	} );

	/*
	 * Runs the health check command in a shell, with stub scripts in place of
	 * the MariaDB tools. Each stub logs how it was called and exits with the
	 * code the test gives it.
	 */
	describe( 'MariaDB health check command', () => {
		const STUB =
			'#!/bin/sh\necho "${0##*/} $*" >> "$STUB_LOG"\nexit "$EXIT_CODE"\n';
		let directory;
		let binDirectory;
		let logFile;
		let configFile;

		beforeEach( () => {
			directory = fs.mkdtempSync(
				path.join( os.tmpdir(), 'wp-env-healthcheck-' )
			);
			binDirectory = path.join( directory, 'bin' );
			logFile = path.join( directory, 'calls.log' );
			configFile = path.join( directory, '.my-healthcheck.cnf' );
			fs.mkdirSync( binDirectory );
		} );

		afterEach( () => {
			fs.rmSync( directory, { recursive: true, force: true } );
		} );

		function addStub( name, exitCode ) {
			const stubPath = path.join( binDirectory, name );
			fs.writeFileSync(
				stubPath,
				STUB.replace( '"$EXIT_CODE"', String( exitCode ) )
			);
			fs.chmodSync( stubPath, 0o755 );
		}

		/*
		 * Runs the command the way Docker does after Compose replaces each `$$`
		 * with `$`, with the data directory's config file moved into the temporary
		 * directory, and only the stubs on the PATH.
		 */
		function runHealthcheck() {
			const [ , command ] = buildDockerComposeConfig( {
				workDirectoryPath: '/path',
				env: { development: CONFIG, tests: CONFIG },
			} ).services.mysql.healthcheck.test;
			const script = command
				.replaceAll( '$$', '$' )
				.replace( '/var/lib/mysql/.my-healthcheck.cnf', configFile );

			let exitCode = 0;
			try {
				execFileSync( '/bin/sh', [ '-c', script ], {
					env: {
						PATH: binDirectory,
						STUB_LOG: logFile,
						MYSQL_ROOT_PASSWORD: 'password',
					},
					stdio: 'ignore',
				} );
			} catch ( error ) {
				exitCode = error.status;
			}

			const calls = fs.existsSync( logFile )
				? fs.readFileSync( logFile, 'utf8' ).trim().split( '\n' )
				: [];

			return { exitCode, calls };
		}

		it.each( [ 0, 1 ] )(
			'runs healthcheck.sh and returns its exit code %j when the healthcheck user exists',
			( exitCode ) => {
				fs.writeFileSync( configFile, '' );
				addStub( 'healthcheck.sh', exitCode );
				addStub( 'mariadb-admin', 0 );

				expect( runHealthcheck() ).toEqual( {
					exitCode,
					calls: [ 'healthcheck.sh --connect --innodb_initialized' ],
				} );
			}
		);

		it.each( [ 0, 1 ] )(
			'pings with mariadb-admin and returns its exit code %j without the healthcheck user',
			( exitCode ) => {
				addStub( 'healthcheck.sh', 0 );
				addStub( 'mariadb-admin', exitCode );
				addStub( 'mysqladmin', 0 );

				expect( runHealthcheck() ).toEqual( {
					exitCode,
					calls: [
						'mariadb-admin ping -h 127.0.0.1 --protocol=tcp -uroot -ppassword',
					],
				} );
			}
		);

		it.each( [ 0, 1 ] )(
			'pings with mysqladmin and returns its exit code %j when mariadb-admin is missing',
			( exitCode ) => {
				addStub( 'mysqladmin', exitCode );

				expect( runHealthcheck() ).toEqual( {
					exitCode,
					calls: [
						'mysqladmin ping -h 127.0.0.1 --protocol=tcp -uroot -ppassword',
					],
				} );
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
