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
 * A logging helper for printing steps and their substeps.
 *
 * @param {number} indent Value to indent the log.
 * @param {any}    msg    Message to log.
 * @param {...any} args   Rest of the arguments to pass to console.log.
 */
function logAtIndent( indent, msg, ...args ) {
	const prefix = indent === 0 ? '▶ ' : '> ';
	const newline = indent === 0 ? '\n' : '';
	return log( newline + '    '.repeat( indent ) + prefix + msg, ...args );
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
			PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',
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

	log( formats.title( '\n💃 Performance Tests 🕺' ) );
	log(
		'\nWelcome! This tool runs the performance tests on multiple branches and displays a comparison table.'
	);

	if ( ! runningInCI ) {
		log(
			formats.warning(
				'\nIn order to run the tests, the tool is going to load a WordPress environment on ports 8888 and 8889.' +
					'\nMake sure these ports are not used before continuing.\n'
			)
		);

		await askForConfirmation( 'Ready to go? ' );
	}

	logAtIndent( 0, 'Setting up' );

	/**
	 * @type {string[]} git refs against which to run tests;
	 *                  could be commit SHA, branch name, tag, etc...
	 */
	if ( branches.length < 2 ) {
		throw new Error( `Need at least two git refs to run` );
	}

	const baseDir = path.join( os.tmpdir(), 'wp-performance-tests' );

	if ( fs.existsSync( baseDir ) ) {
		logAtIndent( 1, 'Removing existing files' );
		fs.rmSync( baseDir, { recursive: true } );
	}

	logAtIndent( 1, 'Creating base directory:', formats.success( baseDir ) );
	fs.mkdirSync( baseDir );

	logAtIndent( 1, 'Setting up repository' );
	const sourceDir = path.join( baseDir, 'source' );

	logAtIndent( 2, 'Creating directory:', formats.success( sourceDir ) );
	fs.mkdirSync( sourceDir );

	// @ts-ignore
	const sourceGit = SimpleGit( sourceDir );
	logAtIndent(
		2,
		'Initializing:',
		formats.success( config.gitRepositoryURL )
	);
	await sourceGit
		.raw( 'init' )
		.raw( 'remote', 'add', 'origin', config.gitRepositoryURL );

	for ( const [ i, branch ] of branches.entries() ) {
		logAtIndent(
			2,
			`Fetching environment branch (${ i + 1 } of ${ branches.length }):`,
			formats.success( branch )
		);
		await sourceGit.raw( 'fetch', '--depth=1', 'origin', branch );
	}

	const testRunnerBranch = options.testsBranch || branches[ 0 ];
	if ( options.testsBranch && ! branches.includes( options.testsBranch ) ) {
		logAtIndent(
			2,
			'Fetching test runner branch:',
			formats.success( options.testsBranch )
		);
		// @ts-ignore
		await sourceGit.raw(
			'fetch',
			'--depth=1',
			'origin',
			options.testsBranch
		);
	} else {
		logAtIndent(
			2,
			'Using test runner branch:',
			formats.success( testRunnerBranch )
		);
	}

	logAtIndent( 1, 'Setting up test runner' );

	const testRunnerDir = path.join( baseDir + '/tests' );

	logAtIndent( 2, 'Copying source to:', formats.success( testRunnerDir ) );
	await runShellScript( `cp -R  ${ sourceDir } ${ testRunnerDir }` );

	logAtIndent(
		2,
		'Checking out branch:',
		formats.success( testRunnerBranch )
	);
	// @ts-ignore
	await SimpleGit( testRunnerDir ).raw( 'checkout', testRunnerBranch );

	logAtIndent( 2, 'Installing dependencies and building' );
	await runShellScript(
		`bash -c "source $HOME/.nvm/nvm.sh && nvm install && npm ci && npx playwright install chromium --with-deps && npm run build:packages"`,
		testRunnerDir
	);

	logAtIndent( 1, 'Setting up test environments' );

	const envsDir = path.join( baseDir, 'environments' );
	logAtIndent( 2, 'Creating parent directory:', formats.success( envsDir ) );
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
		logAtIndent( 2, 'Branch:', formats.success( branch ) );
		const sanitizedBranchName = sanitizeBranchName( branch );
		const envDir = path.join( envsDir, sanitizedBranchName );

		logAtIndent( 3, 'Creating directory:', formats.success( envDir ) );
		fs.mkdirSync( envDir );
		// @ts-ignore
		branchDirs[ branch ] = envDir;
		const buildDir = path.join( envDir, 'plugin' );

		logAtIndent( 3, 'Copying source to:', formats.success( buildDir ) );
		await runShellScript( `cp -R ${ sourceDir } ${ buildDir }` );

		logAtIndent( 3, 'Checking out:', formats.success( branch ) );
		// @ts-ignore
		await SimpleGit( buildDir ).raw( 'checkout', branch );

		logAtIndent( 3, 'Installing dependencies and building' );
		await runShellScript(
			`bash -c "source $HOME/.nvm/nvm.sh && nvm install && npm ci && npm run build"`,
			buildDir
		);

		const wpEnvConfigPath = path.join( envDir, '.wp-env.json' );

		logAtIndent(
			3,
			'Saving wp-env config to:',
			formats.success( wpEnvConfigPath )
		);

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

	logAtIndent( 0, 'Looking for test files' );

	const testSuites = getFilesFromDir(
		path.join( testRunnerDir, 'test/performance/specs' )
	).map( ( file ) => {
		logAtIndent( 1, 'Found:', formats.success( file ) );
		return path.basename( file, '.spec.js' );
	} );

	logAtIndent( 0, 'Running tests' );

	if ( wpZipUrl ) {
		logAtIndent(
			1,
			'Using:',
			formats.success( `WordPress v${ options.wpVersion }` )
		);
	} else {
		logAtIndent( 1, 'Using:', formats.success( 'WordPress trunk' ) );
	}

	const wpEnvPath = path.join( testRunnerDir, 'node_modules/.bin/wp-env' );

	for ( const testSuite of testSuites ) {
		for ( let i = 1; i <= TEST_ROUNDS; i++ ) {
			logAtIndent(
				1,
				// prettier-ignore
				`Suite: ${ formats.success( testSuite ) } (round ${ i } of ${ TEST_ROUNDS })`
			);

			for ( const branch of branches ) {
				logAtIndent( 2, 'Branch:', formats.success( branch ) );

				const sanitizedBranchName = sanitizeBranchName( branch );
				const runKey = `${ testSuite }_${ sanitizedBranchName }_round-${ i }`;
				// @ts-ignore
				const envDir = branchDirs[ branch ];

				logAtIndent( 3, 'Starting environment' );
				await runShellScript( `${ wpEnvPath } start`, envDir );

				logAtIndent( 3, 'Running tests' );
				await runTestSuite( testSuite, testRunnerDir, runKey );

				logAtIndent( 3, 'Stopping environment' );
				await runShellScript( `${ wpEnvPath } stop`, envDir );
			}
		}
	}

	logAtIndent( 0, 'Calculating results' );

	const resultFiles = getFilesFromDir( ARTIFACTS_PATH ).filter( ( file ) =>
		file.endsWith( RESULTS_FILE_SUFFIX )
	);
	/** @type {Record<string,Record<string, Record<string, number>>>} */
	const results = {};

	// Calculate medians from all rounds.
	for ( const testSuite of testSuites ) {
		logAtIndent( 1, 'Test suite:', formats.success( testSuite ) );

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
					logAtIndent( 2, 'Reading from:', formats.success( file ) );
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

		logAtIndent(
			2,
			'Saving curated results to:',
			formats.success( calculatedResultsPath )
		);
		fs.writeFileSync(
			calculatedResultsPath,
			JSON.stringify( results[ testSuite ], null, 2 )
		);
	}

	logAtIndent( 0, 'Printing results' );
	log(
		formats.warning(
			'\nPlease note that client side metrics EXCLUDE the server response time.'
		)
	);

	for ( const testSuite of testSuites ) {
		logAtIndent( 0, formats.success( testSuite ) );

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

		if ( branches.length === 2 ) {
			const [ branch1, branch2 ] = branches;
			for ( const metric in invertedResult ) {
				const value1 = parseFloat(
					invertedResult[ metric ][ branch1 ]
				);
				const value2 = parseFloat(
					invertedResult[ metric ][ branch2 ]
				);
				const percentageChange = ( ( value1 - value2 ) / value2 ) * 100;
				invertedResult[ metric ][
					'% Change'
				] = `${ percentageChange.toFixed( 2 ) }%`;
			}
		}

		// Print the results.
		console.table( invertedResult );
	}
}

module.exports = {
	runPerformanceTests,
};
