/**
 * External dependencies
 */
const fs = require( 'fs' );
const os = require( 'os' );
const path = require( 'path' );
const { mapValues } = require( 'lodash' );
const simpleGit = require( 'simple-git' );

/**
 * Internal dependencies
 */
const { formats, log } = require( '../lib/logger' );
const {
	runShellScript,
	readJSONFile,
	askForConfirmation,
	getRandomTemporaryPath,
} = require( '../lib/utils' );
const config = require( '../config' );
const { env } = require( 'process' );

const ARTIFACTS_PATH =
	process.env.WP_ARTIFACTS_PATH || path.join( process.cwd(), 'artifacts' );

/**
 * @typedef WPPerformanceCommandOptions
 *
 * @property {boolean=} ci          Run on CI.
 * @property {number=}  rounds      Run each test suite this many times for each branch.
 * @property {string=}  testsBranch The branch whose performance test files will be used for testing.
 * @property {string=}  wpVersion   The WordPress version to be used as the base install for testing.
 */

/**
 * @typedef WPRawPerformanceResults
 *
 * @property {number[]} timeToFirstByte        Represents the time since the browser started the request until it received a response.
 * @property {number[]} largestContentfulPaint Represents the time when the main content of the page has likely loaded.
 * @property {number[]} lcpMinusTtfb           Represents the difference between LCP and TTFB.
 * @property {number[]} serverResponse         Represents the time the server takes to respond.
 * @property {number[]} firstPaint             Represents the time when the user agent first rendered after navigation.
 * @property {number[]} domContentLoaded       Represents the time immediately after the document's DOMContentLoaded event completes.
 * @property {number[]} loaded                 Represents the time when the load event of the current document is completed.
 * @property {number[]} firstContentfulPaint   Represents the time when the browser first renders any text or media.
 * @property {number[]} firstBlock             Represents the time when Puppeteer first sees a block selector in the DOM.
 * @property {number[]} type                   Average type time.
 * @property {number[]} typeContainer          Average type time within a container.
 * @property {number[]} focus                  Average block selection time.
 * @property {number[]} inserterOpen           Average time to open global inserter.
 * @property {number[]} inserterSearch         Average time to search the inserter.
 * @property {number[]} inserterHover          Average time to move mouse between two block item in the inserter.
 * @property {number[]} listViewOpen           Average time to open listView
 */

/**
 * @typedef WPPerformanceResults
 *
 * @property {number=} timeToFirstByte        Represents the time since the browser started the request until it received a response.
 * @property {number=} largestContentfulPaint Represents the time when the main content of the page has likely loaded.
 * @property {number=} lcpMinusTtfb           Represents the difference between LCP and TTFB.
 * @property {number=} serverResponse         Represents the time the server takes to respond.
 * @property {number=} firstPaint             Represents the time when the user agent first rendered after navigation.
 * @property {number=} domContentLoaded       Represents the time immediately after the document's DOMContentLoaded event completes.
 * @property {number=} loaded                 Represents the time when the load event of the current document is completed.
 * @property {number=} firstContentfulPaint   Represents the time when the browser first renders any text or media.
 * @property {number=} firstBlock             Represents the time when Puppeteer first sees a block selector in the DOM.
 * @property {number=} type                   Average type time.
 * @property {number=} minType                Minimum type time.
 * @property {number=} maxType                Maximum type time.
 * @property {number=} typeContainer          Average type time within a container.
 * @property {number=} minTypeContainer       Minimum type time within a container.
 * @property {number=} maxTypeContainer       Maximum type time within a container.
 * @property {number=} focus                  Average block selection time.
 * @property {number=} minFocus               Min block selection time.
 * @property {number=} maxFocus               Max block selection time.
 * @property {number=} inserterOpen           Average time to open global inserter.
 * @property {number=} minInserterOpen        Min time to open global inserter.
 * @property {number=} maxInserterOpen        Max time to open global inserter.
 * @property {number=} inserterSearch         Average time to open global inserter.
 * @property {number=} minInserterSearch      Min time to open global inserter.
 * @property {number=} maxInserterSearch      Max time to open global inserter.
 * @property {number=} inserterHover          Average time to move mouse between two block item in the inserter.
 * @property {number=} minInserterHover       Min time to move mouse between two block item in the inserter.
 * @property {number=} maxInserterHover       Max time to move mouse between two block item in the inserter.
 * @property {number=} listViewOpen           Average time to open list view.
 * @property {number=} minListViewOpen        Min time to open list view.
 * @property {number=} maxListViewOpen        Max time to open list view.
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
 * Computes the average number from an array numbers.
 *
 * @param {number[]} array
 *
 * @return {number} Average.
 */
function average( array ) {
	return array.reduce( ( a, b ) => a + b, 0 ) / array.length;
}

