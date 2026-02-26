'use strict';
/**
 * External dependencies
 */
const chalk = require( 'chalk' );
const ora = require( 'ora' );
const yargs = require( 'yargs' );

/**
 * Internal dependencies
 */
const pkg = require( '../package.json' );
const env = require( './env' );
const parseXdebugMode = require( './parse-xdebug-mode' );
const parseSpxMode = require( './parse-spx-mode' );
const {
	getAvailableRuntimes,
	getRuntime,
	UnsupportedCommandError,
	EnvironmentNotInitializedError,
} = require( './runtime' );

// Spinner.
const withSpinner =
	( command ) =>
	( ...args ) => {
		const isJSON = args[ 0 ].json;
		const spinner = ora();
		if ( ! isJSON ) {
			spinner.start();
		}
		args[ 0 ].spinner = spinner;
		let time = process.hrtime();
		return command( ...args ).then(
			( message ) => {
				time = process.hrtime( time );
				if ( ! isJSON ) {
					spinner.succeed(
						`${ message || spinner.text } (in ${ time[ 0 ] }s ${ (
							time[ 1 ] / 1e6
						).toFixed( 0 ) }ms)`
					);
				}
				process.exit( 0 );
			},
			( error ) => {
				if (
					error instanceof UnsupportedCommandError ||
					error instanceof EnvironmentNotInitializedError
				) {
					// Error is a known user-facing error.
					spinner.fail( error.message );
					process.exit( 1 );
				} else if (
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
	yargs.usage( '$0 <command>' );
	yargs.usage( '$0 <command> -- --help' );
	yargs.option( 'debug', {
		type: 'boolean',
		describe: 'Enable debug output.',
		default: false,
	} );
	yargs.option( 'config', {
		type: 'string',
		describe: 'Path to a custom .wp-env.json configuration file.',
		requiresArg: true,
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
		chalk`Starts WordPress, listening locally. The current working directory must be a WordPress installation, a plugin, a theme, or contain a {bold .wp-env.json} file. The config's port can be overridden via {bold WP_ENV_PORT}.`,
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
			args.option( 'spx', {
				describe:
					'Enables SPX profiling. If not passed, SPX is turned off. If no mode is set, uses "enabled". SPX is a simple profiling extension with a built-in web UI. See https://github.com/NoiseByNorthwest/php-spx for more information.',
				coerce: parseSpxMode,
				type: 'string',
			} );
			args.option( 'scripts', {
				type: 'boolean',
				describe: 'Execute any configured lifecycle scripts.',
				default: true,
			} );
			args.option( 'runtime', {
				type: 'string',
				describe:
					'The runtime environment to use. "docker" uses Docker containers, "playground" uses WordPress Playground (experimental).',
				choices: getAvailableRuntimes(),
				default: 'docker',
			} );
		},
		withSpinner( env.start )
	);
	yargs.command(
		'stop',
		'Stops running WordPress and frees the ports.',
		() => {},
		withSpinner( env.stop )
	);
	yargs.command(
		'reset [environment]',
		chalk`{bold.red Resets} the WordPress databases.`,
		( args ) => {
			args.positional( 'environment', {
				type: 'string',
				describe: "Which environments' databases to reset.",
				choices: [ 'all', 'development', 'tests' ],
				default: 'development',
			} );
			args.option( 'scripts', {
				type: 'boolean',
				describe: 'Execute any configured lifecycle scripts.',
				default: true,
			} );
		},
		withSpinner( env.reset )
	);
	yargs.command(
		'clean [environment]',
		false,
		( args ) => {
			args.positional( 'environment', {
				type: 'string',
				describe: "Which environments' databases to reset.",
				choices: [ 'all', 'development', 'tests' ],
				default: 'development',
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
	// Get run containers from Docker runtime (run command is Docker-only for now)
	const dockerRuntime = getRuntime( 'docker' );
	const runContainers = dockerRuntime.getRunContainers();

	yargs.command(
		'run <container> [command...]',
		chalk`Runs an arbitrary command in one of the underlying Docker containers. Use a double dash to pass arguments to it. You can use {bold bash} to open a shell session. {bold composer} and {bold phpunit} are available in all WordPress and CLI containers. {bold wp} is also available in the CLI containers.`,
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
				choices: runContainers,
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
		chalk`{bold.red Destroys} the WordPress environment. Deletes docker containers, volumes, networks, and images associated with the WordPress environment and removes local files.`,
		( args ) => {
			args.option( 'scripts', {
				type: 'boolean',
				describe: 'Execute any configured lifecycle scripts.',
				default: true,
			} );
			args.option( 'force', {
				type: 'boolean',
				describe: 'Skip the confirmation prompt.',
				default: false,
			} );
		},
		withSpinner( env.destroy )
	);
	yargs.command(
		'cleanup',
		chalk`{bold.red Cleans up} the WordPress environment. Removes docker containers, volumes, networks, and local files, but preserves docker images for faster re-starts.`,
		( args ) => {
			args.option( 'scripts', {
				type: 'boolean',
				describe: 'Execute any configured lifecycle scripts.',
				default: true,
			} );
			args.option( 'force', {
				type: 'boolean',
				describe: 'Skip the confirmation prompt.',
				default: false,
			} );
		},
		withSpinner( env.cleanup )
	);
	yargs.command(
		'status',
		'Get the status of the wp-env environment including URLs, ports, and configuration.',
		( args ) => {
			args.option( 'json', {
				type: 'boolean',
				describe: 'Output status as JSON.',
				default: false,
			} );
		},
		withSpinner( env.status )
	);
	// Wrap at 100 chars unless the terminal is narrower than that, but ensure
	// formatting is applied even when stdout is not a terminal.
	yargs.wrap( Math.min( 100, yargs.terminalWidth() ?? 100 ) );

	return yargs;
};
