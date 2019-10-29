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

/**
 * @typedef Context
 * @type {Object}
 * @property {string} type
 * @property {string} path
 * @property {string} pathBasename
 */

/**
 * Detects the context of a given path.
 *
 * @param {string} [directoryPath=process.cwd()] The directory to detect. Should point to a directory, defaulting to the current working directory.
 *
 * @return {Context} The context of the directory. If a theme or plugin, the type property will contain 'theme' or 'plugin'.
 */
module.exports = async function detectContext( directoryPath = process.cwd() ) {
	const context = {};

	// Use absolute paths to files so that we can properly read
	// dependencies not in the current working directory.
	const absPath = path.resolve( directoryPath );

	// Race multiple file read streams against each other until
	// a plugin or theme header is found.
	const files = ( await readDir( absPath ) ).filter(
		( file ) => path.extname( file ) === '.php' || path.basename( file ) === 'style.css'
	).map( ( fileName ) => path.join( absPath, fileName ) );

	const streams = [];
	for ( const file of files ) {
		const fileStream = fs.createReadStream( file, 'utf8' );
		fileStream.on( 'data', ( text ) => {
			const [ , type ] = text.match( /(Plugin|Theme) Name: .*[\r\n]/ ) || [];
			if ( type ) {
				context.type = type.toLowerCase();
				context.path = absPath;
				context.pathBasename = path.basename( absPath );

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
