/**
 * External dependencies
 */
const { command } = require( 'execa' );
const { join } = require( 'path' );

/**
 * Internal dependencies
 */
const { info } = require( './log' );

module.exports = async ( { slug } ) => {
	const cwd = join( process.cwd(), slug );

	info( '' );
	info(
		'Installing `@wordpress/scripts` package. It might take a couple of minutes...'
	);
	await command( 'npm install @wordpress/scripts@27 --save-dev', {
		cwd,
	} );

	info( '' );
	info( 'Formatting JavaScript files.' );
	await command( 'npm run format', {
		cwd,
	} );

	info( '' );
	info( 'Compiling block.' );
	await command( 'npm run build', {
		cwd,
	} );
};
