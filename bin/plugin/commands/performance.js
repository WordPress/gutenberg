/**
 * External dependencies
 */
const fs = require( 'fs' );
const os = require( 'os' );
const path = require( 'path' );
const { mapValues } = require( 'lodash' );
const simpleGit = require( 'simple-git' );
// @ts-ignore
const inquirer = require( 'inquirer' );

/**
 * Internal dependencies
 */
const { formats, log } = require( '../lib/logger' );
const { runShellScript: exec, readJSONFile } = require( '../lib/utils' );
const config = require( '../config' );

const ARTIFACTS_PATH =
	process.env.WP_ARTIFACTS_PATH || path.join( process.cwd(), 'artifacts' );

const CHALKS = [
	formats.title.magenta,
	formats.title.cyan,
	formats.title.green,
	formats.title.yellow,
];

/**
 * @typedef WPPerformanceCommandOptions
 *
 * @property {boolean=} ci          Run on CI.
 * @property {number=}  rounds      Run each test suite this many times for each ref.
 * @property {string=}  testsBranch The ref whose performance test files will be used for testing.
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
 * Runs the performance tests on the current ref.
 *
 * @param {string} testSuite                Name of the tests set.
 * @param {string} performanceTestDirectory Path to the performance tests' clone.
 * @param {string} runKey                   Unique identifier for the test run, e.g. `ref-name_post-editor_run-3`.
 *
 * @return {Promise<WPPerformanceResults>} Performance results for the ref.
 */
