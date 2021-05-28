/**
 * External dependencies
 */
const path = require( 'path' );
const { pickBy, mapValues } = require( 'lodash' );

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
 */

/**
 * @typedef WPRawPerformanceResults
 *
 * @property {number[]} load             Load Time.
 * @property {number[]} type             Average type time.
 * @property {number[]} focus            Average block selection time.
 * @property {number[]} inserterOpen     Average time to open global inserter.
 * @property {number[]} inserterHover    Average time to move mouse between two block item in the inserter.
 */

/**
 * @typedef WPPerformanceResults
 *
 * @property {number} load              Load Time.
 * @property {number} type              Average type time.
 * @property {number} minType           Minium type time.
 * @property {number} maxType           Maximum type time.
 * @property {number} focus             Average block selection time.
 * @property {number} minFocus          Min block selection time.
 * @property {number} maxFocus          Max block selection time.
 * @property {number} inserterOpen      Average time to open global inserter.
 * @property {number} minInserterOpen   Min time to open global inserter.
 * @property {number} maxInserterOpen   Max time to open global inserter.
 * @property {number} inserterHover     Average time to move mouse between two block item in the inserter.
 * @property {number} minInserterHover  Min time to move mouse between two block item in the inserter.
 * @property {number} maxInserterHover  Max time to move mouse between two block item in the inserter.
 */
/**
 * @typedef WPFormattedPerformanceResults
 *
 * @property {string=} load              Load Time.
 * @property {string=} type              Average type time.
 * @property {string=} minType           Minium type time.
 * @property {string=} maxType           Maximum type time.
 * @property {string=} focus             Average block selection time.
 * @property {string=} minFocus          Min block selection time.
 * @property {string=} maxFocus          Max block selection time.
 * @property {string=} inserterOpen      Average time to open global inserter.
 * @property {string=} minInserterOpen   Min time to open global inserter.
 * @property {string=} maxInserterOpen   Max time to open global inserter.
 * @property {string=} inserterHover     Average time to move mouse between two block item in the inserter.
 * @property {string=} minInserterHover  Min time to move mouse between two block item in the inserter.
 * @property {string=} maxInserterHover  Max time to move mouse between two block item in the inserter.
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
 * @return {string} Formatted time.
 */
function formatTime( number ) {
	const factor = Math.pow( 10, 2 );
	return Math.round( number * factor ) / factor + ' ms';
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
		load: average( results.load ),
		type: average( results.type ),
		minType: Math.min( ...results.type ),
		maxType: Math.max( ...results.type ),
		focus: average( results.focus ),
		minFocus: Math.min( ...results.focus ),
		maxFocus: Math.max( ...results.focus ),
		inserterOpen: average( results.inserterOpen ),
		minInserterOpen: Math.min( ...results.inserterOpen ),
		maxInserterOpen: Math.max( ...results.inserterOpen ),
		inserterHover: average( results.inserterHover ),
		minInserterHover: Math.min( ...results.inserterHover ),
		maxInserterHover: Math.max( ...results.inserterHover ),
	};
}

/**
 * Set up the given branch for testing.
 *
 * @param {string} branch                   Branch name.
 * @param {string} environmentDirectory     Path to the plugin environment's clone.
 */
async function setUpGitBranch( branch, environmentDirectory ) {
	// Restore clean working directory (e.g. if `package-lock.json` has local
	// changes after install).
	await git.discardLocalChanges( environmentDirectory );

	log( '>> Fetching the ' + formats.success( branch ) + ' branch' );
	await git.checkoutRemoteBranch( environmentDirectory, branch );

	log( '>> Building the ' + formats.success( branch ) + ' branch' );
	await runShellScript(
		'rm -rf node_modules packages/*/node_modules && npm install && npm run build',
		environmentDirectory
	);
}

/**
 * Runs the performance tests on the current branch.
 *
 * @param {string} testSuite                Name of the tests set.
 * @param {string} performanceTestDirectory Path to the performance tests' clone.
 *
 * @return {Promise<WPFormattedPerformanceResults>} Performance results for the branch.
 */
