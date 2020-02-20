/**
 * External dependencies
 */
const { command } = require( 'execa' );
const { join } = require( 'path' );
const writePkg = require( 'write-pkg' );

/**
 * Internal dependencies
 */
const { info } = require( './log' );

module.exports = async function( {
	author,
	description,
	license,
	slug,
	version,
} ) {
	const cwd = join( process.cwd(), slug );

	info( '' );
	info( 'Creating a "package.json" file.' );
	await writePkg( cwd, {
		name: slug,
		version,
		description,
		author,
		license,
		main: 'build/index.js',
		scripts: {
			build: 'wp-scripts build',
			'lint:css': 'wp-scripts lint-style',
			'lint:js': 'wp-scripts lint-js',
			start: 'wp-scripts start',
			'packages-update': 'wp-scripts packages-update',
		},
	} );

	info( '' );
	info( 'Installing packages. It might take a couple of minutes.' );
	await command( 'npm install @wordpress/scripts --save-dev', {
		cwd,
	} );

	info( '' );
	info( 'Compiling block.' );
	await command( 'npm run build', {
		cwd,
	} );
};
