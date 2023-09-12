/**
 * External dependencies
 */
const os = require( 'os' );
const fs = require( 'fs' );
const path = require( 'path' );
const SimpleGit = require( 'simple-git' );

/**
 * Internal dependencies
 */
const { formats, log } = require( '../lib/logger' );
const {
	runShellScript,
	readJSONFile,
	askForConfirmation,
	getFilesFromDir,
} = require( '../lib/utils' );
const config = require( '../config' );

const ARTIFACTS_PATH =
	process.env.WP_ARTIFACTS_PATH || path.join( process.cwd(), 'artifacts' );
const RESULTS_FILE_SUFFIX = '.performance-results.json';

/**
 * @typedef WPPerformanceCommandOptions
 *
 * @property {boolean=} ci          Run on CI.
 * @property {number=}  rounds      Run each test suite this many times for each branch.
 * @property {string=}  testsBranch The branch whose performance test files will be used for testing.
 * @property {string=}  wpVersion   The WordPress version to be used as the base install for testing.
 */

/**
 * Formats a log string to be accented.
 */
const fAccent = formats.success;

/**
 * A logging helper for printing tasks and their subtasks.
 *
 * @param {number} sub  Value to indent the log.
 * @param {any}    msg  Message to log.
 * @param {...any} args Rest of the arguments to pass to console.log.
 */
function logTask( sub, msg, ...args ) {
	const indent = '    ';
	const prefix = sub === 0 ? '▶\u00A0' : '>\u00A0';
	const newline = sub === 0 ? '\n' : '';
	return log( newline + indent.repeat( sub ) + prefix + msg, ...args );
}

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
 * @param {string} testSuite     Name of the tests set.
 * @param {string} testRunnerDir Path to the performance tests' clone.
 * @param {string} runKey        Unique identifier for the test run.
 */