/**
 * Computes the median number from an array numbers.
 *
 * @param {number[]} array
 *
 * @return {number} Median.
 */
function median( array ) {
	const mid = Math.floor( array.length / 2 ),
		numbers = [ ...array ].sort( ( a, b ) => a - b );
	return array.length % 2 !== 0
		? numbers[ mid ]
		: ( numbers[ mid - 1 ] + numbers[ mid ] ) / 2;
}

/**
 * Rounds and format a time passed in milliseconds.
 *
 * @param {number} number
 *
 * @return {number} Formatted time.
 */
function formatTime( number ) {
	const factor = Math.pow( 10, 2 );
	return Math.round( number * factor ) / factor;
}

/**
 * Curate the raw performance results.
 *
 * @param {string}                  testSuite
 * @param {WPRawPerformanceResults} results
 *
 * @return {WPPerformanceResults} Curated Performance results.
 */
function curateResults( testSuite, results ) {
	if (
		testSuite === 'front-end-classic-theme' ||
		testSuite === 'front-end-block-theme'
	) {
		return {
			timeToFirstByte: median( results.timeToFirstByte ),
			largestContentfulPaint: median( results.largestContentfulPaint ),
			lcpMinusTtfb: median( results.lcpMinusTtfb ),
		};
	}

	return {
		serverResponse: average( results.serverResponse ),
		firstPaint: average( results.firstPaint ),
		domContentLoaded: average( results.domContentLoaded ),
		loaded: average( results.loaded ),
		firstContentfulPaint: average( results.firstContentfulPaint ),
		firstBlock: average( results.firstBlock ),
		type: average( results.type ),
		minType: Math.min( ...results.type ),
		maxType: Math.max( ...results.type ),
		typeContainer: average( results.typeContainer ),
		minTypeContainer: Math.min( ...results.typeContainer ),
		maxTypeContainer: Math.max( ...results.typeContainer ),
		focus: average( results.focus ),
		minFocus: Math.min( ...results.focus ),
		maxFocus: Math.max( ...results.focus ),
		inserterOpen: average( results.inserterOpen ),
		minInserterOpen: Math.min( ...results.inserterOpen ),
		maxInserterOpen: Math.max( ...results.inserterOpen ),
		inserterSearch: average( results.inserterSearch ),
		minInserterSearch: Math.min( ...results.inserterSearch ),
		maxInserterSearch: Math.max( ...results.inserterSearch ),
		inserterHover: average( results.inserterHover ),
		minInserterHover: Math.min( ...results.inserterHover ),
		maxInserterHover: Math.max( ...results.inserterHover ),
		listViewOpen: average( results.listViewOpen ),
		minListViewOpen: Math.min( ...results.listViewOpen ),
		maxListViewOpen: Math.max( ...results.listViewOpen ),
	};
}

/**
 * Runs the performance tests on the current branch.
 *
 * @param {string} testSuite                Name of the tests set.
 * @param {string} performanceTestDirectory Path to the performance tests' clone.
 * @param {string} runKey                   Unique identifier for the test run, e.g. `branch-name_post-editor_run-3`.
 *
 * @return {Promise<WPPerformanceResults>} Performance results for the branch.
 */
async function runTestSuite( testSuite, performanceTestDirectory, runKey ) {
	const resultsFilename = `${ runKey }.performance-results.json`;

	await runShellScript(
		`npm run test:performance -- ${ testSuite }`,
		performanceTestDirectory,
		{
			...process.env,
			WP_ARTIFACTS_PATH: ARTIFACTS_PATH,
			RESULTS_FILENAME: resultsFilename,
		}
	);

	return curateResults(
		testSuite,
		await readJSONFile( path.join( ARTIFACTS_PATH, resultsFilename ) )
	);
}

//@ts-ignore
const exec = runShellScript;

