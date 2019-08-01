const { readFileSync, existsSync } = require( 'fs' );

function average( array ) {
	return array.reduce( ( a, b ) => a + b ) / array.length;
}

class PerformanceReporter {
	onRunComplete() {
		const path = __dirname + '/../specs/results.json';

		if ( ! existsSync( path ) ) {
			return;
		}

		const results = readFileSync( path, 'utf8' );
		const { load, domcontentloaded, type } = JSON.parse( results );

		// eslint-disable-next-line no-console
		console.log( `
Average time to load: ${ average( load ) }ms
Average time to DOM content load: ${ average( domcontentloaded ) }ms
Average time to type character: ${ average( type ) }ms
Slowest time to type character: ${ Math.max( ...type ) }ms
Fastest time to type character: ${ Math.min( ...type ) }ms
		` );
	}
}

module.exports = PerformanceReporter;
