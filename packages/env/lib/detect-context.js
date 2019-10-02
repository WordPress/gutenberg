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
const readDir = util.promisify( fs.readdir );
const finished = util.promisify( stream.finished );

module.exports = async function detectContext() {
	const context = {};

	// Race multiple file read streams against each other until
	// a plugin or theme header is found.
	const files = ( await readDir( './' ) ).filter( ( file ) => {
		const extension = path.extname( file );
		return extension === '.php' || extension === '.css';
	} );
	const streams = [];
	for ( const file of files ) {
		const fileStream = fs.createReadStream( file, 'utf8' );
		fileStream.on( 'data', ( text ) => {
			const [ , type ] = text.match( /(Plugin|Theme) Name: .*[\r\n]/ ) || [];
			if ( type ) {
				context.type = type.toLowerCase();

				// Stop the creation of new streams by mutating the iterated array. We can't `break`, because we are inside a function.
				files.splice( 0 );
				fileStream.destroy();
				streams.forEach( ( otherFileStream ) => otherFileStream.destroy() );
			}
		} );
		streams.push( fileStream );
	}
	await Promise.all(
		streams.map( ( fileStream ) => finished( fileStream ).catch( () => {} ) )
	);

	return context;
};