async function runTestSuite( testSuite, performanceTestDirectory ) {
	const results = [];
	for ( let i = 0; i < 3; i++ ) {
		await runShellScript(
			`npm run test-performance -- packages/e2e-tests/specs/performance/${ testSuite }.test.js`,
			performanceTestDirectory
		);
		const rawResults = await readJSONFile(
			path.join(
				performanceTestDirectory,
				`packages/e2e-tests/specs/performance/${ testSuite }.test.results.json`
			)
		);
		results.push( curateResults( rawResults ) );
	}

	const medians = mapValues(
		{
			load: results.map( ( r ) => r.load ),
			type: results.map( ( r ) => r.type ),
			minType: results.map( ( r ) => r.minType ),
			maxType: results.map( ( r ) => r.maxType ),
			focus: results.map( ( r ) => r.focus ),
			minFocus: results.map( ( r ) => r.minFocus ),
			maxFocus: results.map( ( r ) => r.maxFocus ),
			inserterOpen: results.map( ( r ) => r.inserterOpen ),
			minInserterOpen: results.map( ( r ) => r.minInserterOpen ),
			maxInserterOpen: results.map( ( r ) => r.maxInserterOpen ),
			inserterHover: results.map( ( r ) => r.inserterHover ),
			minInserterHover: results.map( ( r ) => r.minInserterHover ),
			maxInserterHover: results.map( ( r ) => r.maxInserterHover ),
		},
		median
	);

	// Remove results for which we don't have data (and where the statistical functions thus returned NaN or Infinity etc).
	const finiteMedians = pickBy( medians, isFinite );
	// Format results as times.
	return mapValues( finiteMedians, formatTime );
}

/**
 * Runs the performances tests on an array of branches and output the result.
 *
 * @param {string[]}                    branches Branches to compare
 * @param {WPPerformanceCommandOptions} options Command options.
 */
async function runPerformanceTests( branches, options ) {
	// The default value doesn't work because commander provides an array.
	if ( branches.length === 0 ) {
		branches = [ 'trunk' ];
	}

	log(
		formats.title( '\n💃 Performance Tests 🕺\n\n' ),
		'Welcome! This tool runs the performance tests on multiple branches and displays a comparison table.\n' +
			'In order to run the tests, the tool is going to load a WordPress environment on 8888 and 8889 ports.\n' +
			'Make sure these ports are not used before continuing.\n'
	);

	if ( ! options.ci ) {
		await askForConfirmation( 'Ready to go? ' );
	}

	log( '>> Cloning the repository' );
	const performanceTestDirectory = await git.clone( config.gitRepositoryURL );

	if ( !! options.testsBranch ) {
		log(
			'>> Fetching the ' +
				formats.success( options.testsBranch ) +
				' branch'
		);
		await git.checkoutRemoteBranch(
			performanceTestDirectory,
			options.testsBranch
		);
	}

	const environmentDirectory = getRandomTemporaryPath();
	log(
		'>> Perf Tests Directory : ' +
			formats.success( performanceTestDirectory )
	);
	log(
		'>> Environment Directory : ' + formats.success( environmentDirectory )
	);

	log( '>> Installing dependencies' );
	// The build packages is necessary for the performance folder
	await runShellScript(
		'npm install && npm run build:packages',
		performanceTestDirectory
	);
	await runShellScript(
		'cp -R ' + performanceTestDirectory + ' ' + environmentDirectory
	);

	log( '>> Starting the WordPress environment' );
	await runShellScript( 'npm run wp-env start', environmentDirectory );

	const testSuites = [ 'post-editor', 'site-editor' ];

	/** @type {Record<string,Record<string, WPFormattedPerformanceResults>>} */
	let results = {};
	for ( const branch of branches ) {
		await setUpGitBranch( branch, environmentDirectory );
		log(
			'>> Running the test on the ' +
				formats.success( branch ) +
				' branch'
		);

		for ( const testSuite of testSuites ) {
			results = {
				...results,
				[ testSuite ]: {
					...results[ testSuite ],
					[ branch ]: await runTestSuite(
						testSuite,
						performanceTestDirectory
					),
				},
			};
		}
	}

	log( '>> Stopping the WordPress environment' );
	await runShellScript( 'npm run wp-env stop', environmentDirectory );

	log( '\n>> 🎉 Results.\n' );
	for ( const testSuite of testSuites ) {
		log( `\n>> ${ testSuite }\n` );

		/** @type {Record<string, Record<string, string>>} */
		const invertedResult = {};
		Object.entries( results[ testSuite ] ).reduce(
			( acc, [ key, val ] ) => {
				for ( const entry of Object.keys( val ) ) {
					if ( ! acc[ entry ] ) acc[ entry ] = {};
					// @ts-ignore
					acc[ entry ][ key ] = val[ entry ];
				}
				return acc;
			},
			invertedResult
		);
		console.table( invertedResult );
	}
}

module.exports = {
	runPerformanceTests,
};
