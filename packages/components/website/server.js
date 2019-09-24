const fs = require( 'fs' );
const path = require( 'path' );
const express = require( 'express' );
const app = express();
const port = 8700;

const docsDir = path.resolve( __dirname, './public/_data' );

app.get( '/_data/*', ( req, res ) => {
	const { originalUrl } = req;
	const filePath = originalUrl.replace( /\/_data\//g, '' );
	const docFile = path.join( docsDir, filePath );

	if ( ! fs.existsSync( docFile ) ) {
		return res.send( {
			message: `Could not find ${ filePath }`,
			status: 401,
		} );
	}

	const fileData = fs.readFileSync( docFile, 'utf-8' );

	return res.send( fileData );
} );

app.listen( port, () => {
	// eslint-disable-next-line no-console
	console.log( 'Started serving local data files' );
} );
