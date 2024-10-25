/**
 * External dependencies
 */
const { command } = require( 'execa' );

/**
 * Internal dependencies
 */
const { info } = require( './log' );

module.exports = async ( { rootDirectory } ) => {
	info( '' );
	info(
		'Installing `@wordpress/scripts` package. It might take a couple of minutes...'
	);
	await command( 'npm install @wordpress/scripts --save-dev', {
		cwd: rootDirectory,
	} );

	info( '' );
	info( 'Formatting JavaScript files.' );
	await command( 'npm run format', {
		cwd: rootDirectory,
	} );

	info( '' );
	info( 'Compiling block.' );
	await command( 'npm run build', {
		cwd: rootDirectory,
	} );
};