//@ts-ignore
async function copy( from, to, options ) {
	return await runShellScript( `cp ${ options } ${ from } ${ to }` );
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

	log(
		formats.title( '\n💃 Performance Tests 🕺\n' ),
		'\nWelcome! This tool runs the performance tests on multiple branches and displays a comparison table.\n' +
			'In order to run the tests, the tool is going to load a WordPress environment on ports 8888 and 8889.\n' +
			'Make sure these ports are not used before continuing.\n'
	);

	// if ( ! runningInCI ) {
	// 	await askForConfirmation( 'Ready to go? ' );
	// }
	const rootDir = path.join( os.tmpdir(), 'wp-gutenberg-performance-tests' );
	// await exec( `rm -rf ${ rootDir }` );
	if ( ! fs.existsSync( rootDir ) ) {
		log( `>> Creating root dir: ${ rootDir }\n` );
		fs.mkdirSync( rootDir );
	}

	const testRunnerDir = process.cwd(); // path.join( rootDir, 'test-runner' );

	let wpVersion = null;
	if ( options.wpVersion ) {
		const zipVersion = options.wpVersion.replace( /^(\d+\.\d+).0/, '$1' );
		wpVersion = `https://wordpress.org/wordpress-${ zipVersion }.zip`;
	}

	if ( wpVersion === null ) {
		log( '>> Using the latest stable WordPress version' );
	} else {
		log( `>> Using WordPress version ${ wpVersion }` );
	}

	const baseWPEnvConfig = {
		core: wpVersion,
		plugins: [], // Replace with target Gutenberg build.
		themes: [
			path.join( testRunnerDir, 'test/emptytheme' ),
			'https://downloads.wordpress.org/theme/twentytwentyone.1.7.zip',
			'https://downloads.wordpress.org/theme/twentytwentythree.1.0.zip',
		],
		env: {
			tests: {
				mappings: {
					'wp-content/mu-plugins': path.join(
						testRunnerDir,
						'packages/e2e-tests/mu-plugins'
					),
					'wp-content/plugins/gutenberg-test-plugins': path.join(
						testRunnerDir,
						'packages/e2e-tests/plugins'
					),
				},
			},
		},
	};

	const chalks = [
		formats.title.magenta,
		formats.title.cyan,
		formats.title.green,
		formats.title.yellow,
	];

	branches.unshift( 'cwd' );

	console.time( 'Setup duration' );

	await Promise.all( [
		( async function () {
			const testRunnerBranch = options.testsBranch || branches[ 0 ];

			// @ts-ignore
			const l = ( msg ) =>
				log(
					`>> ${ chalks[ 0 ](
						testRunnerBranch
					) } (test runner): ${ msg }`
				);

			if ( testRunnerBranch === 'cwd' ) {
				l( 'Using current working directory for running tests' );
			} else {
				if ( ! fs.existsSync( testRunnerDir ) ) {
					l( `Creating directory` );
					fs.mkdirSync( testRunnerDir );
				}

				// @ts-ignore
				const git = simpleGit( testRunnerDir );
				const isRepo = await git.checkIsRepo();
				if ( ! isRepo ) {
					l( 'Initializing repository' );
					await git
						.init()
						.addRemote( 'origin', config.gitRepositoryURL );
				}

				let targetSHA;
				let currentSHA;

				try {
					// Try getting SHA if passing a branch name, e.g. "trunk".
					targetSHA = await git.revparse(
						`origin/${ testRunnerBranch }`
					);
				} catch {
					// Assume the branch is a SHA if the above doesn't exist.
					targetSHA = testRunnerBranch;
				}

				try {
					currentSHA = await git.revparse( 'HEAD' );
				} catch {
					// noop
				}

				if ( currentSHA && currentSHA === targetSHA ) {
					l( 'Using the current build' );
				} else {
					l( 'Fetching' );
					await git
						.fetch( 'origin', testRunnerBranch, { '--depth': 1 } )
						.checkout( testRunnerBranch );

					l( 'Installing dependencies' );
					await exec( 'npm ci', testRunnerDir );

					l( 'Building' );
					await exec( 'node ./bin/packages/build.js', testRunnerDir );
				}
			}

			l( 'Ready! 🥳' );
		} )(),
		...branches.map( async ( branch, i ) => {
			// @ts-ignore
			const l = ( msg ) =>
				log( `>> ${ chalks[ i + 1 ]( branch ) }: ${ msg }` );

			const envDir = path.join( rootDir, `test-env-${ i }` );
			if ( ! fs.existsSync( envDir ) ) {
				l( 'Creating environment directory' );
				fs.mkdirSync( envDir );
			}

			const buildDir =
				branch === 'cwd'
					? process.cwd()
					: path.join( envDir, 'plugin' );

			if ( buildDir === testRunnerDir ) {
				l( 'Building the plugin' );
				await exec(
					'npm run prebuild:packages && node ./bin/packages/build.js && npx wp-scripts build',
					buildDir
				);

				l( 'Writing the wp-env config' );
				fs.writeFileSync(
					path.join( envDir, '.wp-env.json' ),
					JSON.stringify(
						{
							...baseWPEnvConfig,
							plugins: [ buildDir ],
						},
						null,
						2
					),
					'utf8'
				);
			} else {
				if ( ! fs.existsSync( buildDir ) ) {
					l( 'Creating build directory' );
					fs.mkdirSync( buildDir );
				}

				// @ts-ignore
				const git = simpleGit( buildDir );
				const isRepo = await git.checkIsRepo();
				if ( ! isRepo ) {
					l( 'Initializing repository' );
					await git
						.init()
						.addRemote( 'origin', config.gitRepositoryURL );
				}

				let targetSHA;
				let currentSHA;

				try {
					// Try getting SHA if passing a branch name, e.g. "trunk".
					targetSHA = await git.revparse( `origin/${ branch }` );
				} catch {
					// Assume the branch is a SHA if the above doesn't exist.
					targetSHA = branch;
				}

				try {
					currentSHA = await git.revparse( 'HEAD' );
				} catch {
					// noop
				}

				if ( currentSHA && currentSHA === targetSHA ) {
					l( 'Re-using the current build' );
				} else {
					l( 'Fetching' );
					await git
						.fetch( 'origin', branch, { '--depth': 1 } )
						.checkout( branch );

					l( 'Installing dependencies' );
					await exec( 'npm ci', buildDir );

					l( 'Building the plugin' );
					await exec(
						'npm run prebuild:packages && node ./bin/packages/build.js && npx wp-scripts build',
						buildDir
					);

					l( 'Writing the wp-env config' );

					fs.writeFileSync(
						path.join( envDir, '.wp-env.json' ),
						JSON.stringify(
							{
								...baseWPEnvConfig,
								plugins: [ buildDir ],
							},
							null,
							2
						),
						'utf8'
					);
				}
			}

			l( 'Ready! 🥳' );
		} ),
	] );

	console.timeEnd( 'Setup duration' );

	const testSuites = [
		'post-editor',
		'site-editor',
		'front-end-classic-theme',
		'front-end-block-theme',
	];

	/** @type {Record<string,Record<string, WPPerformanceResults>>} */
	const results = {};
	const wpEnvPath = path.join( testRunnerDir, 'node_modules/.bin/wp-env' );

	log( '\n>> Running the tests!\n' );
	console.time( 'Test duration' );

	for ( const testSuite of testSuites ) {
		results[ testSuite ] = {};
		/** @type {Array<Record<string, WPPerformanceResults>>} */
		const rawResults = [];
		for ( let i = 0; i < TEST_ROUNDS; i++ ) {
			const roundInfo = `round ${ i + 1 } of ${ TEST_ROUNDS }`;
			log( `>> Suite: ${ testSuite } (${ roundInfo })` );
			rawResults[ i ] = {};
			for ( const branch of branches ) {
				const sanitizedBranch = sanitizeBranchName( branch );
				const runKey = `${ testSuite }_${ sanitizedBranch }_run-${ i }`;
				// @ts-ignore
				const envDir = path.join(
					rootDir,
					`test-env-${ branches.indexOf( branch ) }`
				);

				log( `  >> Branch: ${ branch }` );
				log( '    >> Starting the environment.' );
				await exec( `${ wpEnvPath } start`, envDir );
				log( '    >> Running the test.' );
				rawResults[ i ][ branch ] = await runTestSuite(
					testSuite,
					testRunnerDir,
					runKey
				);
				log( '    >> Stopping the environment' );
				await exec( `${ wpEnvPath } stop`, envDir );
			}
		}

		console.timeEnd( 'Test duration' );

		// Computing medians.
		for ( const branch of branches ) {
			/**
			 * @type {string[]}
			 */
			let dataPointsForTestSuite = [];
			if ( rawResults.length > 0 ) {
				dataPointsForTestSuite = Object.keys(
					rawResults[ 0 ][ branch ]
				);
			}

			const resultsByDataPoint = {};
			dataPointsForTestSuite.forEach( ( dataPoint ) => {
				// @ts-ignore
				resultsByDataPoint[ dataPoint ] = rawResults.map(
					// @ts-ignore
					( r ) => r[ branch ][ dataPoint ]
				);
			} );
			const medians = mapValues( resultsByDataPoint, median );

			// Format results as times.
			results[ testSuite ][ branch ] = mapValues( medians, formatTime );
		}
	}

	// 5- Formatting the results.
	log( '\n>> 🎉 Results.\n' );

	log(
		'\nPlease note that client side metrics EXCLUDE the server response time.\n'
	);

	for ( const testSuite of testSuites ) {
		log( `\n>> ${ testSuite }\n` );

		/** @type {Record<string, Record<string, string>>} */
		const invertedResult = {};
		Object.entries( results[ testSuite ] ).reduce(
			( acc, [ key, val ] ) => {
				for ( const entry of Object.keys( val ) ) {
					// @ts-ignore
					if ( ! acc[ entry ] && isFinite( val[ entry ] ) )
						acc[ entry ] = {};
					// @ts-ignore
					if ( isFinite( val[ entry ] ) ) {
						// @ts-ignore
						acc[ entry ][ key ] = val[ entry ] + ' ms';
					}
				}
				return acc;
			},
			invertedResult
		);
		console.table( invertedResult );

		const resultsFilename = testSuite + '.performance-results.json';
		fs.writeFileSync(
			path.join( ARTIFACTS_PATH, resultsFilename ),
			JSON.stringify( results[ testSuite ], null, 2 )
		);
	}
}

module.exports = {
	runPerformanceTests,
};
