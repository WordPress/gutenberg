#!/usr/bin/env node

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const [ token, branch, hash, baseHash, timestamp ] = process.argv.slice( 2 );

const resultsFiles = [
	{
		file: 'post-editor.performance-results.json',
		metricsPrefix: '',
	},
	{
		file: 'site-editor.performance-results.json',
		metricsPrefix: 'site-editor-',
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

const data = JSON.stringify( {
	branch,
	hash,
	baseHash,
	timestamp,
	metrics: resultsFiles.reduce( ( result, { metricsPrefix }, index ) => {
		return {
			...result,
			...Object.fromEntries(
				Object.entries( performanceResults[ index ][ hash ] ?? {} ).map(
					( [ key, value ] ) => [
						metricsPrefix + key,
						typeof value === 'object' ? value.q50 : value,
					]
				)
			),
		};
	}, {} ),
	baseMetrics: resultsFiles.reduce( ( result, { metricsPrefix }, index ) => {
		return {
			...result,
			...Object.fromEntries(
				Object.entries(
					performanceResults[ index ][ baseHash ] ?? {}
				).map( ( [ key, value ] ) => [
					metricsPrefix + key,
					typeof value === 'object' ? value.q50 : value,
				] )
			),
		};
	}, {} ),
} );

fetch( 'https://codevitals.run/api/log?token=' + token, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: data,
} )
	.then( async ( response ) => {
		console.log( `statusCode: ${ response.status }` );
		const text = await response.text();
		if ( text ) {
			console.log( text );
		}
	} )
	.catch( ( error ) => {
		console.error( error );
	} );
