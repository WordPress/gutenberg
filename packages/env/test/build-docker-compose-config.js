/**
 * External dependencies
 */
const { execFileSync } = require( 'child_process' );
const fs = require( 'fs' );
const os = require( 'os' );
const path = require( 'path' );

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
			'wordpress:/var/www/html', // WordPress root.
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

	it( 'should not map the default phpunit uploads directory if the user has specified their own directory', () => {
		const envConfig = {
			...CONFIG,
			mappings: {
				'wp-content/uploads': {
					path: '/path/to/wp-uploads',
				},
			},
		};
		const dockerConfig = buildDockerComposeConfig( {
			env: { development: envConfig, tests: envConfig },
		} );
		const expectedVolumes = [
			'tests-wordpress:/var/www/html',
			'/path/to/wp-uploads:/var/www/html/wp-content/uploads',
		];
		expect( dockerConfig.services.phpunit.volumes ).toEqual(
			expectedVolumes
		);
	} );

	it( 'should map the default phpunit uploads directory even if the user has specified their own directory only for the development instance', () => {
		const envConfig = {
			...CONFIG,
			mappings: {
				'wp-content/uploads': {
					path: '/path/to/wp-uploads',
				},
			},
		};
		const dockerConfig = buildDockerComposeConfig( {
			env: { development: envConfig, tests: CONFIG },
		} );
		const expectedVolumes = [
			'tests-wordpress:/var/www/html',
			'phpunit-uploads:/var/www/html/wp-content/uploads',
		];
		expect( dockerConfig.services.phpunit.volumes ).toEqual(
			expectedVolumes
		);
	} );

	it( 'should create "wordpress" and "tests-wordpress" volumes if they are needed by containers', () => {
		// CONFIG has no coreSource entry, so there are no core sources on the
		// local filesystem, so a volume should be created to contain core
		// sources.
		const dockerConfig = buildDockerComposeConfig( {
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
			env: { development: envConfig, tests: envConfig },
		} );

		expect( dockerConfig.volumes.wordpress ).toBe( undefined );
		expect( dockerConfig.volumes[ 'tests-wordpress' ] ).toBe( undefined );
	} );

	describe( 'mariadbVersion', () => {
		it( 'uses the floating mariadb image by default', () => {
			const config = buildDockerComposeConfig( {
				workDirectoryPath: '/path',
				env: { development: CONFIG, tests: CONFIG },
			} );

			expect( config.services.mysql.image ).toBe( 'mariadb' );
			expect( config.services[ 'tests-mysql' ].image ).toBe( 'mariadb' );
		} );

		it( 'treats null the same as unset', () => {
			const config = buildDockerComposeConfig( {
				workDirectoryPath: '/path',
				env: {
					development: { ...CONFIG, mariadbVersion: null },
					tests: { ...CONFIG, mariadbVersion: null },
				},
			} );

			expect( config.services.mysql.image ).toBe( 'mariadb' );
		} );

		it( 'uses each environment’s own version', () => {
			const config = buildDockerComposeConfig( {
				workDirectoryPath: '/path',
				env: {
					development: { ...CONFIG, mariadbVersion: '10.6.4' },
					tests: { ...CONFIG, mariadbVersion: 'latest' },
				},
			} );

			expect( config.services.mysql.image ).toBe( 'mariadb:10.6.4' );
			expect( config.services[ 'tests-mysql' ].image ).toBe(
				'mariadb:latest'
			);
		} );
	} );

	it( 'should add healthcheck to mysql services', () => {
		const config = buildDockerComposeConfig( {
			workDirectoryPath: '/path',
			env: { development: CONFIG, tests: CONFIG },
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

	/*
	 * Runs the health check command in a shell, with stub scripts in place of
	 * the MariaDB tools. Each stub logs how it was called and exits with the
	 * code the test gives it. Skipped on Windows, which has no `/bin/sh` to run
	 * the command or the stubs; the command itself only ever runs in Linux
	 * containers.
	 */
	( process.platform === 'win32' ? describe.skip : describe )(
		'MariaDB health check command',
		() => {
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
					.split( '$$' )
					.join( '$' )
					.replace(
						'/var/lib/mysql/.my-healthcheck.cnf',
						configFile
					);

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
						calls: [
							'healthcheck.sh --connect --innodb_initialized',
						],
					} );
				}
			);

			it( 'pings instead when the healthcheck user exists but the image has no healthcheck.sh', () => {
				fs.writeFileSync( configFile, '' );
				addStub( 'mariadb-admin', 0 );

				expect( runHealthcheck() ).toEqual( {
					exitCode: 0,
					calls: [
						'mariadb-admin ping -h 127.0.0.1 --protocol=tcp -uroot -ppassword',
					],
				} );
			} );

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
		}
	);

	it( 'should use service_healthy condition for WordPress depends_on', () => {
		const config = buildDockerComposeConfig( {
			workDirectoryPath: '/path',
			env: { development: CONFIG, tests: CONFIG },
		} );

		expect( config.services.wordpress.depends_on ).toEqual( {
			mysql: { condition: 'service_healthy' },
		} );
		expect( config.services[ 'tests-wordpress' ].depends_on ).toEqual( {
			'tests-mysql': { condition: 'service_healthy' },
		} );
	} );
} );
