const { readFileSync, existsSync } = require( 'fs' );

function average( array ) {
	return array.reduce( ( a, b ) => a + b ) / array.length;
}

function round( number, decimalPlaces = 2 ) {
	const factor = Math.pow( 10, decimalPlaces );
	return Math.round( number * factor ) / factor;
}

class PerformanceReporter {
	onRunComplete() {
		const path = __dirname + '/../specs/performance/results.json';

		if ( ! existsSync( path ) ) {
			return;
		}

		const results = readFileSync( path, 'utf8' );
		const { load, domcontentloaded, type } = JSON.parse( results );

		// eslint-disable-next-line no-console
		console.log( `
Average time to load: ${ round( average( load ) ) }ms
Average time to DOM content load: ${ round( average( domcontentloaded ) ) }ms
Average time to type character: ${ round( average( type ) ) }ms
Slowest time to type character: ${ round( Math.max( ...type ) ) }ms
Fastest time to type character: ${ round( Math.min( ...type ) ) }ms
		` );
	}
}

module.exports = PerformanceReporter;
