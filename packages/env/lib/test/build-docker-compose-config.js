'use strict';
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
const buildDockerComposeConfig = require( '../runtime/docker/build-docker-compose-config' );
const {
	wordpressDockerFileContents,
	cliDockerFileContents,
	getLoopbackPortConfig,
} = require( '../runtime/docker/docker-config' );
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
					.replaceAll( '$$', '$' )
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

describe( 'cliDockerFileContents', () => {
	const config = {
		xdebug: 'off',
		spx: 'off',
		env: { development: { port: 8888, phpVersion: null } },
	};

	it( 'wraps the MariaDB clients to skip server certificate verification', () => {
		expect( cliDockerFileContents( 'development', config ) ).toContain(
			'RUN for bin in mariadb mariadb-check mariadb-dump mysql mysqlcheck mysqldump; do'
		);
	} );

	/*
	 * Runs the Dockerfile step that writes the wrappers in a shell, with
	 * `/usr/bin` and `/usr/local/bin` replaced by temporary directories, and
	 * stub clients that log how they were called. Skipped on Windows, which
	 * has no `/bin/sh`; the step itself only ever runs in the Linux CLI image.
	 */
	( process.platform === 'win32' ? describe.skip : describe )(
		'MariaDB client wrappers',
		() => {
			let directory;
			let clientDirectory;
			let wrapperDirectory;
			let logFile;

			beforeEach( () => {
				directory = fs.mkdtempSync(
					path.join( os.tmpdir(), 'wp-env-client-wrappers-' )
				);
				clientDirectory = path.join( directory, 'usr-bin' );
				wrapperDirectory = path.join( directory, 'usr-local-bin' );
				logFile = path.join( directory, 'calls.log' );
				fs.mkdirSync( clientDirectory );
				fs.mkdirSync( wrapperDirectory );
			} );

			afterEach( () => {
				fs.rmSync( directory, { recursive: true, force: true } );
			} );

			function addClient( name, exitCode ) {
				const clientPath = path.join( clientDirectory, name );
				fs.writeFileSync(
					clientPath,
					`#!/bin/sh\necho "\${0##*/} $*" >> "${ logFile }"\nexit ${ exitCode }\n`
				);
				fs.chmodSync( clientPath, 0o755 );
			}

			// Runs the Dockerfile step with the temporary directories in place.
			function writeWrappers() {
				const dockerfile = cliDockerFileContents(
					'development',
					config
				);
				const step = dockerfile
					.slice(
						dockerfile.indexOf( 'RUN for bin in mariadb' ) +
							'RUN '.length,
						dockerfile.indexOf(
							'\ndone',
							dockerfile.indexOf( 'RUN for bin in mariadb' )
						) + '\ndone'.length
					)
					.replaceAll( '/usr/local/bin/', `${ wrapperDirectory }/` )
					.replaceAll( '/usr/bin/', `${ clientDirectory }/` );

				execFileSync( '/bin/sh', [ '-c', step ] );
			}

			function runWrapper( name, args ) {
				let exitCode = 0;
				try {
					execFileSync( path.join( wrapperDirectory, name ), args, {
						stdio: 'ignore',
					} );
				} catch ( error ) {
					exitCode = error.status;
				}

				return {
					exitCode,
					calls: fs
						.readFileSync( logFile, 'utf8' )
						.trim()
						.split( '\n' ),
				};
			}

			it( 'adds the flag after --no-defaults, which has to stay first', () => {
				addClient( 'mariadb-check', 0 );
				writeWrappers();

				expect(
					runWrapper( 'mariadb-check', [
						'--no-defaults',
						'wordpress',
						'--host=mysql',
					] )
				).toEqual( {
					exitCode: 0,
					calls: [
						'mariadb-check --no-defaults --skip-ssl-verify-server-cert wordpress --host=mysql',
					],
				} );
			} );

			it( 'adds the flag first when there is no --no-defaults', () => {
				addClient( 'mysql', 0 );
				writeWrappers();

				expect( runWrapper( 'mysql', [ '-e', 'SELECT 1' ] ) ).toEqual( {
					exitCode: 0,
					calls: [
						'mysql --skip-ssl-verify-server-cert -e SELECT 1',
					],
				} );
			} );

			it( 'returns the client’s exit code', () => {
				addClient( 'mariadb', 3 );
				writeWrappers();

				expect( runWrapper( 'mariadb', [] ).exitCode ).toBe( 3 );
			} );

			it( 'only wraps the clients the image has', () => {
				addClient( 'mysql', 0 );
				writeWrappers();

				expect( fs.readdirSync( wrapperDirectory ) ).toEqual( [
					'mysql',
				] );
			} );
		}
	);
} );
