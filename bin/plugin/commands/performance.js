/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { mapValues, kebabCase } = require( 'lodash' );

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
const git = require( '../lib/git' );
const config = require( '../config' );

/**
 * @typedef WPPerformanceCommandOptions
 *
 * @property {boolean=} ci          Run on CI.
 * @property {string=}  testsBranch The branch whose performance test files will be used for testing.
 * @property {string=}  wpVersion   The WordPress version to be used as the base install for testing.
 */

/**
 * @typedef WPRawPerformanceResults
 *
 * @property {number[]} serverResponse       Represents the time the server takes to respond.
 * @property {number[]} firstPaint           Represents the time when the user agent first rendered after navigation.
 * @property {number[]} domContentLoaded     Represents the time immediately after the document's DOMContentLoaded event completes.
 * @property {number[]} loaded               Represents the time when the load event of the current document is completed.
 * @property {number[]} firstContentfulPaint Represents the time when the browser first renders any text or media.
 * @property {number[]} firstBlock           Represents the time when Puppeteer first sees a block selector in the DOM.
 * @property {number[]} type                 Average type time.
 * @property {number[]} focus                Average block selection time.
 * @property {number[]} inserterOpen         Average time to open global inserter.
 * @property {number[]} inserterSearch       Average time to search the inserter.
 * @property {number[]} inserterHover        Average time to move mouse between two block item in the inserter.
 * @property {number[]} listViewOpen         Average time to open listView
 */

/**
 * @typedef WPPerformanceResults
 *
 * @property {number=} serverResponse       Represents the time the server takes to respond.
 * @property {number=} firstPaint           Represents the time when the user agent first rendered after navigation.
 * @property {number=} domContentLoaded     Represents the time immediately after the document's DOMContentLoaded event completes.
 * @property {number=} loaded               Represents the time when the load event of the current document is completed.
 * @property {number=} firstContentfulPaint Represents the time when the browser first renders any text or media.
 * @property {number=} firstBlock           Represents the time when Puppeteer first sees a block selector in the DOM.
 * @property {number=} type                 Average type time.
 * @property {number=} minType              Minimum type time.
 * @property {number=} maxType              Maximum type time.
 * @property {number=} focus                Average block selection time.
 * @property {number=} minFocus             Min block selection time.
 * @property {number=} maxFocus             Max block selection time.
 * @property {number=} inserterOpen         Average time to open global inserter.
 * @property {number=} minInserterOpen      Min time to open global inserter.
 * @property {number=} maxInserterOpen      Max time to open global inserter.
 * @property {number=} inserterSearch       Average time to open global inserter.
 * @property {number=} minInserterSearch    Min time to open global inserter.
 * @property {number=} maxInserterSearch    Max time to open global inserter.
 * @property {number=} inserterHover        Average time to move mouse between two block item in the inserter.
 * @property {number=} minInserterHover     Min time to move mouse between two block item in the inserter.
 * @property {number=} maxInserterHover     Max time to move mouse between two block item in the inserter.
 * @property {number=} listViewOpen         Average time to open list view.
 * @property {number=} minListViewOpen      Min time to open list view.
 * @property {number=} maxListViewOpen      Max time to open list view.
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
 * @param {WPRawPerformanceResults} results
 *
 * @return {WPPerformanceResults} Curated Performance results.
 */
function curateResults( results ) {
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
 * Set up the given branch for testing.
 *
 * @param {string} branch               Branch name.
 * @param {string} environmentDirectory Path to the plugin environment's clone.
 */
async function setUpGitBranch( branch, environmentDirectory ) {
	// Restore clean working directory (e.g. if `package-lock.json` has local
	// changes after install).
	await git.discardLocalChanges( environmentDirectory );

	log( '        >> Fetching the ' + formats.success( branch ) + ' branch' );
	await git.checkoutRemoteBranch( environmentDirectory, branch );

	log( '        >> Building the ' + formats.success( branch ) + ' branch' );
	await runShellScript( 'pnpm install && pnpm build', environmentDirectory );
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
		`pnpm test-performance -- packages/e2e-tests/specs/performance/${ testSuite }.test.js`,
		performanceTestDirectory
	);
	const rawResults = await readJSONFile(
		path.join(
			performanceTestDirectory,
			`packages/e2e-tests/specs/performance/${ testSuite }.test.results.json`
		)
	);
	return curateResults( rawResults );
}

/**
 * Runs the performances tests on an array of branches and output the result.
 *
 * @param {string[]}                    branches Branches to compare
 * @param {WPPerformanceCommandOptions} options  Command options.
 */
