/**
 * External dependencies
 */
const { spawn } = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );
const SimpleGit = require( 'simple-git' );

/**
 * Internal dependencies
 */
const { formats } = require( '../lib/logger' );
const {
	readJSONFile,
	askForConfirmation,
	getRandomTemporaryPath,
	getFilesFromDir,
} = require( '../lib/utils' );
const config = require( '../config' );

const ARTIFACTS_PATH =
	process.env.WP_ARTIFACTS_PATH || path.join( process.cwd(), 'artifacts' );
const RESULTS_FILE_SUFFIX = '.performance-results.json';

class Logger {
	constructor() {
		// @ts-ignore
		this.crumbs = [];
		this.level = 0;
	}

	enterSub() {
		this.level += 1;
	}

	exitSub() {
		if ( this.level > 0 ) {
			this.level -= 1;
		}
	}

	reset() {
		this.level = 0;
	}

	newline() {
		console.log( '\n' );
	}
	// @ts-ignore
	print( text ) {
		this.crumbs = this.crumbs.slice( 0, this.level );
		this.crumbs.push( text );
		const timestamp = new Date().toISOString();

		console.log( `[${ timestamp }] ${ this.crumbs.join( ' > ' ) }` );
	}
}
const logger = new Logger();

// @ts-ignore
function runShellScript( script, cwd, env = {} ) {
	logger.enterSub();
	logger.print( `Executing: ${ script }` );
	logger.exitSub();

	return new Promise( ( resolve, reject ) => {
		const child = spawn( script, [], {
			cwd,
			env: {
				NO_CHECKS: 'true',
				PATH: process.env.PATH,
				HOME: process.env.HOME,
				USER: process.env.USER,
				...env,
			},
			shell: true,
			stdio: 'inherit', // This makes the child process inherit the parent's stdio
		} );

		child.on( 'close', ( code ) => {
			if ( code !== 0 ) {
				reject( new Error( `Process exited with code ${ code }` ) );
			} else {
				resolve( null );
			}
		} );

		child.on( 'error', ( error ) => {
			console.error(
				`Failed to start child process: ${ error.message }`
			);
			reject( error );
		} );
	} );
}

/**
 * @typedef WPPerformanceCommandOptions
 *
 * @property {boolean=} ci          Run on CI.
 * @property {number=}  rounds      Run each test suite this many times for each branch.
 * @property {string=}  testsBranch The branch whose performance test files will be used for testing.
 * @property {string=}  wpVersion   The WordPress version to be used as the base install for testing.
 */

/**
 * Sanitizes branch name to be used in a path or a filename.
 *
 * @param {string} branch
 *
 * @return {string} Sanitized branch name.
 */
function sanitizeBranchName( branch ) {
	return branch.replace( /[^a-zA-Z0-9-]/g, '-' );
}

/**
 * Computes the median number from an array numbers.
 *
 * @param {number[]} array
 *
 * @return {number|undefined} Median value or undefined if array empty.
 */
function median( array ) {
	if ( ! array || ! array.length ) return undefined;

	const numbers = [ ...array ].sort( ( a, b ) => a - b );
	const middleIndex = Math.floor( numbers.length / 2 );

	if ( numbers.length % 2 === 0 ) {
		return ( numbers[ middleIndex - 1 ] + numbers[ middleIndex ] ) / 2;
	}
	return numbers[ middleIndex ];
}

/**
 * Runs the performance tests on the current branch.
 *
 * @param {string} testSuite                Name of the tests set.
 * @param {string} performanceTestDirectory Path to the performance tests' clone.
 * @param {string} runKey                   Unique identifier for the test run.
 */
async function runTestSuite( testSuite, performanceTestDirectory, runKey ) {
	await runShellScript(
		`npm run test:performance -- ${ testSuite }`,
		performanceTestDirectory,
		{
			...process.env,
			WP_ARTIFACTS_PATH: ARTIFACTS_PATH,
			RESULTS_ID: runKey,
		}
	);
}

/**
 * Runs the performances tests on an array of branches and output the result.
 *
 * @param {string[]}                    branches Branches to compare
 * @param {WPPerformanceCommandOptions} options  Command options.
 */
