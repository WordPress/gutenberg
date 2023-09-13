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

const fAccent = formats.success;
const fTitle = formats.title;
const fWarning = formats.warning;

/**
 * A logging helper for printing steps and their substeps.
 *
 * @param {number} sub  Value to indent the log.
 * @param {any}    msg  Message to log.
 * @param {...any} args Rest of the arguments to pass to console.log.
 */
function logStep( sub, msg, ...args ) {
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

	log( fTitle( '\n💃 Performance Tests 🕺' ) );
	log(
		'\nWelcome! This tool runs the performance tests on multiple branches and displays a comparison table.'
	);

	if ( ! runningInCI ) {
		log(
			fWarning(
				[
					'\nIn order to run the tests, the tool is going to load a WordPress environment on ports 8888 and 8889.',
					'Make sure these ports are not used before continuing.\n',
				].join( '\n' )
			)
		);

		await askForConfirmation( 'Ready to go? ' );
	}

	logStep( 0, 'Setting up' );

	/**
	 * @type {string[]} git refs against which to run tests;
	 *                  could be commit SHA, branch name, tag, etc...
	 */
	if ( branches.length < 2 ) {
		throw new Error( `Need at least two git refs to run` );
	}

	const baseDir = path.join( os.tmpdir(), 'wp-performance-tests' );

	if ( fs.existsSync( baseDir ) ) {
		logStep( 1, 'Removing existing files' );
		fs.rmSync( baseDir, { recursive: true } );
	}

	logStep( 1, 'Creating base directory:', fAccent( baseDir ) );
	fs.mkdirSync( baseDir );

	logStep( 1, 'Setting up repository' );
	const sourceDir = path.join( baseDir, 'source' );

	logStep( 2, 'Creating directory:', fAccent( sourceDir ) );
	fs.mkdirSync( sourceDir );

	// @ts-ignore
	const sourceGit = SimpleGit( sourceDir );
	logStep( 2, 'Initializing:', fAccent( config.gitRepositoryURL ) );
	await sourceGit
		.raw( 'init' )
		.raw( 'remote', 'add', 'origin', config.gitRepositoryURL );

	for ( const [ i, branch ] of branches.entries() ) {
		logStep(
			2,
			`Fetching environment branch (${ i + 1 } of ${ branches.length }):`,
			fAccent( branch )
		);
		await sourceGit.raw( 'fetch', '--depth=1', 'origin', branch );
	}

	const testRunnerBranch = options.testsBranch || branches[ 0 ];
	if ( options.testsBranch && ! branches.includes( options.testsBranch ) ) {
		logStep(
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
		logStep( 2, 'Using test runner branch:', fAccent( testRunnerBranch ) );
	}

	logStep( 1, 'Setting up test runner' );

	const testRunnerDir = path.join( baseDir + '/tests' );

	logStep( 2, 'Copying source to:', fAccent( testRunnerDir ) );
	await runShellScript( `cp -R  ${ sourceDir } ${ testRunnerDir }` );

	logStep( 2, 'Checking out branch:', fAccent( testRunnerBranch ) );
	// @ts-ignore
	await SimpleGit( testRunnerDir ).raw( 'checkout', testRunnerBranch );

	logStep( 2, 'Installing dependencies and building' );
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

	logStep( 1, 'Setting up test environments' );

	const envsDir = path.join( baseDir, 'environments' );
	logStep( 2, 'Creating parent directory:', fAccent( envsDir ) );
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
		logStep( 2, 'Branch:', fAccent( branch ) );
		const sanitizedBranchName = sanitizeBranchName( branch );
		const envDir = path.join( envsDir, sanitizedBranchName );

		logStep( 3, 'Creating directory:', fAccent( envDir ) );
		fs.mkdirSync( envDir );
		// @ts-ignore
		branchDirs[ branch ] = envDir;
		const buildDir = path.join( envDir, 'plugin' );

		logStep( 3, 'Copying source to:', fAccent( buildDir ) );
		await runShellScript( `cp -R ${ sourceDir } ${ buildDir }` );

		logStep( 3, 'Checking out:', fAccent( branch ) );
		// @ts-ignore
		await SimpleGit( buildDir ).raw( 'checkout', branch );

		logStep( 3, 'Installing dependencies and building' );
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

		logStep( 3, 'Saving wp-env config to:', fAccent( wpEnvConfigPath ) );

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

	logStep( 0, 'Looking for test files' );

	const testSuites = getFilesFromDir(
		path.join( testRunnerDir, 'test/performance/specs' )
	).map( ( file ) => {
		logStep( 1, 'Found:', fAccent( file ) );
		return path.basename( file, '.spec.js' );
	} );

	logStep( 0, 'Running tests' );

	if ( wpZipUrl ) {
		logStep( 1, 'Using:', fAccent( `WordPress v${ options.wpVersion }` ) );
	} else {
		logStep( 1, 'Using:', fAccent( 'WordPress trunk' ) );
	}

	const wpEnvPath = path.join( testRunnerDir, 'node_modules/.bin/wp-env' );

	for ( const testSuite of testSuites ) {
		for ( let i = 1; i <= TEST_ROUNDS; i++ ) {
			logStep(
				1,
				`Suite: ${ fAccent(
					testSuite
				) } (round ${ i } of ${ TEST_ROUNDS })`
			);
			for ( const branch of branches ) {
				logStep( 2, 'Branch:', fAccent( branch ) );

				const sanitizedBranchName = sanitizeBranchName( branch );
				const runKey = `${ testSuite }_${ sanitizedBranchName }_round-${ i }`;
				// @ts-ignore
				const envDir = branchDirs[ branch ];

				logStep( 3, 'Starting environment' );
				await runShellScript( `${ wpEnvPath } start`, envDir );

				logStep( 3, 'Running tests' );
				await runTestSuite( testSuite, testRunnerDir, runKey );

				logStep( 3, 'Stopping environment' );
				await runShellScript( `${ wpEnvPath } stop`, envDir );
			}
		}
	}

	logStep( 0, 'Calculating results' );

	const resultFiles = getFilesFromDir( ARTIFACTS_PATH ).filter( ( file ) =>
		file.endsWith( RESULTS_FILE_SUFFIX )
	);
	/** @type {Record<string,Record<string, Record<string, number>>>} */
	const results = {};

	// Calculate medians from all rounds.
	for ( const testSuite of testSuites ) {
		logStep( 1, 'Test suite:', fAccent( testSuite ) );

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
					logStep( 2, 'Reading from:', fAccent( file ) );
					return readJSONFile( file );
				} );

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
		const calculatedResultsPath = path.join(
			ARTIFACTS_PATH,
			testSuite + RESULTS_FILE_SUFFIX
		);

		logStep(
			2,
			'Saving curated results to:',
			fAccent( calculatedResultsPath )
		);
		fs.writeFileSync(
			calculatedResultsPath,
			JSON.stringify( results[ testSuite ], null, 2 )
		);
	}

	logStep( 0, 'Printing results' );
	log(
		fWarning(
			'\nPlease note that client side metrics EXCLUDE the server response time.'
		)
	);

	for ( const testSuite of testSuites ) {
		logStep( 0, fAccent( testSuite ) );

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