async function runPerformanceTests( branches, options ) {
	// The default value doesn't work because commander provides an array.
	if ( branches.length === 0 ) {
		branches = [ 'trunk' ];
	}

	log(
		formats.title( '\n💃 Performance Tests 🕺\n' ),
		'\nWelcome! This tool runs the performance tests on multiple branches and displays a comparison table.\n' +
			'In order to run the tests, the tool is going to load a WordPress environment on 8888 and 8889 ports.\n' +
			'Make sure these ports are not used before continuing.\n'
	);

	if ( ! options.ci ) {
		await askForConfirmation( 'Ready to go? ' );
	}

	// 1- Preparing the tests directory.
	log( '\n>> Preparing the tests directories' );
	log( '    >> Cloning the repository' );
	const baseDirectory = await git.clone( config.gitRepositoryURL );
	const rootDirectory = getRandomTemporaryPath();
	const performanceTestDirectory = rootDirectory + '/tests';
	await runShellScript( 'mkdir -p ' + rootDirectory );
	await runShellScript(
		'cp -R ' + baseDirectory + ' ' + performanceTestDirectory
	);
	if ( !! options.testsBranch ) {
		log(
			'    >> Fetching the test branch: ' +
				formats.success( options.testsBranch ) +
				' branch'
		);
		await git.checkoutRemoteBranch(
			performanceTestDirectory,
			options.testsBranch
		);
	}
	log( '    >> Installing dependencies and building packages' );
	await runShellScript(
		'pnpm install && pnpm build:packages',
		performanceTestDirectory
	);
	log( '    >> Creating the environment folders' );
	await runShellScript( 'mkdir -p ' + rootDirectory + '/envs' );

	// 2- Preparing the environment directories per branch.
	log( '\n>> Preparing an environment directory per branch' );
	const branchDirectories = {};
	for ( const branch of branches ) {
		log( '    >> Branch: ' + branch );
		const environmentDirectory =
			rootDirectory + '/envs/' + kebabCase( branch );
		// @ts-ignore
		branchDirectories[ branch ] = environmentDirectory;
		await runShellScript( 'mkdir ' + environmentDirectory );
		await runShellScript(
			'cp -R ' + baseDirectory + ' ' + environmentDirectory + '/plugin'
		);
		await setUpGitBranch( branch, environmentDirectory + '/plugin' );
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
		log(
			'>> Environment Directory (' +
				branch +
				') : ' +
				// @ts-ignore
				formats.success( branchDirectories[ branch ] )
		);
	}

	// 4- Running the tests.
	log( '\n>> Running the tests' );

	const testSuites = [ 'post-editor', 'site-editor' ];

	/** @type {Record<string,Record<string, WPPerformanceResults>>} */
	const results = {};
	for ( const testSuite of testSuites ) {
		results[ testSuite ] = {};
		/** @type {Array<Record<string, WPPerformanceResults>>} */
		const rawResults = [];
		// Alternate three times between branches
		for ( let i = 0; i < 3; i++ ) {
			rawResults[ i ] = {};
			for ( const branch of branches ) {
				// @ts-ignore
				const environmentDirectory = branchDirectories[ branch ];
				log( '    >> Branch: ' + branch + ', Suite: ' + testSuite );
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
			const medians = mapValues(
				{
					serverResponse: rawResults.map(
						( r ) => r[ branch ].serverResponse
					),
					firstPaint: rawResults.map(
						( r ) => r[ branch ].firstPaint
					),
					domContentLoaded: rawResults.map(
						( r ) => r[ branch ].domContentLoaded
					),
					loaded: rawResults.map( ( r ) => r[ branch ].loaded ),
					firstContentfulPaint: rawResults.map(
						( r ) => r[ branch ].firstContentfulPaint
					),
					firstBlock: rawResults.map(
						( r ) => r[ branch ].firstBlock
					),
					type: rawResults.map( ( r ) => r[ branch ].type ),
					minType: rawResults.map( ( r ) => r[ branch ].minType ),
					maxType: rawResults.map( ( r ) => r[ branch ].maxType ),
					focus: rawResults.map( ( r ) => r[ branch ].focus ),
					minFocus: rawResults.map( ( r ) => r[ branch ].minFocus ),
					maxFocus: rawResults.map( ( r ) => r[ branch ].maxFocus ),
					inserterOpen: rawResults.map(
						( r ) => r[ branch ].inserterOpen
					),
					minInserterOpen: rawResults.map(
						( r ) => r[ branch ].minInserterOpen
					),
					maxInserterOpen: rawResults.map(
						( r ) => r[ branch ].maxInserterOpen
					),
					inserterSearch: rawResults.map(
						( r ) => r[ branch ].inserterSearch
					),
					minInserterSearch: rawResults.map(
						( r ) => r[ branch ].minInserterSearch
					),
					maxInserterSearch: rawResults.map(
						( r ) => r[ branch ].maxInserterSearch
					),
					inserterHover: rawResults.map(
						( r ) => r[ branch ].inserterHover
					),
					minInserterHover: rawResults.map(
						( r ) => r[ branch ].minInserterHover
					),
					maxInserterHover: rawResults.map(
						( r ) => r[ branch ].maxInserterHover
					),
					listViewOpen: rawResults.map(
						( r ) => r[ branch ].listViewOpen
					),
					minListViewOpen: rawResults.map(
						( r ) => r[ branch ].minListViewOpen
					),
					maxListViewOpen: rawResults.map(
						( r ) => r[ branch ].maxListViewOpen
					),
				},
				median
			);

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
