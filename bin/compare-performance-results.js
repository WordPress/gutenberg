#!/usr/bin/env node

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

const resultsPath = process.env.WP_ARTIFACTS_PATH;
const maxRegressionFactor = 1.1; // fail on 10% regression

fs.readdir( resultsPath, ( err, files ) => {
	if ( err ) {
		console.error( 'Error reading directory:', err );
		process.exit( 1 );
	}

	files
		.filter(
			( file ) =>
				file.endsWith( '.performance-results.json' ) &&
				! file.includes( '_round-' )
		)
		.forEach( ( file ) => {
			const data = JSON.parse(
				fs.readFileSync( path.join( resultsPath, file ), 'utf8' )
			);

			const trunkMetrics = data.trunk;
			const branchMetrics =
				data[ Object.keys( data ).find( ( key ) => key !== 'trunk' ) ];

			Object.keys( trunkMetrics ).forEach( ( metric ) => {
				const trunkValue = trunkMetrics[ metric ];
				const branchValue = branchMetrics[ metric ];

				if ( branchValue > trunkValue * maxRegressionFactor ) {
					console.error(
						`Performance regression detected in ${ metric } for ${ file }: ${ branchValue } vs ${ trunkValue } (trunk)`
					);
					process.exit( 1 );
				}
			} );
		} );

	console.log( 'No significant performance regression detected.' );
} );
