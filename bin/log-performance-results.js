#!/usr/bin/env node

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const https = require( 'https' );
const [ token, branch, hash, baseHash, timestamp ] = process.argv.slice( 2 );

const resultsFiles = [
	{
		file: 'post-editor.performance-results.json',
		metricsPrefix: '',
	},
	{
		file: 'front-end-block-theme.performance-results.json',
		metricsPrefix: 'block-theme-',
	},
	{
		file: 'front-end-classic-theme.performance-results.json',
		metricsPrefix: 'classic-theme-',
	},
];

const performanceResults = resultsFiles.map( ( { file } ) =>
	JSON.parse(
		fs.readFileSync(
			path.join( process.env.WP_ARTIFACTS_PATH, file ),
			'utf8'
		)
	)
);

const data = new TextEncoder().encode(
	JSON.stringify( {
		branch,
		hash,
		baseHash,
		timestamp,
		metrics: resultsFiles.reduce( ( result, { metricsPrefix }, index ) => {
			return {
				...result,
				...Object.fromEntries(
					Object.entries(
						performanceResults[ index ][ hash ] ?? {}
					).map( ( [ key, value ] ) => [
						metricsPrefix + key,
						value,
					] )
				),
			};
		}, {} ),
		baseMetrics: resultsFiles.reduce(
			( result, { metricsPrefix }, index ) => {
				return {
					...result,
					...Object.fromEntries(
						Object.entries(
							performanceResults[ index ][ baseHash ] ?? {}
						).map( ( [ key, value ] ) => [
							metricsPrefix + key,
							value,
						] )
					),
				};
			},
			{}
		),
	} )
);

const options = {
	hostname: 'codehealth.vercel.app',
	port: 443,
	path: '/api/log?token=' + token,
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
