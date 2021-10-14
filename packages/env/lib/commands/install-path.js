/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { readConfig } = require( '../config' );

module.exports = async function installPath() {
	const { workDirectoryPath } = await readConfig(
		path.resolve( '.wp-env.json' )
	);
	console.log( workDirectoryPath );
};
