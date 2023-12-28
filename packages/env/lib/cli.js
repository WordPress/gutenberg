'use strict';
/**
 * External dependencies
 */
const chalk = require( 'chalk' );
const ora = require( 'ora' );
const yargs = require( 'yargs' );
const terminalLink = require( 'terminal-link' );
const { execSync } = require( 'child_process' );

/**
 * Internal dependencies
 */
const pkg = require( '../package.json' );
const env = require( './env' );
const parseXdebugMode = require( './parse-xdebug-mode' );
const {
	RUN_CONTAINERS,
	validateRunContainer,
} = require( './validate-run-container' );

// Colors.
const boldWhite = chalk.bold.white;
const wpPrimary = boldWhite.bgHex( '#00669b' );
const wpGreen = boldWhite.bgHex( '#4ab866' );
const wpRed = boldWhite.bgHex( '#d94f4f' );
const wpYellow = boldWhite.bgHex( '#f0b849' );

// Spinner.
const withSpinner =
	( command ) =>
	( ...args ) => {
		const spinner = ora().start();
		args[ 0 ].spinner = spinner;
		let time = process.hrtime();
		return command( ...args ).then(
			( message ) => {
				time = process.hrtime( time );
				spinner.succeed(
					`${ message || spinner.text } (in ${ time[ 0 ] }s ${ (
						time[ 1 ] / 1e6
					).toFixed( 0 ) }ms)`
				);
				process.exit( 0 );
			},
			( error ) => {
				if (
					error instanceof env.ValidationError ||
					error instanceof env.LifecycleScriptError
				) {
					// Error is a configuration error. That means the user did something wrong.
					spinner.fail( error.message );
					process.exit( 1 );
				} else if (
					error &&
					typeof error === 'object' &&
					'exitCode' in error &&
					'err' in error &&
					'out' in error
				) {
					// Error is a docker compose error. That means something docker-related failed.
					// https://github.com/PDMLab/docker-compose/blob/HEAD/src/index.ts
					spinner.fail(
						'Error while running docker compose command.'
					);
					if ( error.out ) {
						process.stdout.write( error.out );
					}
					if ( error.err ) {
						process.stderr.write( error.err );
					}
					process.exit( error.exitCode );
				} else if ( error ) {
					// Error is an unknown error. That means there was a bug in our code.
					spinner.fail(
						typeof error === 'string' ? error : error.message
					);
					// Disable reason: Using console.error() means we get a stack trace.
					console.error( error );
					process.exit( 1 );
				} else {
					spinner.fail( 'An unknown error occurred.' );
					process.exit( 1 );
				}
			}
		);
	};