async function runTestSuite( testSuite, testRunnerDir, runKey ) {
	await runShellScript(
		`npm run test:performance -- ${ testSuite }`,
		testRunnerDir,
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

	log( formats.title( '\n💃 Performance Tests 🕺\n' ) );
	log(
		[
			'Welcome! This tool runs the performance tests on multiple branches and displays a comparison table.',
			'In order to run the tests, the tool is going to load a WordPress environment on ports 8888 and 8889.',
			formats.warning(
				'Make sure these ports are not used before continuing.'
			),
		].join( '\n' )
	);

	if ( ! runningInCI ) {
		log( '' );
		await askForConfirmation( 'Ready to go? ' );
	}

	logTask( 0, 'Setting up' );

	/**
	 * @type {string[]} git refs against which to run tests;
	 *                  could be commit SHA, branch name, tag, etc...
	 */
	if ( branches.length < 2 ) {
		throw new Error( `Need at least two git refs to run` );
	}

	const baseDir = path.join( os.tmpdir(), 'wp-performance-tests' );

	if ( fs.existsSync( baseDir ) ) {
		logTask( 1, 'Removing existing files' );
		fs.rmSync( baseDir, { recursive: true } );
	}
	logTask( 1, 'Creating base directory:', fAccent( baseDir ) );
	fs.mkdirSync( baseDir );

	logTask( 1, 'Setting up repository' );
	const sourceDir = path.join( baseDir, 'source' );

	logTask( 2, 'Creating directory:', fAccent( sourceDir ) );
	fs.mkdirSync( sourceDir );

	// @ts-ignore
	const sourceGit = SimpleGit( sourceDir );
	logTask( 2, 'Initializing:', fAccent( config.gitRepositoryURL ) );
	await sourceGit
		.raw( 'init' )
		.raw( 'remote', 'add', 'origin', config.gitRepositoryURL );

	for ( const [ i, branch ] of branches.entries() ) {
		logTask(
			2,
			`Fetching environment branch (${ i + 1 } of ${ branches.length }):`,
			fAccent( branch )
		);
		await sourceGit.raw( 'fetch', '--depth=1', 'origin', branch );
	}

	const testRunnerBranch = options.testsBranch || branches[ 0 ];
	if ( options.testsBranch && ! branches.includes( options.testsBranch ) ) {
		logTask(
			2,
			'Fetching test runner branch:',
			fAccent( options.testsBranch )
		);
		// @ts-ignore
		await sourceGit.raw(
			'fetch',
			'--depth=1',
			'origin',
			options.testsBranch
		);
	} else {
		logTask( 2, 'Using test runner branch:', fAccent( testRunnerBranch ) );
	}

	logTask( 1, 'Setting up test runner' );

	const testRunnerDir = path.join( baseDir + '/tests' );
	logTask( 2, 'Copying source to:', fAccent( testRunnerDir ) );
	await runShellScript( `cp -R  ${ sourceDir } ${ testRunnerDir }` );
	logTask( 2, 'Checking out branch:', fAccent( testRunnerBranch ) );
	// @ts-ignore
	await SimpleGit( testRunnerDir ).raw( 'checkout', testRunnerBranch );
	logTask( 2, 'Installing dependencies and building' );
	await runShellScript(
		`bash -c "${ [
			'source $HOME/.nvm/nvm.sh',
			'nvm install',
			'npm ci',
			'npx playwright install chromium --with-deps',
			'npm run build:packages',
		].join( ' && ' ) }"`,
		testRunnerDir
	);

	logTask( 1, 'Setting up test environments' );

	const envsDir = path.join( baseDir, 'environments' );
	logTask( 2, 'Creating parent directory:', fAccent( envsDir ) );
	fs.mkdirSync( envsDir );

	let wpZipUrl = null;
	if ( options.wpVersion ) {
		// In order to match the topology of ZIP files at wp.org, remap .0
		// patch versions to major versions:
		//
		//     5.7   -> 5.7   (unchanged)
		//     5.7.0 -> 5.7   (changed)
		//     5.7.2 -> 5.7.2 (unchanged)
		const zipVersion = options.wpVersion.replace( /^(\d+\.\d+).0/, '$1' );
		wpZipUrl = `https://wordpress.org/wordpress-${ zipVersion }.zip`;
	}

	const branchDirs = {};
	for ( const branch of branches ) {
		logTask( 2, fAccent( branch ) );
		const sanitizedBranchName = sanitizeBranchName( branch );
		const envDir = path.join( envsDir, sanitizedBranchName );
		logTask( 3, 'Creating directory:', fAccent( envDir ) );
		fs.mkdirSync( envDir );
		// @ts-ignore
		branchDirs[ branch ] = envDir;
		const buildDir = path.join( envDir, 'plugin' );
		logTask( 3, 'Copying source to:', fAccent( buildDir ) );
		await runShellScript( `cp -R ${ sourceDir } ${ buildDir }` );
		logTask( 3, 'Checking out:', fAccent( branch ) );

		// @ts-ignore
		await SimpleGit( buildDir ).raw( 'checkout', branch );

		logTask( 3, 'Installing dependencies and building' );
		await runShellScript(
			`bash -c "${ [
				'source $HOME/.nvm/nvm.sh',
				'nvm install',
				'npm ci',
				'npm run build',
			].join( ' && ' ) }"`,
			buildDir
		);

		const wpEnvConfigPath = path.join( envDir, '.wp-env.json' );
		logTask( 3, 'Saving wp-env config to:', fAccent( wpEnvConfigPath ) );

		fs.writeFileSync(
			wpEnvConfigPath,
			JSON.stringify(
				{
					config: {
						WP_DEBUG: false,
						SCRIPT_DEBUG: false,
					},
					core: wpZipUrl || 'WordPress/WordPress',
					plugins: [ buildDir ],
					themes: [ path.join( testRunnerDir, 'test/emptytheme' ) ],
					env: {
						tests: {
							mappings: {
								'wp-content/mu-plugins': path.join(
									testRunnerDir,
									'packages/e2e-tests/mu-plugins'
								),
								'wp-content/plugins/gutenberg-test-plugins':
									path.join(
										testRunnerDir,
										'packages/e2e-tests/plugins'
									),
								'wp-content/themes/gutenberg-test-themes':
									path.join(
										testRunnerDir,
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
	}

	logTask( 0, 'Looking for test files' );

	const testSuites = getFilesFromDir(
		path.join( testRunnerDir, 'test/performance/specs' )
	).map( ( file ) => {
		logTask( 1, 'Found:', fAccent( file ) );
		return path.basename( file, '.spec.js' );
	} );

	logTask( 0, 'Running the tests' );

	if ( wpZipUrl ) {
		logTask( 1, 'Using:', fAccent( 'WordPress v%s' ), options.wpVersion );
	} else {
		logTask( 1, 'Using:', fAccent( 'WordPress trunk' ) );
	}

	const wpEnvPath = path.join( testRunnerDir, 'node_modules/.bin/wp-env' );

	for ( const testSuite of testSuites ) {
		for ( let i = 1; i <= TEST_ROUNDS; i++ ) {
			logTask(
				1,
				`Suite: ${ fAccent(
					testSuite
				) } (round ${ i } of ${ TEST_ROUNDS })`
			);
			for ( const branch of branches ) {
				const sanitizedBranchName = sanitizeBranchName( branch );
				const runKey = `${ testSuite }_${ sanitizedBranchName }_round-${ i }`;
				// @ts-ignore
				const envDir = branchDirs[ branch ];
				logTask( 2, 'Branch:', fAccent( branch ) );
				logTask( 3, 'Starting the environment.' );
				await runShellScript( `${ wpEnvPath } start`, envDir );
				logTask( 3, 'Running the test.' );
				await runTestSuite( testSuite, testRunnerDir, runKey );
				logTask( 3, 'Stopping the environment' );
				await runShellScript( `${ wpEnvPath } stop`, envDir );
			}
		}
	}

	logTask( 0, 'Calculating results' );

	const resultFiles = getFilesFromDir( ARTIFACTS_PATH ).filter( ( file ) =>
		file.endsWith( RESULTS_FILE_SUFFIX )
	);
	/** @type {Record<string,Record<string, Record<string, number>>>} */
	const results = {};

	// Calculate medians from all rounds.
	for ( const testSuite of testSuites ) {
		results[ testSuite ] = {};

		for ( const branch of branches ) {
			const sanitizedBranchName = sanitizeBranchName( branch );
			const resultsRounds = resultFiles
				.filter( ( file ) =>
					file.includes(
						`${ testSuite }_${ sanitizedBranchName }_round-`
					)
				)
				.map( ( file ) => {
					logTask( 1, 'Reading:', fAccent( file ) );
					return readJSONFile( file );
				} );

			const metrics = Object.keys( resultsRounds[ 0 ] );
			results[ testSuite ][ branch ] = {};

			logTask( 1, 'Calculating medians from all rounds' );
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
		const calculatedResultsPath = path.join(
			ARTIFACTS_PATH,
			testSuite + RESULTS_FILE_SUFFIX
		);
		logTask( 1, 'Saving:', fAccent( calculatedResultsPath ) );
		fs.writeFileSync(
			calculatedResultsPath,
			JSON.stringify( results[ testSuite ], null, 2 )
		);
	}

	logTask( 0, 'Printing results' );
	log(
		formats.warning(
			'\nPlease note that client side metrics EXCLUDE the server response time.'
		)
	);

	for ( const testSuite of testSuites ) {
		logTask( 0, testSuite );

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
