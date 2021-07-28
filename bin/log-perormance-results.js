#!/usr/bin/env node

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const https = require( 'https' );
const [ branch, hash, baseHash, timestamp ] = process.argv.slice( 2 );

const performanceResults = JSON.parse(
	fs.readFileSync(
		path.join( __dirname, '../post-editor-performance-results.json' ),
		'utf8'
	)
);

const data = new TextEncoder().encode(
	JSON.stringify( {
		branch,
		hash,
		baseHash,
		timestamp: parseInt( timestamp, 10 ),
		metrics: performanceResults[ hash ],
		baseMetrics: performanceResults[ baseHash ],
	} )
);

const options = {
	hostname: 'codehealth-riad.vercel.app',
	port: 443,
	path: '/api/log',
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Content-Length': data.length,
	},
};

const req = https.request( options, ( res ) => {
	console.log( `statusCode: ${ res.statusCode }` );

	res.on( 'data', ( d ) => {
		process.stdout.write( d );
	} );
} );

req.on( 'error', ( error ) => {
	console.error( error );
} );

req.write( data );
req.end();