async function runTestSuite( testSuite, performanceTestDirectory, runKey ) {
	const resultsFilename = `${ runKey }.performance-results.json`;

	await exec(
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

/**
 * Runs the performances tests on an array of git refs and output the result.
 * Ref can be a branch, commit SHA or a tag.
 *
 * @param {string[]}                    refs    Refs to compare.
 * @param {WPPerformanceCommandOptions} options Command options.
 */
async function runPerformanceTests( refs, options ) {
	console.time( 'Total time' );

	const cwd = process.cwd();
	const runningInCI = !! process.env.CI || !! options.ci;
	const testRounds = options.rounds || 1;

	let currentRef;

	if ( runningInCI ) {
		currentRef = process.env.GITHUB_HEAD_REF;
		// @ts-ignore
	} else if ( await simpleGit( cwd ).checkIsRepo() ) {
		// @ts-ignore
		currentRef = await simpleGit( cwd ).revparse( {
			'--abbrev-ref': null,
			HEAD: null,
		} );
	}

	if ( ! currentRef ) {
		throw new Error( 'Must be running from a Gutenberg repository root' );
	}

	log(
		formats.title( '\n💃 Performance Tests 🕺\n' ),
		'\nWelcome! This tool runs the performance tests on multiple refs and displays a comparison table.\n' +
			'In order to run the tests, the tool is going to load a WordPress environment on ports 8888 and 8889.\n' +
			'Make sure these ports are not used before continuing.\n'
	);

	log( '\n>> Setting up the environment\n' );
	console.time( 'Setup duration' );

	const rootDir = path.join( os.tmpdir(), 'wp-gutenberg-performance-tests' );
	if ( ! fs.existsSync( rootDir ) ) {
		log( `  >> Creating root dir: ${ rootDir }` );
		fs.mkdirSync( rootDir );
	}

	let wpVersion = null; // Default to the latest stable core version.
	if ( options.wpVersion ) {
		const zipVersion = options.wpVersion.replace( /^(\d+\.\d+).0/, '$1' );
		wpVersion = `https://wordpress.org/wordpress-${ zipVersion }.zip`;
	}

	const baseWPEnvConfig = {
		core: wpVersion,
		plugins: [], // Replace with target Gutenberg build.
		themes: [
			path.join( cwd, 'test/emptytheme' ),
			'https://downloads.wordpress.org/theme/twentytwentyone.1.7.zip',
			'https://downloads.wordpress.org/theme/twentytwentythree.1.0.zip',
		],
		env: {
			tests: {
				mappings: {
					'wp-content/mu-plugins': path.join(
						cwd,
						'packages/e2e-tests/mu-plugins'
					),
					'wp-content/plugins/gutenberg-test-plugins': path.join(
						cwd,
						'packages/e2e-tests/plugins'
					),
				},
			},
		},
	};

	let buildCurrentBranch = true;

	if ( ! runningInCI ) {
		// When running locally it might not make sense to rebuild the local branch
		const { confirmation } = await inquirer.prompt( [
			{
				type: 'confirm',
				name: 'confirmation',
				message: 'Run build for the current branch?',
				default: false,
			},
		] );

		buildCurrentBranch = confirmation;
	}

	log( '  >> Building given refs:' );
	// TODO: If ref matches "release/*", use the zipped plugin URL.
	const testRefs = [ currentRef, ...refs ];

	// Run plugin builds in parallel.
	await Promise.all(
		testRefs.map( async ( ref, i ) => {
			// @ts-ignore
			const l = ( msg ) =>
				log( `    >> ${ CHALKS[ i ]( ref ) }: ${ msg }` );

			const envDir = path.join( rootDir, `test-env-${ i }` );
			if ( ! fs.existsSync( envDir ) ) {
				l( 'Creating environment directory' );
				fs.mkdirSync( envDir );
			}

			let buildDir;
			let doBuild = true;

			if ( i === 0 ) {
				buildDir = cwd;
				doBuild = buildCurrentBranch;
			} else {
				buildDir = path.join( envDir, 'plugin' );

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
					// Try getting SHA if passing a ref name, e.g. "trunk".
					await git.fetch( 'origin', ref, { '--depth': 1 } ); // --no-tags?
					targetSHA = await git.revparse( `origin/${ ref }` );
				} catch {
					// Assume the ref is a SHA if the above doesn't exist.
					targetSHA = ref;
				}

				try {
					currentSHA = await git.revparse( 'HEAD' );
				} catch {
					// noop
				}

				// If the latest remote SHA is same as the current local SHA
				// assume there is a build and it's up-to-date.
				if ( currentSHA && currentSHA === targetSHA ) {
					l( 'Re-using the current build' );
					doBuild = false;
				} else {
					l( 'Fetching' );
					await git
						.fetch( 'origin', ref, { '--depth': 1 } ) // --no-tags?
						.checkout( ref );
				}
			}

			if ( doBuild ) {
				l( 'Installing dependencies' );
				await exec( 'npm ci', buildDir );

				l( 'Building the plugin' );
				await exec(
					'npm run prebuild:packages && node ./bin/packages/build.js && npx wp-scripts build',
					buildDir
				);
			}

			if ( fs.existsSync( path.join( envDir, '.wp-env.json' ) ) ) {
				l( 'Re-using the current wp-env config' );
			} else {
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

			l( 'Ready! 🥳' );
		} )
	);

	log( '' );
	console.timeEnd( 'Setup duration' );
	console.time( 'Tests duration' );

	const testSuites = [
		'post-editor',
		'site-editor',
		'front-end-classic-theme',
		'front-end-block-theme',
	];

	/** @type {Record<string,Record<string, WPPerformanceResults>>} */
	const results = {};
	const wpEnvPath = path.join( cwd, 'node_modules/.bin/wp-env' );

	log( '\n>> Running the tests\n' );

	if ( wpVersion === null ) {
		log( '  >> Using the latest stable WordPress version' );
	} else {
		log( `  >> Using WordPress version ${ wpVersion }` );
	}

	for ( const testSuite of testSuites ) {
		results[ testSuite ] = {};
		/** @type {Array<Record<string, WPPerformanceResults>>} */
		const rawResults = [];
		for ( let i = 0; i < testRounds; i++ ) {
			const roundInfo = `round ${ i + 1 } of ${ testRounds }`;
			rawResults[ i ] = {};

			log(
				`\n  >> Suite: ${ CHALKS[ 2 ]( testSuite ) } (${ roundInfo })`
			);

			for ( const ref of testRefs ) {
				const sanitizedBranch = sanitizeBranchName( ref );
				const runKey = `${ testSuite }_${ sanitizedBranch }_run-${ i }`;
				// @ts-ignore
				const envDir = path.join(
					rootDir,
					`test-env-${ testRefs.indexOf( ref ) }`
				);

				log( `    >> Ref: ${ CHALKS[ 3 ]( ref ) }` );
				log( '      >> Starting the environment.' );
				await exec( `${ wpEnvPath } start`, envDir );
				log( '      >> Running the test.' );
				rawResults[ i ][ ref ] = await runTestSuite(
					testSuite,
					cwd,
					runKey
				);
				log( '      >> Stopping the environment' );
				await exec( `${ wpEnvPath } stop`, envDir );
			}
		}

		// Computing medians.
		for ( const ref of testRefs ) {
			/**
			 * @type {string[]}
			 */
			let dataPointsForTestSuite = [];
			if ( rawResults.length > 0 ) {
				dataPointsForTestSuite = Object.keys( rawResults[ 0 ][ ref ] );
			}

			const resultsByDataPoint = {};
			dataPointsForTestSuite.forEach( ( dataPoint ) => {
				// @ts-ignore
				resultsByDataPoint[ dataPoint ] = rawResults.map(
					// @ts-ignore
					( r ) => r[ ref ][ dataPoint ]
				);
			} );
			const medians = mapValues( resultsByDataPoint, median );

			// Format results as times.
			results[ testSuite ][ ref ] = mapValues( medians, formatTime );
		}
	}

	log( '' );
	console.timeEnd( 'Tests duration' );

	// TODO: Clean up the env

	// Formatting the results.
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

	log( '' );
	console.timeEnd( 'Total time' );
}

module.exports = {
	runPerformanceTests,
};
