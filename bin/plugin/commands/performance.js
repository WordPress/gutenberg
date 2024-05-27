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
const RAW_RESULTS_FILE_SUFFIX = '.performance-results.raw.json';
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
 * @param {number} number
 */
function fixed( number ) {
	return Math.round( number * 100 ) / 100;
}

/**
 * @param {number[]} array
 */
function quartiles( array ) {
	const numbers = array.slice().sort( ( a, b ) => a - b );

	/**
	 * @param {number} offset
	 * @param {number} length
	 */
	function med( offset, length ) {
		if ( length % 2 === 0 ) {
			// even length, average of two middle numbers
			return (
				( numbers[ offset + length / 2 - 1 ] +
					numbers[ offset + length / 2 ] ) /
				2
			);
		}

		// odd length, exact middle point
		return numbers[ offset + ( length - 1 ) / 2 ];
	}

	const q50 = med( 0, numbers.length );

	let q25, q75;
	if ( numbers.length % 2 === 0 ) {
		// medians of two exact halves
		const mid = numbers.length / 2;
		q25 = med( 0, mid );
		q75 = med( mid, mid );
	} else {
		// quartiles are average of medians of the smaller and bigger slice
		const midl = ( numbers.length - 1 ) / 2;
		const midh = ( numbers.length + 1 ) / 2;
		q25 = ( med( 0, midl ) + med( 0, midh ) ) / 2;
		q75 = ( med( midl, midh ) + med( midh, midl ) ) / 2;
	}
	return { q25, q50, q75 };
}

/**
 * @param {number[]|undefined} values
 */
function stats( values ) {
	if ( ! values || values.length === 0 ) {
		return undefined;
	}
	const { q25, q50, q75 } = quartiles( values );
	const cnt = values.length;
	return {
		q25: fixed( q25 ),
		q50: fixed( q50 ),
		q75: fixed( q75 ),
		cnt,
	};
}

/**
 * Nicely formats a given value.
 *
 * @param {string} metric Metric.
 * @param {number} value
 */
function formatValue( metric, value ) {
	if ( 'wpMemoryUsage' === metric ) {
		return `${ ( value / Math.pow( 10, 6 ) ).toFixed( 2 ) } MB`;
	}

	if ( 'wpDbQueries' === metric ) {
		return value.toString();
	}

	return `${ value } ms`;
}

/**
 * @param {string}                 m
 * @param {Record<string, number>} s
 */
function printStats( m, s ) {
	const pp = fixed( ( 100 * ( s.q75 - s.q50 ) ) / s.q50 );
	const mp = fixed( ( 100 * ( s.q50 - s.q25 ) ) / s.q50 );
	return `${ formatValue( m, s.q50 ) } +${ pp }% -${ mp }%`;
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
 * Formats an array of objects as a Markdown table.
 *
 * For example, this array:
 *
 * [
 * 	{
 * 	    foo: 123,
 * 	    bar: 456,
 * 	    baz: 'Yes',
 * 	},
 * 	{
 * 	    foo: 777,
 * 	    bar: 999,
 * 	    baz: 'No',
 * 	}
 * ]
 *
 * Will result in the following table:
 *
 * | foo | bar | baz |
 * |-----|-----|-----|
 * | 123 | 456 | Yes |
 * | 777 | 999 | No  |
 *
 * @param {Array<Object>} rows Table rows.
 * @return {string} Markdown table content.
 */
function formatAsMarkdownTable( rows ) {
	let result = '';

	if ( ! rows.length ) {
		return result;
	}

	const headers = Object.keys( rows[ 0 ] );
	for ( const header of headers ) {
		result += `| ${ header } `;
	}
	result += '|\n';
	for ( let i = 0; i < headers.length; i++ ) {
		result += '| ------ ';
	}
	result += '|\n';

	for ( const row of rows ) {
		for ( const value of Object.values( row ) ) {
			result += `| ${ value } `;
		}
		result += '|\n';
	}

	return result;
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
		file.endsWith( RAW_RESULTS_FILE_SUFFIX )
	);
	/** @type {Record<string,Record<string, Record<string, Record<string, number>>>>} */
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

			const metrics = Object.keys( resultsRounds[ 0 ] ?? {} );
			results[ testSuite ][ branch ] = {};

			for ( const metric of metrics ) {
				const values = resultsRounds.flatMap(
					( round ) => round[ metric ] ?? []
				);

				const value = stats( values );
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

	let summaryMarkdown = `## Performance Test Results\n\n`;

	summaryMarkdown += `Please note that client side metrics **exclude** the server response time.\n\n`;

	for ( const testSuite of testSuites ) {
		logAtIndent( 0, formats.success( testSuite ) );

		// Invert the results so we can display them in a table.
		/** @type {Record<string, Record<string, Record<string, number>>>} */
		const invertedResult = {};
		for ( const [ branch, metrics ] of Object.entries(
			results[ testSuite ]
		) ) {
			for ( const [ metric, value ] of Object.entries( metrics ) ) {
				invertedResult[ metric ] = invertedResult[ metric ] || {};
				invertedResult[ metric ][ branch ] = value;
			}
		}

		/** @type {Record<string, Record<string, string>>} */
		const printedResult = {};
		for ( const [ metric, branch ] of Object.entries( invertedResult ) ) {
			printedResult[ metric ] = {};
			for ( const [ branchName, data ] of Object.entries( branch ) ) {
				printedResult[ metric ][ branchName ] = printStats(
					metric,
					data
				);
			}

			if ( branches.length === 2 ) {
				const [ branch1, branch2 ] = branches;
				const value1 = branch[ branch1 ].q50;
				const value2 = branch[ branch2 ].q50;
				const percentageChange = fixed(
					( ( value1 - value2 ) / value2 ) * 100
				);
				printedResult[ metric ][
					'% Change'
				] = `${ percentageChange }%`;
			}
		}

		// Print the results.
		console.table( printedResult );

		// Use yet another structure to generate a Markdown table.

		const rows = [];

		for ( const [ metric, resultBranches ] of Object.entries(
			printedResult
		) ) {
			/**
			 * @type {Record< string, string >}
			 */
			const row = {
				Metric: metric,
			};

			for ( const [ branch, value ] of Object.entries(
				resultBranches
			) ) {
				row[ branch ] = value;
			}
			rows.push( row );
		}

		summaryMarkdown += `**${ testSuite }**\n\n`;
		summaryMarkdown += `${ formatAsMarkdownTable( rows ) }\n`;
	}

	fs.writeFileSync(
		path.join( ARTIFACTS_PATH, 'summary.md' ),
		summaryMarkdown
	);
}

module.exports = {
	runPerformanceTests,
};