module.exports = function cli() {
	// Do nothing if Docker is unavailable.
	try {
		execSync( 'docker info', { stdio: 'ignore' } );
	} catch {
		console.error(
			chalk.red( 'Could not connect to Docker. Is it running?' )
		);
		process.exit( 1 );
	}

	yargs.usage( wpPrimary( '$0 <command>' ) );
	yargs.option( 'debug', {
		type: 'boolean',
		describe: 'Enable debug output.',
		default: false,
	} );

	yargs.parserConfiguration( {
		// Treats unknown options as arguments for commands to deal with instead of discarding them.
		'unknown-options-as-args': true,
		// Populates '--' in the command options with arguments after the double dash.
		'populate--': true,
	} );

	// Since we might be running a different CLI version than the one that was called
	// we need to set the version manually from the correct package.json.
	yargs.version( pkg.version );

	yargs.command(
		'start',
		wpGreen(
			chalk`Starts WordPress for development on port {bold.underline ${ terminalLink(
				'8888',
				'http://localhost:8888'
			) }} (override with WP_ENV_PORT) and tests on port {bold.underline ${ terminalLink(
				'8889',
				'http://localhost:8889'
			) }} (override with WP_ENV_TESTS_PORT). The current working directory must be a WordPress installation, a plugin, a theme, or contain a .wp-env.json file. After first install, use the '--update' flag to download updates to mapped sources and to re-apply WordPress configuration options.`
		),
		( args ) => {
			args.option( 'update', {
				type: 'boolean',
				describe:
					'Download source updates and apply WordPress configuration.',
				default: false,
			} );
			args.option( 'xdebug', {
				describe:
					'Enables Xdebug. If not passed, Xdebug is turned off. If no modes are set, uses "debug". You may set multiple Xdebug modes by passing them in a comma-separated list: `--xdebug=develop,coverage`. See https://xdebug.org/docs/all_settings#mode for information about Xdebug modes.',
				coerce: parseXdebugMode,
				type: 'string',
			} );
			args.option( 'scripts', {
				type: 'boolean',
				describe: 'Execute any configured lifecycle scripts.',
				default: true,
			} );
		},
		withSpinner( env.start )
	);
	yargs.command(
		'stop',
		wpRed(
			'Stops running WordPress for development and tests and frees the ports.'
		),
		() => {},
		withSpinner( env.stop )
	);
	yargs.command(
		'clean [environment]',
		wpYellow( 'Cleans the WordPress databases.' ),
		( args ) => {
			args.positional( 'environment', {
				type: 'string',
				describe: "Which environments' databases to clean.",
				choices: [ 'all', 'development', 'tests' ],
				default: 'tests',
			} );
			args.option( 'scripts', {
				type: 'boolean',
				describe: 'Execute any configured lifecycle scripts.',
				default: true,
			} );
		},
		withSpinner( env.clean )
	);
	yargs.command(
		'logs [environment]',
		'displays PHP and Docker logs for given WordPress environment.',
		( args ) => {
			args.positional( 'environment', {
				type: 'string',
				describe: 'Which environment to display the logs from.',
				choices: [ 'development', 'tests', 'all' ],
				default: 'development',
			} );
			args.option( 'watch', {
				type: 'boolean',
				default: true,
				describe: 'Watch for logs as they happen.',
			} );
		},
		withSpinner( env.logs )
	);
	yargs.example(
		'$0 logs --no-watch --environment=tests',
		'Displays the latest logs for the e2e test environment without watching.'
	);
	yargs.command(
		'run <container> [command...]',
		'Runs an arbitrary command in one of the underlying Docker containers. A double dash can be used to pass arguments to the container without parsing them. This is necessary if you are using an option that is defined below. You can use `bash` to open a shell session and both `composer` and `phpunit` are available in all WordPress and CLI containers. WP-CLI is also available in the CLI containers.',
		( args ) => {
			args.option( 'env-cwd', {
				type: 'string',
				requiresArg: true,
				default: '.',
				describe:
					"The command's working directory inside of the container. Paths without a leading slash are relative to the WordPress root.",
			} );
			args.positional( 'container', {
				type: 'string',
				describe:
					'The underlying Docker service to run the command on.',
				choices: RUN_CONTAINERS,
				coerce: validateRunContainer,
			} );
			args.positional( 'command', {
				type: 'array',
				describe: 'The command to run.',
			} );
		},
		withSpinner( env.run )
	);
	yargs.example(
		'$0 run cli wp user list',
		'Runs `wp user list` wp-cli command which lists WordPress users.'
	);
	yargs.example(
		'$0 run cli wp shell',
		'Open the interactive WordPress shell for the development instance.'
	);
	yargs.example(
		'$0 run tests-cli bash',
		'Open a bash session in the WordPress tests instance.'
	);

	yargs.command(
		'destroy',
		wpRed(
			'Destroy the WordPress environment. Deletes docker containers, volumes, and networks associated with the WordPress environment and removes local files.'
		),
		( args ) => {
			args.option( 'scripts', {
				type: 'boolean',
				describe: 'Execute any configured lifecycle scripts.',
				default: true,
			} );
		},
		withSpinner( env.destroy )
	);
	yargs.command(
		'install-path',
		'Get the path where all of the environment files are stored. This includes the Docker files, WordPress, PHPUnit files, and any sources that were downloaded.',
		() => {},
		withSpinner( env.installPath )
	);

	return yargs;
};
