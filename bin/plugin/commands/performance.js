/**
 * External dependencies
 */
const path = require( 'path' );

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
 * @typedef WPRawPerformanceResults
 *
 * @property {number[]} load             Load Time.
 * @property {number[]} domcontentloaded DOM Contentloaded time.
 * @property {number[]} type             Average type time.
 * @property {number[]} focus            Average block selection time.
 */

/**
 * @typedef WPPerformanceResults
 *
 * @property {number} load             Load Time.
 * @property {number} domcontentloaded DOM Contentloaded time.
 * @property {number} type             Average type time.
 * @property {number} minType          Minium type time.
 * @property {number} maxType          Maximum type time.
 * @property {number} focus            Average block selection time.
 * @property {number} minFocus         Min block selection time.
 * @property {number} maxFocus         Max block selection time.
 */
/**
 * @typedef WPFormattedPerformanceResults
 *
 * @property {string} load             Load Time.
 * @property {string} domcontentloaded DOM Contentloaded time.
 * @property {string} type             Average type time.
 * @property {string} minType          Minium type time.
 * @property {string} maxType          Maximum type time.
 * @property {string} focus            Average block selection time.
 * @property {string} minFocus         Min block selection time.
 * @property {string} maxFocus         Max block selection time.
 */

/**
 * Computes the average number from an array numbers.
 *
 * @param {number[]} array
 *
 * @return {number} Average.
 */
function average( array ) {
	return array.reduce( ( a, b ) => a + b ) / array.length;
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
		domcontentloaded: average( results.domcontentloaded ),
		type: average( results.type ),
		minType: Math.min( ...results.type ),
		maxType: Math.max( ...results.type ),
		focus: average( results.focus ),
		minFocus: Math.min( ...results.focus ),
		maxFocus: Math.max( ...results.focus ),
	};
}

/**
 * Runs the performance tests on a given branch.
 *
 * @param {string} performanceTestDirectory Path to the performance tests' clone.
 * @param {string} environmentDirectory     Path to the plugin environment's clone.
 * @param {string} branch                   Branch name.
 *
 * @return {Promise<WPFormattedPerformanceResults>} Performance results for the branch.
 */
async function getPerformanceResultsForBranch(
	performanceTestDirectory,
	environmentDirectory,
	branch
) {
	await git.discardLocalChanges( environmentDirectory );

	log( '>> Fetching the ' + formats.success( branch ) + ' branch' );
	await git.checkoutRemoteBranch( environmentDirectory, branch );

	log( '>> Building the ' + formats.success( branch ) + ' branch' );
	await runShellScript(
		'rm -rf node_modules && npm install && npm run build',
		environmentDirectory
	);

	log(
		'>> Running the test on the ' + formats.success( branch ) + ' branch'
	);
	const results = [];
	for ( let i = 0; i < 3; i++ ) {
		await runShellScript(
			'npm run test-performance',
			performanceTestDirectory
		);
		const rawResults = await readJSONFile(
			path.join(
				performanceTestDirectory,
				'packages/e2e-tests/specs/performance/results.json'
			)
		);
		results.push( curateResults( rawResults ) );
	}

	return {
		load: formatTime( median( results.map( ( r ) => r.load ) ) ),
		domcontentloaded: formatTime(
			median( results.map( ( r ) => r.domcontentloaded ) )
		),
		type: formatTime( median( results.map( ( r ) => r.type ) ) ),
		minType: formatTime( median( results.map( ( r ) => r.minType ) ) ),
		maxType: formatTime( median( results.map( ( r ) => r.maxType ) ) ),
		focus: formatTime( median( results.map( ( r ) => r.focus ) ) ),
		minFocus: formatTime( median( results.map( ( r ) => r.minFocus ) ) ),
		maxFocus: formatTime( median( results.map( ( r ) => r.maxFocus ) ) ),
	};
}

/**
 * Runs the performances tests on an array of branches and output the result.
 *
 * @param {string[]} branches Branches to compare
 */
async function runPerformanceTests( branches ) {
	// The default value doesn't work because commander provides an array.
	if ( branches.length === 0 ) {
		branches = [ 'master' ];
	}

	log(
		formats.title( '\n💃 Performance Tests 🕺\n\n' ),
		'Welcome! This tool runs the performance tests on multiple branches and displays a comparison table.\n' +
			'In order to run the tests, the tool is going to load a WordPress environment on 8888 and 8889 ports.\n' +
			'Make sure these ports are not used before continuing.\n'
	);

	await askForConfirmation( 'Ready to go? ' );

	log( '>> Cloning the repository' );
	const performanceTestDirectory = await git.clone( config.gitRepositoryURL );
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

	/** @type {Record<string, WPFormattedPerformanceResults>} */
	const results = {};
	for ( const branch of branches ) {
		results[ branch ] = await getPerformanceResultsForBranch(
			performanceTestDirectory,
			environmentDirectory,
			branch
		);
	}

	log( '>> Stopping the WordPress environment' );
	await runShellScript( 'npm run wp-env stop', environmentDirectory );

	log( '\n>> 🎉 Results.\n' );
	console.table( results );
}

module.exports = {
	runPerformanceTests,
};
