#!/usr/bin/env node

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

const resultsPath = process.env.WP_ARTIFACTS_PATH;
const maxRegressionFactor = 1.3; // fail on >30% regression
const regressedMetrics = [];

fs.readdir( resultsPath, ( err, files ) => {
	if ( err ) {
		console.error( 'Error reading directory:', err );
		process.exit( 1 );
	}
	const curatedResults = files.filter(
		( file ) =>
			file.endsWith( '.performance-results.json' ) &&
			! file.includes( '_round-' )
	);

	if ( curatedResults.length === 0 ) {
		console.error( 'No performance results found.' );
		process.exit( 1 );
	}

	curatedResults.forEach( ( file ) => {
		const data = JSON.parse(
			fs.readFileSync( path.join( resultsPath, file ), 'utf8' )
		);

		const trunkMetrics = data.trunk;
		const branchMetrics =
			data[ Object.keys( data ).find( ( key ) => key !== 'trunk' ) ];

		if ( ! trunkMetrics || ! branchMetrics ) {
			console.error( `No trunk or branch metrics found.` );
			process.exit( 1 );
		}

		Object.keys( trunkMetrics ).forEach( ( metric ) => {
			const trunkValue = trunkMetrics[ metric ];
			const branchValue = branchMetrics[ metric ];

			if ( branchValue > trunkValue * maxRegressionFactor ) {
				regressedMetrics.push( {
					file,
					metric,
					branchValue,
					trunkValue,
				} );
			}
		} );
	} );

	if ( regressedMetrics.length > 0 ) {
		console.log( 'Performance regression detected:' );
		regressedMetrics.forEach(
			( { file, metric, branchValue, trunkValue } ) => {
				const percent = (
					( ( branchValue - trunkValue ) / trunkValue ) *
					100
				).toFixed( 2 );

				console.log(
					`- In ${ file }: ${ metric } increased by ${ percent }% (from ${ trunkValue } to ${ branchValue })`
				);
			}
		);
		process.exit( 1 );
	} else {
		console.log( 'No significant performance regression detected.' );
	}
} );
