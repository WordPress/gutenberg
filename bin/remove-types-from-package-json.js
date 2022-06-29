/**
 * External dependencies
 */
const fs = require( 'fs' );
const zlib = require( 'zlib' );
const tar = require( 'tar-stream' );

const tarballPath = fs
	.readdirSync( process.cwd() )
	.find( ( file ) => file.endsWith( '.tar.gz' ) );
const tmpUpdatedTarballPath = 'tmp-' + tarballPath;

const extract = tar.extract();
fs.createReadStream( tarballPath ).pipe( zlib.createGunzip() ).pipe( extract );

const newTarball = fs.createWriteStream( tmpUpdatedTarballPath );

const pack = tar.pack();
pack.pipe( newTarball );

extract.on( 'entry', function ( header, stream, next ) {
	let data = '';
	stream.on( 'data', function ( chunk ) {
		data += chunk;
	} );

	stream.on( 'end', function () {
		if ( header.name === 'package.json' ) {
			const parsed = JSON.parse( data );
			delete parsed.types;
			data = JSON.stringify( parsed );
		}
		pack.entry( { ...header, size: data.length }, data );
		next(); // ready for next entry
	} );

	stream.resume(); // just auto drain the stream
} );

extract.on( 'finish', function () {
	// all entries done - lets finalize it
	pack.finalize();
} );

newTarball.on( 'close', function () {
	console.log( tarballPath + ' has been written' );
	fs.stat( tarballPath, function ( err, stats ) {
		if ( err ) throw err;
		console.log( stats );
		console.log( 'Got file info successfully!' );
	} );
	fs.moveSync( tmpUpdatedTarballPath, tarballPath, { overwrite: true } );
} );
