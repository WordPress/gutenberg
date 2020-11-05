'use strict';
/**
 * External dependencies
 */
const util = require( 'util' );
const fs = require( 'fs' );
const stream = require( 'stream' );
const path = require( 'path' );

/**
 * Promisified dependencies
 */
const exists = util.promisify( fs.exists );
const readDir = util.promisify( fs.readdir );
const finished = util.promisify( stream.finished );

/**
 * Detects whether the given directory is a WordPress installation, a plugin or a theme.
 *
 * @param {string} directoryPath The directory to detect.
 * @return {string|null} 'core' if the directory is a WordPress installation, 'plugin' if it is a plugin, 'theme' if it is a theme, or null if we can't tell.
 */
module.exports = async function detectDirectoryType( directoryPath ) {
	// If we have a `wp-includes/version.php` file, then this is a Core install.
	if (
		await exists(
			path.resolve( directoryPath, 'wp-includes', 'version.php' )
		)
	) {
		return 'core';
	}

	let result = null;

	// Use absolute paths to files so that we can properly read
	// dependencies not in the current working directory.
	const absolutePath = path.resolve( directoryPath );

	// Race multiple file read streams against each other until
	// a plugin or theme header is found.
	const files = ( await readDir( absolutePath ) )
		.filter(
			( file ) =>
				path.extname( file ) === '.php' ||
				path.basename( file ) === 'style.css'
		)
		.map( ( fileName ) => path.join( absolutePath, fileName ) );

	const streams = [];
	for ( const file of files ) {
		const fileStream = fs.createReadStream( file, 'utf8' );
		fileStream.on( 'data', ( text ) => {
			const [ , type ] =
				text.match( /(Plugin|Theme) Name: .*[\r\n]/ ) || [];
			if ( type ) {
				result = type.toLowerCase();

				// Stop the creation of new streams by mutating the iterated
				// array. We can't `break`, because we are inside a function.
				files.splice( 0 );
				fileStream.destroy();
				streams.forEach( ( otherFileStream ) =>
					otherFileStream.destroy()
				);
			}
		} );
		streams.push( fileStream );
	}
	await Promise.all(
		streams.map( ( fileStream ) =>
			finished( fileStream ).catch( () => {} )
		)
	);

	return result;
};
