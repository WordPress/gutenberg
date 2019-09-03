// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';
process.env.JEST_PUPPETEER_CONFIG = 'packages/scripts/config/puppeteer.config.js';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on( 'unhandledRejection', ( err ) => {
	throw err;
} );

/**
 * External dependencies
 */
const Bundler = require( 'parcel-bundler' );
const { join, resolve } = require( 'path' );
// eslint-disable-next-line jest/no-jest-import
const jest = require( 'jest' );

const bundler = new Bundler(
	join( __dirname, '../packages/rich-text/setup/index.html' ),
	{
		outDir: '../packages/rich-text/setup-dist',
	}
);

bundler.on( 'buildEnd', () => {
	jest.run( [
		'--config',
		'bin/jest.config.js',
		'--rootDir',
		resolve( __dirname, '..' ),
		'--runInBand',
		...process.argv.slice( 2 ),
	] ).then( () => {
		process.exit( 0 );
	} ).catch( () => {
		process.exit( 1 );
	} );
} );

bundler.serve();
