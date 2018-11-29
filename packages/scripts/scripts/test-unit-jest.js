// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on( 'unhandledRejection', ( err ) => {
	throw err;
} );

/**
 * External dependencies
 */
const jest = require( 'jest' );

/**
 * Internal dependencies
 */
const {
	fromConfigRoot,
	getCliArgs,
	hasJestConfig,
} = require( '../utils' );

const args = getCliArgs();

const config = ! hasJestConfig() ?
	[ '--config', JSON.stringify( fromConfigRoot( 'jest-unit.config' ) ) ] :
	[];

jest.run( [ ...config, ...args ] );
