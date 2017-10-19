/* eslint-disable no-console */
// Turn various warnings into errors
console._errorOriginal = console.error;
console.error = ( ...args ) => {
	const util = require( 'util' );
	throw new Error(
		'Warning caught via console.error: ' +
		util.format.apply( util, args )
	);
};
