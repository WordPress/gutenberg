/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { mapValues, kebabCase } = require( 'lodash' );
const SimpleGit = require( 'simple-git' );

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
 * @property {number[]} timeToFirstByte      Represents the time since the browser started the request until it received a response.
 * @property {number[]} serverResponse       Represents the time the server takes to respond.
 * @property {number[]} firstPaint           Represents the time when the user agent first rendered after navigation.
 * @property {number[]} domContentLoaded     Represents the time immediately after the document's DOMContentLoaded event completes.
 * @property {number[]} loaded               Represents the time when the load event of the current document is completed.
 * @property {number[]} firstContentfulPaint Represents the time when the browser first renders any text or media.
 * @property {number[]} firstBlock           Represents the time when Puppeteer first sees a block selector in the DOM.
 * @property {number[]} type                 Average type time.
 * @property {number[]} typeContainer        Average type time within a container.
 * @property {number[]} focus                Average block selection time.
 * @property {number[]} inserterOpen         Average time to open global inserter.
 * @property {number[]} inserterSearch       Average time to search the inserter.
 * @property {number[]} inserterHover        Average time to move mouse between two block item in the inserter.
 * @property {number[]} listViewOpen         Average time to open listView
 */

/**
 * @typedef WPPerformanceResults
 *
 * @property {number=} timeToFirstByteMedian Represents the time since the browser started the request until it received a response (median).
 * @property {number=} timeToFirstByteP75    Represents the time since the browser started the request until it received a response (75th percentile).
 * @property {number=} serverResponse        Represents the time the server takes to respond.
 * @property {number=} firstPaint            Represents the time when the user agent first rendered after navigation.
 * @property {number=} domContentLoaded      Represents the time immediately after the document's DOMContentLoaded event completes.
 * @property {number=} loaded                Represents the time when the load event of the current document is completed.
 * @property {number=} firstContentfulPaint  Represents the time when the browser first renders any text or media.
 * @property {number=} firstBlock            Represents the time when Puppeteer first sees a block selector in the DOM.
 * @property {number=} type                  Average type time.
 * @property {number=} minType               Minimum type time.
 * @property {number=} maxType               Maximum type time.
 * @property {number=} typeContainer         Average type time within a container.
 * @property {number=} minTypeContainer      Minimum type time within a container.
 * @property {number=} maxTypeContainer      Maximum type time within a container.
 * @property {number=} focus                 Average block selection time.
 * @property {number=} minFocus              Min block selection time.
 * @property {number=} maxFocus              Max block selection time.
 * @property {number=} inserterOpen          Average time to open global inserter.
 * @property {number=} minInserterOpen       Min time to open global inserter.
 * @property {number=} maxInserterOpen       Max time to open global inserter.
 * @property {number=} inserterSearch        Average time to open global inserter.
 * @property {number=} minInserterSearch     Min time to open global inserter.
 * @property {number=} maxInserterSearch     Max time to open global inserter.
 * @property {number=} inserterHover         Average time to move mouse between two block item in the inserter.
 * @property {number=} minInserterHover      Min time to move mouse between two block item in the inserter.
 * @property {number=} maxInserterHover      Max time to move mouse between two block item in the inserter.
 * @property {number=} listViewOpen          Average time to open list view.
 * @property {number=} minListViewOpen       Min time to open list view.
 * @property {number=} maxListViewOpen       Max time to open list view.
 */

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
 * Computes the 75th percentile from an array of numbers.
 *
 * @param {number[]} array
 *
 * @return {number} 75th percentile of the given dataset.
 */
