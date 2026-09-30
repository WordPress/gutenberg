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
	testsPort: 8889,
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
		const dockerConfig = buildDockerComposeConfig( envConfig );
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
		const dockerConfig = buildDockerComposeConfig( envConfig );
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
		const dockerConfig = buildDockerComposeConfig( CONFIG );

		expect( dockerConfig.services.mysql.image ).toBe(
			'mariadb:${WP_ENV_MARIADB_VERSION:-latest}'
		);
		expect( dockerConfig.services[ 'tests-mysql' ].image ).toBe(
			'mariadb:${WP_ENV_MARIADB_VERSION:-latest}'
		);
	} );

	it( 'should create a separate database for each environment', () => {
		const { services } = buildDockerComposeConfig( CONFIG );

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

	it( 'should add healthcheck to the mysql service', () => {
		const config = buildDockerComposeConfig( CONFIG );

		for ( const service of [ 'mysql', 'tests-mysql' ] ) {
			expect( config.services[ service ].healthcheck ).toEqual( {
				test: [ 'CMD-SHELL', expect.any( String ) ],
				interval: '5s',
				timeout: '10s',
				retries: 12,
				start_period: '60s',
			} );

			// Verify MARIADB_AUTO_UPGRADE is set for existing installations
			expect(
				config.services[ service ].environment.MARIADB_AUTO_UPGRADE
			).toBe( '1' );
		}
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
				const [ , command ] = buildDockerComposeConfig(
					CONFIG
				).services.mysql.healthcheck.test;
				const script = command
					.replace( /\$\$/g, '$' )
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
		const config = buildDockerComposeConfig( CONFIG );

		expect( config.services.wordpress.depends_on ).toEqual( {
			mysql: { condition: 'service_healthy' },
		} );
		expect( config.services[ 'tests-wordpress' ].depends_on ).toEqual( {
			'tests-mysql': { condition: 'service_healthy' },
		} );
	} );
} );
