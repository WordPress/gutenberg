const { readFileSync, existsSync } = require( 'fs' );
const chalk = require( 'chalk' );

function average( array ) {
	return array.reduce( ( a, b ) => a + b ) / array.length;
}

function round( number, decimalPlaces = 2 ) {
	const factor = Math.pow( 10, decimalPlaces );
	return Math.round( number * factor ) / factor;
}

const title = chalk.bold;
const success = chalk.bold.green;

class PerformanceReporter {
	onRunComplete() {
		const path = __dirname + '/../specs/performance/results.json';

		if ( ! existsSync( path ) ) {
			return;
		}

		const results = readFileSync( path, 'utf8' );
		const { load, domcontentloaded, type, focus } = JSON.parse( results );

		if ( load && load.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Loading Time:' ) }
Average time to load: ${ success( round( average( load ) ) + 'ms' ) }
Average time to DOM content load: ${ success(
				round( average( domcontentloaded ) ) + 'ms'
			) }` );
		}

		if ( type && type.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Typing Performance:' ) }
Average time to type character: ${ success( round( average( type ) ) + 'ms' ) }
Slowest time to type character: ${ success(
				round( Math.max( ...type ) ) + 'ms'
			) }
Fastest time to type character: ${ success(
				round( Math.min( ...type ) ) + 'ms'
			) }` );
		}

		if ( focus && focus.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Block Selection Performance:' ) }
Average time to select a block: ${ success( round( average( focus ) ) + 'ms' ) }
Slowest time to select a block: ${ success(
				round( Math.max( ...focus ) ) + 'ms'
			) }
Fastest time to select a block: ${ success(
				round( Math.min( ...focus ) ) + 'ms'
			) }` );
		}

		// eslint-disable-next-line no-console
		console.log( '' );
	}
}

module.exports = PerformanceReporter;
