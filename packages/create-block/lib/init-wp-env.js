/**
 * External dependencies
 */
const { command } = require( 'execa' );
const { join } = require( 'path' );
const { writeFile } = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const { info } = require( './log' );

module.exports = async ( { rootDirectory } ) => {
	info( '' );
	info(
		'Installing `@wordpress/env` package. It might take a couple of minutes...'
	);
	await command( 'npm install @wordpress/env --save-dev', {
		cwd: rootDirectory,
	} );

	info( '' );
	info( 'Configuring `@wordpress/env`...' );
	await writeFile(
		join( rootDirectory, '.wp-env.json' ),
		JSON.stringify(
			{
				core: 'WordPress/WordPress',
				plugins: [ '.' ],
			},
			null,
			'\t'
		)
	);
};
