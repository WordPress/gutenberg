// A script for testing the performance of the watch task.
// 1. Run the watch command using the inspect option - `node --inspect ./bin/packages/watch.js.`
//   ( Requires a node.js debugger. )
// 2. Run this script in a separate terminal `node ./bin/packages/test/test-watch.js`
// 3. Inspect the performance in a debugger.

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );

const NUM_FILES_TO_WRITE = 1000;
const TEST_PACKAGE_DIR = '../../../packages/__DEMO_PACKAGE__';
const TEST_FILENAME_PREFIX = 'demo_';
const TIMEOUT_DELAY = 10000;
const TEST_PACKAGE_JSON = JSON.stringify( {
	name: 'demo_package',
	version: '0.0.1',
	module: 'build-module/index.js',
} );

const packageDirectory = path.resolve( __dirname, TEST_PACKAGE_DIR );
const srcDirectory = path.resolve( packageDirectory, 'src' );

console.log( chalk.green( '- Creating test package: ' ), packageDirectory );
fs.mkdirSync( srcDirectory, { recursive: true } );
fs.appendFileSync(
	path.resolve( packageDirectory, 'package.json' ),
	TEST_PACKAGE_JSON
);

console.log( chalk.green( `- Creating ${ NUM_FILES_TO_WRITE } src files` ) );
for ( let i = 0; i < NUM_FILES_TO_WRITE; i++ ) {
	const filePath = path.resolve(
		srcDirectory,
		`${ TEST_FILENAME_PREFIX }${ i }.js`
	);
	fs.appendFileSync( filePath, `console.log( 'hello ${ i }' );` );
}

// Delay using a timeout, otherwise watch isn't quick enough to pick up
// the creation of the files.
setTimeout( () => {
	console.log(
		chalk.green( `- Deleting ${ NUM_FILES_TO_WRITE } src files` )
	);
	for ( let i = NUM_FILES_TO_WRITE - 1; i >= 0; i-- ) {
		const filePath = path.resolve(
			srcDirectory,
			`${ TEST_FILENAME_PREFIX }${ i }.js`
		);
		fs.rmSync( filePath );
	}
}, TIMEOUT_DELAY );

setTimeout( () => {
	console.log(
		chalk.green( '- Deleting test package directory: ' ),
		packageDirectory
	);
	fs.rmdirSync( packageDirectory, { recursive: true } );
}, TIMEOUT_DELAY * 2 );