function percentile75( array ) {
	const ascending = array.sort( ( a, b ) => a - b );
	const position = Math.floor( ( 75 / 100 ) * array.length );
	return ascending[ position ];
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
 * @param {string} testSuite
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
			timeToFirstByteMedian: median( results.timeToFirstByte ),
			timeToFirstByteP75: percentile75( results.timeToFirstByte ),
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
 *
 * @return {Promise<WPPerformanceResults>} Performance results for the branch.
 */
async function runTestSuite( testSuite, performanceTestDirectory ) {
	await runShellScript(
		`npm run test:performance -- packages/e2e-tests/specs/performance/${ testSuite }.test.js`,
		performanceTestDirectory
	);
	const rawResults = await readJSONFile(
		path.join(
			performanceTestDirectory,
			`packages/e2e-tests/specs/performance/${ testSuite }.test.results.json`
		)
	);
	return curateResults( testSuite, rawResults );
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

	// 1- Preparing the tests directory.
	log( '\n>> Preparing the tests directories' );
	log( '    >> Cloning the repository' );

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
		log( `    >> Fetching the test-runner branch: ${ branchName }` );

		// @ts-ignore
		await SimpleGit( performanceTestDirectory )
			.raw( 'fetch', '--depth=1', 'origin', options.testsBranch )
			.raw( 'checkout', options.testsBranch );
	}

	log( '    >> Installing dependencies and building packages' );
	await runShellScript(
		'npm ci && node ./bin/packages/build.js',
		performanceTestDirectory
	);
	log( '    >> Creating the environment folders' );
	await runShellScript( 'mkdir -p ' + rootDirectory + '/envs' );

	// 2- Preparing the environment directories per branch.
	log( '\n>> Preparing an environment directory per branch' );
	const branchDirectories = {};
	for ( const branch of branches ) {
		log( `    >> Branch: ${ branch }` );
		const environmentDirectory =
			rootDirectory + '/envs/' + kebabCase( branch );
		// @ts-ignore
		branchDirectories[ branch ] = environmentDirectory;
		const buildPath = `${ environmentDirectory }/plugin`;
		await runShellScript( 'mkdir ' + environmentDirectory );
		await runShellScript( `cp -R ${ baseDirectory } ${ buildPath }` );

		const fancyBranch = formats.success( branch );

		if ( branch === options.testsBranch ) {
			log(
				`        >> Re-using the testing branch for ${ fancyBranch }`
			);
			await runShellScript(
				`cp -R ${ performanceTestDirectory } ${ buildPath }`
			);
		} else {
			log( `        >> Fetching the ${ fancyBranch } branch` );
			// @ts-ignore
			await SimpleGit( buildPath ).reset( 'hard' ).checkout( branch );

			log( `        >> Building the ${ fancyBranch } branch` );
			await runShellScript(
				'npm ci && npm run prebuild:packages && node ./bin/packages/build.js && npx wp-scripts build',
				buildPath
			);
		}

		await runShellScript(
			'cp ' +
				path.resolve(
					performanceTestDirectory,
					'bin/plugin/utils/.wp-env.performance.json'
				) +
				' ' +
				environmentDirectory +
				'/.wp-env.json'
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
			log( `        Using WordPress version ${ zipVersion }` );

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

	// 3- Printing the used folders.
	log(
		'\n>> Perf Tests Directory : ' +
			formats.success( performanceTestDirectory )
	);
	for ( const branch of branches ) {
		// @ts-ignore
		const envPath = formats.success( branchDirectories[ branch ] );
		log( `>> Environment Directory (${ branch }) : ${ envPath }` );
	}

	// 4- Running the tests.
	log( '\n>> Running the tests' );

	const testSuites = [
		'post-editor',
		'site-editor',
		'front-end-classic-theme',
		'front-end-block-theme',
	];

	/** @type {Record<string,Record<string, WPPerformanceResults>>} */
	const results = {};
	for ( const testSuite of testSuites ) {
		results[ testSuite ] = {};
		/** @type {Array<Record<string, WPPerformanceResults>>} */
		const rawResults = [];
		// Alternate three times between branches.
		for ( let i = 0; i < TEST_ROUNDS; i++ ) {
			rawResults[ i ] = {};
			for ( const branch of branches ) {
				// @ts-ignore
				const environmentDirectory = branchDirectories[ branch ];
				log( `    >> Branch: ${ branch }, Suite: ${ testSuite }` );
				log( '        >> Starting the environment.' );
				await runShellScript(
					'../../tests/node_modules/.bin/wp-env start',
					environmentDirectory
				);
				log( '        >> Running the test.' );
				rawResults[ i ][ branch ] = await runTestSuite(
					testSuite,
					performanceTestDirectory
				);
				log( '        >> Stopping the environment' );
				await runShellScript(
					'../../tests/node_modules/.bin/wp-env stop',
					environmentDirectory
				);
			}
		}

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

		const resultsFilename = testSuite + '-performance-results.json';
		fs.writeFileSync(
			path.resolve( __dirname, '../../../', resultsFilename ),
			JSON.stringify( results[ testSuite ], null, 2 )
		);
	}
}

module.exports = {
	runPerformanceTests,
};