async function runPerformanceTests( branches, options ) {
	const runningInCI = !! process.env.CI || !! options.ci;
	const TEST_ROUNDS = options.rounds || 1;

	// The default value doesn't work because commander provides an array.
	if ( branches.length === 0 ) {
		branches = [ 'trunk' ];
	}

	console.log( formats.title( '\n💃 Performance Tests 🕺\n\n' ) );

	if ( ! runningInCI ) {
		await askForConfirmation( 'Ready to go? ' );
	}

	/*
	 * 1- Preparing the tests directory.
	 */

	logger.print( 'Preparing the tests directories' );
	logger.enterSub();
	logger.print( 'Cloning the repository' );

	/**
	 * @type {string[]} git refs against which to run tests;
	 *                  could be commit SHA, branch name, tag, etc...
	 */
	if ( branches.length < 2 ) {
		throw new Error( `Need at least two git refs to run` );
	}

	const baseDirectory = getRandomTemporaryPath();
	fs.mkdirSync( baseDirectory, { recursive: true } );

	// @ts-ignore
	const git = SimpleGit( baseDirectory );
	await git
		.raw( 'init' )
		.raw( 'remote', 'add', 'origin', config.gitRepositoryURL );

	for ( const branch of branches ) {
		await git.raw( 'fetch', '--depth=1', 'origin', branch );
	}

	await git.raw( 'checkout', branches[ 0 ] );

	const rootDirectory = getRandomTemporaryPath();
	const performanceTestDirectory = rootDirectory + '/tests';
	await runShellScript( 'mkdir -p ' + rootDirectory );
	await runShellScript(
		'cp -R ' + baseDirectory + ' ' + performanceTestDirectory
	);

	if ( !! options.testsBranch ) {
		const branchName = formats.success( options.testsBranch );
		logger.print( `Fetching the test-runner branch: ${ branchName }` );

		// @ts-ignore
		await SimpleGit( performanceTestDirectory )
			.raw( 'fetch', '--depth=1', 'origin', options.testsBranch )
			.raw( 'checkout', options.testsBranch );
	}

	logger.print( 'Installing dependencies and building packages' );
	await runShellScript(
		`bash -c "${ [
			'source $HOME/.nvm/nvm.sh',
			'nvm install',
			'npm ci',
			'npx playwright install chromium --with-deps',
			'npm run build:packages',
		].join( ' && ' ) }"`,
		performanceTestDirectory
	);
	logger.print( 'Creating the environment folders' );
	await runShellScript( 'mkdir -p ' + rootDirectory + '/envs' );

	/*
	 * 2- Preparing the environment directories per branch.
	 */

	logger.reset();
	logger.newline();
	logger.print( 'Preparing an environment directory per branch' );
	logger.enterSub();
	const branchDirectories = {};
	for ( const branch of branches ) {
		logger.print( branch );
		logger.enterSub();
		const sanitizedBranch = sanitizeBranchName( branch );
		const environmentDirectory = rootDirectory + '/envs/' + sanitizedBranch;
		// @ts-ignore
		branchDirectories[ branch ] = environmentDirectory;
		const buildPath = `${ environmentDirectory }/plugin`;
		await runShellScript( 'mkdir ' + environmentDirectory );
		await runShellScript( `cp -R ${ baseDirectory } ${ buildPath }` );

		const fancyBranch = formats.success( branch );

		if ( branch === options.testsBranch ) {
			logger.print( `Re-using the testing branch for ${ fancyBranch }` );
			await runShellScript(
				`cp -R ${ performanceTestDirectory } ${ buildPath }`
			);
		} else {
			logger.print( `Fetching` );
			// @ts-ignore
			await SimpleGit( buildPath ).reset( 'hard' ).checkout( branch );
		}

		logger.print( `Building` );
		await runShellScript(
			'bash -c "source $HOME/.nvm/nvm.sh && nvm install && npm ci && npm run prebuild:packages && node ./bin/packages/build.js && npx wp-scripts build"',
			buildPath
		);

		// Create the config file for the current env.
		fs.writeFileSync(
			path.join( environmentDirectory, '.wp-env.json' ),
			JSON.stringify(
				{
					config: {
						WP_DEBUG: false,
						SCRIPT_DEBUG: false,
					},
					core: 'WordPress/WordPress',
					plugins: [ path.join( environmentDirectory, 'plugin' ) ],
					themes: [
						path.join(
							performanceTestDirectory,
							'test/emptytheme'
						),
					],
					env: {
						tests: {
							mappings: {
								'wp-content/mu-plugins': path.join(
									performanceTestDirectory,
									'packages/e2e-tests/mu-plugins'
								),
								'wp-content/plugins/gutenberg-test-plugins':
									path.join(
										performanceTestDirectory,
										'packages/e2e-tests/plugins'
									),
								'wp-content/themes/gutenberg-test-themes':
									path.join(
										performanceTestDirectory,
										'test/gutenberg-test-themes'
									),
								'wp-content/themes/gutenberg-test-themes/twentytwentyone':
									'https://downloads.wordpress.org/theme/twentytwentyone.1.7.zip',
								'wp-content/themes/gutenberg-test-themes/twentytwentythree':
									'https://downloads.wordpress.org/theme/twentytwentythree.1.0.zip',
							},
						},
					},
				},
				null,
				2
			),
			'utf8'
		);

		if ( options.wpVersion ) {
			// In order to match the topology of ZIP files at wp.org, remap .0
			// patch versions to major versions:
			//
			//     5.7   -> 5.7   (unchanged)
			//     5.7.0 -> 5.7   (changed)
			//     5.7.2 -> 5.7.2 (unchanged)
			const zipVersion = options.wpVersion.replace(
				/^(\d+\.\d+).0/,
				'$1'
			);
			const zipUrl = `https://wordpress.org/wordpress-${ zipVersion }.zip`;
			logger.print( `Using WordPress version ${ zipVersion }` );

			// Patch the environment's .wp-env.json config to use the specified WP
			// version:
			//
			//     {
			//         "core": "https://wordpress.org/wordpress-$VERSION.zip",
			//         ...
			//     }
			const confPath = `${ environmentDirectory }/.wp-env.json`;
			const conf = { ...readJSONFile( confPath ), core: zipUrl };
			await fs.writeFileSync(
				confPath,
				JSON.stringify( conf, null, 2 ),
				'utf8'
			);
		}
	}

	// Printing the used folders.
	logger.reset();
	logger.newline();
	logger.print(
		`Perf Tests Directory : ${ formats.success(
			performanceTestDirectory
		) }`
	);
	for ( const branch of branches ) {
		// @ts-ignore
		const envPath = formats.success( branchDirectories[ branch ] );
		logger.print( `Environment Directory (${ branch }) : ${ envPath }` );
	}

	/*
	 * 3- Running the tests.
	 */

	logger.reset();
	logger.newline();
	logger.print( 'Running the tests' );
	logger.enterSub();

	const testSuites = getFilesFromDir(
		path.join( performanceTestDirectory, 'test/performance/specs' )
	).map( ( file ) => path.basename( file, '.spec.js' ) );

	const wpEnvPath = path.join(
		performanceTestDirectory,
		'node_modules/.bin/wp-env'
	);

	for ( const testSuite of testSuites ) {
		for ( let i = 1; i <= TEST_ROUNDS; i++ ) {
			const roundInfo =
				TEST_ROUNDS > 1 ? ` (round ${ i } of ${ TEST_ROUNDS })` : '';
			logger.print( testSuite + roundInfo );
			logger.enterSub();
			for ( const branch of branches ) {
				const sanitizedBranch = sanitizeBranchName( branch );
				const runKey = `${ testSuite }_${ sanitizedBranch }_round-${ i }`;
				// @ts-ignore
				const environmentDirectory = branchDirectories[ branch ];
				logger.print( branch );
				logger.enterSub();
				logger.print( 'Starting the environment' );
				await runShellScript(
					`${ wpEnvPath } start`,
					environmentDirectory
				);
				logger.print( 'Running the test' );
				await runTestSuite(
					testSuite,
					performanceTestDirectory,
					runKey
				);
				logger.print( 'Stopping the environment' );
				await runShellScript(
					`${ wpEnvPath } stop`,
					environmentDirectory
				);
				logger.exitSub();
			}
			logger.exitSub();
		}
	}

	/*
	 * 4- Formatting and saving the results.
	 */

	// Load curated results from each round.
	const resultFiles = getFilesFromDir( ARTIFACTS_PATH ).filter( ( file ) =>
		file.endsWith( RESULTS_FILE_SUFFIX )
	);
	/** @type {Record<string,Record<string, Record<string, number>>>} */
	const results = {};

	// Calculate medians from all rounds.
	for ( const testSuite of testSuites ) {
		results[ testSuite ] = {};

		for ( const branch of branches ) {
			const sanitizedBranch = sanitizeBranchName( branch );
			const resultsRounds = resultFiles
				.filter( ( file ) =>
					file.includes(
						`${ testSuite }_${ sanitizedBranch }_round-`
					)
				)
				.map( ( file ) => readJSONFile( file ) );

			const metrics = Object.keys( resultsRounds[ 0 ] );
			results[ testSuite ][ branch ] = {};

			for ( const metric of metrics ) {
				const values = resultsRounds
					.map( ( round ) => round[ metric ] )
					.filter( ( value ) => typeof value === 'number' );

				const value = median( values );
				if ( value !== undefined ) {
					results[ testSuite ][ branch ][ metric ] = value;
				}
			}
		}

		// Save calculated results to file.
		fs.writeFileSync(
			path.join( ARTIFACTS_PATH, testSuite + RESULTS_FILE_SUFFIX ),
			JSON.stringify( results[ testSuite ], null, 2 )
		);
	}

	/*
	 * 5- Displaying the results.
	 */

	logger.reset();
	logger.newline();
	logger.print( '🎉 Results' );
	logger.newline();
	logger.print(
		'Please note that client side metrics EXCLUDE the server response time.'
	);

	for ( const testSuite of testSuites ) {
		logger.newline();
		logger.print( testSuite );

		// Invert the results so we can display them in a table.
		/** @type {Record<string, Record<string, string>>} */
		const invertedResult = {};
		for ( const [ branch, metrics ] of Object.entries(
			results[ testSuite ]
		) ) {
			for ( const [ metric, value ] of Object.entries( metrics ) ) {
				invertedResult[ metric ] = invertedResult[ metric ] || {};
				invertedResult[ metric ][ branch ] = `${ value } ms`;
			}
		}

		// Print the results.
		console.table( invertedResult );
	}
}

module.exports = {
	runPerformanceTests,
};
