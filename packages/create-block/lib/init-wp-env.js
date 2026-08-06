/**
 * External dependencies
 */
const { join } = require( 'path' );
const { writeFile } = require( 'fs' ).promises;

/**
 * Internal dependencies
 */
const { info } = require( './log' );

module.exports = async ( { rootDirectory } ) => {
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
