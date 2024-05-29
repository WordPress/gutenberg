/**
 * Internal dependencies
 */
const { start } = require( './appium-local.js' );

start( { flags: '--allow-cors' } ).then(
	() => {
		// eslint-disable-next-line no-console
		console.log( 'INFO: Appium server started successfully' );
	},
	( error ) => {
		// eslint-disable-next-line no-console
		console.error( error );
		process.exit( 1 );
	}
);
