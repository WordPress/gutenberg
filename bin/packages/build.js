/**
 * External dependencies
 */
const path = require( 'path' );
const glob = require( 'fast-glob' );
const ProgressBar = require( 'progress' );
const workerFarm = require( 'worker-farm' );

let files = process.argv.slice( 2 );

/**
 * Path to packages directory.
 *
 * @type {string}
 */
const PACKAGES_DIR = path.resolve( __dirname, '../../packages' );

let onFileComplete = () => {};

if ( ! files.length ) {
	const bar = new ProgressBar( 'Build Progress: [:bar] :percent', {
		width: 30,
		incomplete: ' ',
		total: 1,
	} );

	bar.tick( 0 );

	files = glob.sync( [
		`${ PACKAGES_DIR }/*/src/**/*.js`,
		`${ PACKAGES_DIR }/*/src/*.scss`,
	], {
		ignore: [
			`**/test/**`,
			`**/__mocks__/**`,
		],
		onlyFiles: true,
	} );

	bar.total = files.length;

	onFileComplete = () => {
		bar.tick();
	};
}

const worker = workerFarm( require.resolve( './build-worker' ) );

let complete = 0;

files.forEach( ( file ) => {
	worker( file, () => {
		onFileComplete();

		if ( ++complete === files.length ) {
			workerFarm.end( worker );
		}
	} );
} );
