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
const {
	runShellScript,
	readJSONFile,
	writeJSONFile,
} = require( '../lib/utils' );
const config = require( '../config' );

const CWD = process.cwd();

const ARTIFACTS_PATH =
	process.env.WP_ARTIFACTS_PATH || path.join( CWD, 'artifacts' );

const CHALKS = [
	formats.title.green,
	formats.title.yellow,
	formats.title.cyan,
	formats.title.red,
	formats.title.magenta,
];

const TIMERS = {
	setup: '> Setup time',
	tests: '> Tests time',
	total: '> Total time',
};

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
 * A couple of simple helpers for creating better logs.
 */
const logInfo = log;
// @ts-ignore
const logTitle = ( message ) => log( formats.title( `\n${ message }\n` ) );
// @ts-ignore
const logAction = ( message, level = 0 ) => {
	const indent = new Array( level * 2 + 1 ).join( ' ' );
	return log( `${ indent }> ${ message }` );
};
const logNewline = () => log( '' );

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
 * @param {string} testSuite Name of the tests set.
 * @param {string} runKey    Unique identifier for the test run, e.g. 'post-editor_ref-name_run-3'.
 * @return {Promise<WPPerformanceResults>} Performance results for the ref.
 */
async function runTestSuite( testSuite, runKey ) {
	const resultsFilename = `${ runKey }.performance-results.json`;

	await runShellScript( `npm run test:performance -- ${ testSuite }`, CWD, {
		...process.env,
		WP_ARTIFACTS_PATH: ARTIFACTS_PATH,
		RESULTS_FILENAME: resultsFilename,
	} );

	return curateResults(
		testSuite,
		readJSONFile( path.join( ARTIFACTS_PATH, resultsFilename ) )
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
	console.time( TIMERS.total );

	const runningInCI = !! process.env.CI || !! options.ci;
	const testRounds = options.rounds || 1;

	// @ts-ignore
	let localRef;

	if ( runningInCI ) {
		localRef = process.env.GITHUB_HEAD_REF;
		// @ts-ignore
	} else if ( await simpleGit( CWD ).checkIsRepo() ) {
		// @ts-ignore
		localRef = await simpleGit( CWD ).revparse( {
			'--abbrev-ref': null,
			HEAD: null,
		} );
	}

	if ( ! localRef ) {
		throw new Error( 'Must be running from a Gutenberg repository root.' );
	}

	logTitle( '💃 Performance Tests 🕺' );
	logInfo(
		[
			'Welcome! This tool runs the performance tests on multiple refs and displays a comparison table.',
			'In order to run the tests, the tool is going to load a WordPress environment on ports 8888 and 8889.',
			'Make sure these ports are not used before continuing.',
		].join( '\n' )
	);

	logTitle( '🏠 Setting up the environment' );

	const baseDir = path.join( os.tmpdir(), 'wp-gutenberg-performance-tests' );
	if ( fs.existsSync( baseDir ) ) {
		logAction( `Found existing base directory: ${ baseDir }` );
		if ( ! runningInCI ) {
			const { startFresh } = await inquirer.prompt( [
				{
					type: 'confirm',
					name: 'startFresh',
					message: `Clear the existing environment?`,
					default: false,
				},
			] );

			if ( startFresh ) {
				logAction( `Clearing the environment` );
				await runShellScript( `rm -rf ${ baseDir }/*` );
				// @todo Should also clear docker images?
			}
		}
	} else {
		logAction( `Creating base directory: ${ baseDir }` );
		fs.mkdirSync( baseDir );
	}

	let wpZipURL;
	if ( options.wpVersion ) {
		const zipVersion = options.wpVersion.replace( /^(\d+\.\d+).0/, '$1' );
		wpZipURL = `https://wordpress.org/wordpress-${ zipVersion }.zip`;
	}

	const baseWPEnvConfig = {
		core: wpZipURL ?? null, // Default to the latest stable core version.
		plugins: [], // To be updated with the target Gutenberg build path.
		themes: [
			path.join( CWD, 'test/emptytheme' ),
			// @todo Move the below to the tests that require them.
			'https://downloads.wordpress.org/theme/twentytwentyone.1.7.zip',
			'https://downloads.wordpress.org/theme/twentytwentythree.1.0.zip',
		],
		env: {
			tests: {
				mappings: {
					'wp-content/mu-plugins': path.join(
						CWD,
						'packages/e2e-tests/mu-plugins'
					),
					'wp-content/plugins/gutenberg-test-plugins': path.join(
						CWD,
						'packages/e2e-tests/plugins'
					),
				},
			},
		},
	};

	let buildLocalRef = true;

	if ( ! runningInCI ) {
		// When running locally it might not make sense to rebuild the local
		// branch every time, so let's ask. We're assuming that the node modules
		// are installed, though.
		const inquiry = await inquirer.prompt( [
			{
				type: 'confirm',
				name: 'buildLocalRef',
				message: `Build the plugin from your local branch? (${ formats.success(
					localRef
				) })`,
				default: false,
			},
		] );

		buildLocalRef = inquiry.buildLocalRef;
	}

	console.time( TIMERS.setup );

	logAction( 'Creating environments for given refs:' );
	// @todo If a ref matches "release/*", use the zipped plugin URL so we don't
	// need to build.
	const testRefs = [ ...new Set( [ localRef, ...refs ] ) ];

	// Run plugin builds in parallel.
	await Promise.all(
		testRefs.map( async ( ref, i ) => {
			// @ts-ignore
			const logRefAction = ( msg ) =>
				logAction( `${ CHALKS[ i ]( ref ) }: ${ msg }`, 2 );

			const envDir = path.join( baseDir, `test-env-${ i }` );
			if ( ! fs.existsSync( envDir ) ) {
				logRefAction( `Creating environment directory (${ envDir })` );
				fs.mkdirSync( envDir );
			} else {
				logRefAction(
					`Using existing environment directory (${ envDir })`
				);
			}

			let buildDir;
			let targetSHA;
			let doBuild = true;

			// @ts-ignore
			if ( ref === localRef ) {
				buildDir = CWD;
				doBuild = buildLocalRef;
			} else {
				buildDir = path.join( envDir, 'plugin' );

				if ( ! fs.existsSync( buildDir ) ) {
					logRefAction( `Creating build directory (${ buildDir })` );
					fs.mkdirSync( buildDir );
				}

				// @ts-ignore
				const git = simpleGit( buildDir );
				const isRepo = await git.checkIsRepo();
				if ( ! isRepo ) {
					logRefAction( 'Initializing repository' );
					await git
						.init()
						.addRemote( 'origin', config.gitRepositoryURL );
				}

				try {
					// Try getting last commit SHA if passing a branch name.
					await git.fetch( 'origin', ref, { '--depth': 1 } ); // --no-tags?
					targetSHA = await git.revparse( `origin/${ ref }` );
				} catch {
					// Assume the ref is a SHA if the above doesn't exist.
					targetSHA = ref;
				}

				const isBuildUpToDate = fs.existsSync(
					path.join( envDir, `build-ref-${ targetSHA }` )
				);

				if ( isBuildUpToDate ) {
					logRefAction( 'Using current build' );
					doBuild = false;
				} else {
					logRefAction( 'Fetching' );
					await git
						.fetch( 'origin', ref, { '--depth': 1 } )
						.reset( 'hard', `origin/${ ref }` )
						.checkout( ref );

					logRefAction( 'Installing dependencies' );
					await runShellScript( 'npm ci', buildDir );
					doBuild = true;
				}
			}

			if ( doBuild ) {
				logRefAction( 'Building' );
				await runShellScript( 'npm run build', buildDir );
				await runShellScript( 'rm -f build-ref-*', envDir );
				// Save the build hash so we can check whether we need to
				// rebuild when rerunning.
				await runShellScript(
					`touch build-ref-${ targetSHA }`,
					envDir
				);
			}

			if ( ! fs.existsSync( path.join( envDir, '.wp-env.json' ) ) ) {
				logRefAction( 'Writing wp-env config' );
				writeJSONFile( path.join( envDir, '.wp-env.json' ), {
					...baseWPEnvConfig,
					plugins: [ buildDir ],
				} );
			}

			logRefAction( 'Ready! 🥳' );
		} )
	);

	logNewline();
	console.timeEnd( TIMERS.setup );
	console.time( TIMERS.tests );

	const testSuites = [
		'post-editor',
		'site-editor',
		'front-end-classic-theme',
		'front-end-block-theme',
	];

	/** @type {Record<string,Record<string, WPPerformanceResults>>} */
	const results = {};
	const wpEnvPath = path.join( CWD, 'node_modules/.bin/wp-env' );

	logTitle( '🏃 Running the tests' );

	if ( options.wpVersion ) {
		logAction( `Using WordPress v${ options.wpVersion }\n` );
	} else {
		logAction( 'Using the latest stable WordPress version\n' );
	}

	for ( const testSuite of testSuites ) {
		results[ testSuite ] = {};
		/** @type {Array<Record<string, WPPerformanceResults>>} */
		const rawResults = [];
		for ( let roundIndex = 0; roundIndex < testRounds; roundIndex++ ) {
			const roundInfo = `round ${ roundIndex + 1 } of ${ testRounds }`;
			rawResults[ roundIndex ] = {};

			logAction(
				`Suite: ${ formats.title( testSuite ) } (${ roundInfo })`
			);

			for ( const [ refIndex, ref ] of testRefs.entries() ) {
				const sanitizedBranch = sanitizeBranchName( ref );
				const runKey = `${ testSuite }_${ sanitizedBranch }_round-${ roundIndex }`;
				const envDir = path.join( baseDir, `test-env-${ refIndex }` );

				logAction( `Ref: ${ CHALKS[ refIndex ]( ref ) }`, 2 );
				logAction( 'Starting the environment', 3 );
				await runShellScript( `${ wpEnvPath } start`, envDir );
				logAction( 'Running the test', 3 );
				rawResults[ roundIndex ][ ref ] = await runTestSuite(
					testSuite,
					runKey
				);
				logAction( 'Stopping the environment', 3 );
				await runShellScript( `${ wpEnvPath } stop`, envDir );
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

	logNewline();
	console.timeEnd( TIMERS.tests );

	logTitle( '🎉 Results' );

	logInfo(
		'Please note that client side metrics EXCLUDE the server response time.\n'
	);

	// Formatting the results.
	for ( const testSuite of testSuites ) {
		logAction( `${ testSuite }\n` );
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
		logNewline();

		const resultsFilename = testSuite + '.performance-results.json';
		writeJSONFile(
			path.join( ARTIFACTS_PATH, resultsFilename ),
			results[ testSuite ]
		);
	}

	console.timeEnd( TIMERS.total );
	logNewline();
}

module.exports = {
	runPerformanceTests,
};
