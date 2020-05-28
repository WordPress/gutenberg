/**
 * External dependencies
 */
const { command } = require( 'execa' );
const { isEmpty, omitBy } = require( 'lodash' );
const { join } = require( 'path' );
const writePkg = require( 'write-pkg' );

/**
 * Internal dependencies
 */
const { info } = require( './log' );

module.exports = async ( { author, description, license, slug, version } ) => {
	const cwd = join( process.cwd(), slug );

	info( '' );
	info( 'Creating a "package.json" file.' );
	await writePkg(
		cwd,
		omitBy(
			{
				name: slug,
				version,
				description,
				author,
				license,
				main: 'build/index.js',
				scripts: {
					build: 'wp-scripts build',
					'format:js': 'wp-scripts format-js',
					'lint:css': 'wp-scripts lint-style',
					'lint:js': 'wp-scripts lint-js',
					start: 'wp-scripts start',
					'packages-update': 'wp-scripts packages-update',
				},
			},
			isEmpty
		)
	);

	info( '' );
	info( 'Installing packages. It might take a couple of minutes.' );
	await command( 'npm install @wordpress/scripts --save-dev', {
		cwd,
	} );

	info( '' );
	info( 'Formatting JavaScript files.' );
	await command( 'npm run format:js', {
		cwd,
	} );

	info( '' );
	info( 'Compiling block.' );
	await command( 'npm run build', {
		cwd,
	} );
};
