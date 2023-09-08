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
 * @param {string} testSuite         Name of the tests set.
 * @param {string} testRunnerDirPath Path to the performance tests' clone.
 * @param {string} runKey            Unique identifier for the test run.
 */
async function runTestSuite( testSuite, testRunnerDirPath, runKey ) {
	await runShellScript(
		`npm run test:performance -- ${ testSuite }`,
		testRunnerDirPath,
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

	log(
		formats.title( '\n💃 Performance Tests 🕺\n' ),
		'\nWelcome! This tool runs the performance tests on multiple branches and displays a comparison table.\n' +
			'In order to run the tests, the tool is going to load a WordPress environment on ports 8888 and 8889.\n' +
			'Make sure these ports are not used before continuing.\n'
	);

	if ( ! runningInCI ) {
		await askForConfirmation( 'Ready to go? ' );
	}

	/*
	 * 1- Preparing the tests directory.
	 */

	log( '\n>> Setting up the environment' );

	/**
	 * @type {string[]} git refs against which to run tests;
	 *                  could be commit SHA, branch name, tag, etc...
	 */
	if ( branches.length < 2 ) {
		throw new Error( `Need at least two git refs to run` );
	}

	const baseDirPath = path.join( os.tmpdir(), 'wp-performance-tests' );

	if ( fs.existsSync( baseDirPath ) ) {
		log( `    >> Removing existing setup` );
		fs.rmSync( baseDirPath, { recursive: true } );
	}
	log(
		`    >> Creating base directory: ${ formats.success( baseDirPath ) }`
	);
	fs.mkdirSync( baseDirPath );

	log( `    >> Setting up source` );
	const sourceDirPath = path.join( baseDirPath, 'source' );
	log(
		`        >> Creating directory: ${ formats.success( sourceDirPath ) }`
	);
	fs.mkdirSync( sourceDirPath );

	// @ts-ignore
	const sourceGit = SimpleGit( sourceDirPath );
	log(
		`        >> Initializing repository: ${ formats.success(
			config.gitRepositoryURL
		) }`
	);
	await sourceGit
		.raw( 'init' )
		.raw( 'remote', 'add', 'origin', config.gitRepositoryURL );

	if ( options.testsBranch && ! branches.includes( options.testsBranch ) ) {
		log(
			`        >> Fetching test runner branch: ${ formats.success(
				options.testsBranch
			) }`
		);
		// @ts-ignore
		await sourceGit.raw(
			'fetch',
			'--depth=1',
			'origin',
			options.testsBranch
		);
	}

	for ( const branch of branches ) {
		log(
			`        >> Fetching environment branch: ${ formats.success(
				branch
			) }`
		);
		await sourceGit.raw( 'fetch', '--depth=1', 'origin', branch );
	}

	const testRunnerDirPath = path.join( baseDirPath + '/tests' );
	const testRunnerBranch = options.testsBranch || branches[ 0 ];
	log( '    >> Setting up the test runner' );
	log(
		`        >> Preparing source in ${ formats.success(
			testRunnerDirPath
		) }`
	);
	await runShellScript( `cp -R  ${ sourceDirPath } ${ testRunnerDirPath }` );
	// @ts-ignore
	await SimpleGit( testRunnerDirPath ).raw( 'checkout', testRunnerBranch );
	log( '        >> Installing dependencies and building' );
	await runShellScript(
		`bash -c "${ [
			'source $HOME/.nvm/nvm.sh',
			'nvm install',
			'npm ci',
			'npx playwright install chromium --with-deps',
			'npm run build:packages',
		].join( ' && ' ) }"`,
		testRunnerDirPath
	);

	/*
	 * 2- Preparing the environment directories per branch.
	 */

	const envsDirPath = path.join( baseDirPath, 'environments' );
	log(
		`    >> Creating environments directory: ${ formats.success(
			envsDirPath
		) }`
	);
	fs.mkdirSync( envsDirPath );

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

	const branchDirPaths = {};
	for ( const branch of branches ) {
		log(
			`    >> Setting up environment for ${ formats.success( branch ) }`
		);
		const sanitizedBranchName = sanitizeBranchName( branch );
		const envDirPath = path.join( envsDirPath, sanitizedBranchName );
		log(
			`        >> Creating directory: ${ formats.success( envDirPath ) }`
		);
		fs.mkdirSync( envDirPath );
		// @ts-ignore
		branchDirPaths[ branch ] = envDirPath;
		const buildDirPath = path.join( envDirPath, 'plugin' );
		log(
			`        >> Preparing source in ${ formats.success(
				buildDirPath
			) }`
		);
		await runShellScript( `cp -R ${ sourceDirPath } ${ buildDirPath }` );
		// @ts-ignore
		await SimpleGit( buildDirPath ).raw( 'checkout', branch );

		log( '        >> Installing dependencies and building' );
		await runShellScript(
			`bash -c "${ [
				'source $HOME/.nvm/nvm.sh',
				'nvm install',
				'npm ci',
				'npm run build',
			].join( ' && ' ) }"`,
			buildDirPath
		);

		const wpEnvConfigPath = path.join( envDirPath, '.wp-env.json' );
		log(
			`        >> Saving wp-env config to ${ formats.success(
				wpEnvConfigPath
			) }`
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
					plugins: [ buildDirPath ],
					themes: [
						path.join( testRunnerDirPath, 'test/emptytheme' ),
					],
					env: {
						tests: {
							mappings: {
								'wp-content/mu-plugins': path.join(
									testRunnerDirPath,
									'packages/e2e-tests/mu-plugins'
								),
								'wp-content/plugins/gutenberg-test-plugins':
									path.join(
										testRunnerDirPath,
										'packages/e2e-tests/plugins'
									),
								'wp-content/themes/gutenberg-test-themes':
									path.join(
										testRunnerDirPath,
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

	/*
	 * 3- Running the tests.
	 */

	log( '\n>> Running the tests' );

	if ( wpZipUrl ) {
		log( `    >> Using WordPress v${ options.wpVersion }` );
	} else {
		log( `    >> Using WordPress trunk` );
	}

	const testSuites = getFilesFromDir(
		path.join( testRunnerDirPath, 'test/performance/specs' )
	).map( ( file ) => path.basename( file, '.spec.js' ) );

	const wpEnvPath = path.join(
		testRunnerDirPath,
		'node_modules/.bin/wp-env'
	);

	for ( const testSuite of testSuites ) {
		for ( let i = 1; i <= TEST_ROUNDS; i++ ) {
			const roundInfo =
				TEST_ROUNDS > 1 ? ` (round ${ i } of ${ TEST_ROUNDS })` : '';
			log(
				`    >> Suite: ${ formats.success( testSuite ) }${ roundInfo }`
			);
			for ( const branch of branches ) {
				const sanitizedBranchName = sanitizeBranchName( branch );
				const runKey = `${ testSuite }_${ sanitizedBranchName }_round-${ i }`;
				// @ts-ignore
				const envDirPath = branchDirPaths[ branch ];
				log( `        >> Branch: ${ formats.success( branch ) }` );
				log( '            >> Starting the environment.' );
				await runShellScript( `${ wpEnvPath } start`, envDirPath );
				log( '            >> Running the test.' );
				await runTestSuite( testSuite, testRunnerDirPath, runKey );
				log( '            >> Stopping the environment' );
				await runShellScript( `${ wpEnvPath } stop`, envDirPath );
			}
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
			const sanitizedBranchName = sanitizeBranchName( branch );
			const resultsRounds = resultFiles
				.filter( ( file ) =>
					file.includes(
						`${ testSuite }_${ sanitizedBranchName }_round-`
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

	log( '\n>> 🎉 Results.\n' );
	log(
		'\nPlease note that client side metrics EXCLUDE the server response time.\n'
	);

	for ( const testSuite of testSuites ) {
		log( `\n>> ${ testSuite }\n` );

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
