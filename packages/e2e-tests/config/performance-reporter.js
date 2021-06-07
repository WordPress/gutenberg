/**
 * External dependencies
 */
const { readFileSync, existsSync } = require( 'fs' );
const path = require( 'path' );
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
	onTestResult( test ) {
		const dirname = path.dirname( test.path );
		const basename = path.basename( test.path, '.js' );
		const filepath = path.join( dirname, basename + '.results.json' );

		if ( ! existsSync( filepath ) ) {
			return;
		}

		const results = readFileSync( filepath, 'utf8' );
		const {
			serverResponse,
			firstPaint,
			domContentLoaded,
			loaded,
			firstContentfulPaint,
			firstBlock,
			type,
			focus,
			inserterOpen,
			inserterHover,
		} = JSON.parse( results );

		if ( serverResponse && serverResponse.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Loading Time:' ) }
Average time to server response (subtracted from client side metrics): ${ success(
				round( average( serverResponse ) ) + 'ms'
			) }
Average time to first paint: ${ success(
				round( average( firstPaint ) ) + 'ms'
			) }
Average time to DOM content load: ${ success(
				round( average( domContentLoaded ) ) + 'ms'
			) }
Average time to load: ${ success( round( average( loaded ) ) + 'ms' ) }
Average time to first contentful paint: ${ success(
				round( average( firstContentfulPaint ) ) + 'ms'
			) }
Average time to first block: ${ success(
				round( average( firstBlock ) ) + 'ms'
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

		if ( inserterOpen && inserterOpen.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Opening Global Inserter Performance:' ) }
Average time to open global inserter: ${ success(
				round( average( inserterOpen ) ) + 'ms'
			) }
Slowest time to open global inserter: ${ success(
				round( Math.max( ...inserterOpen ) ) + 'ms'
			) }
Fastest time to open global inserter: ${ success(
				round( Math.min( ...inserterOpen ) ) + 'ms'
			) }` );
		}

		if ( inserterHover && inserterHover.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Inserter Block Item Hover Performance:' ) }
Average time to move mouse between two block item in the inserter: ${ success(
				round( average( inserterHover ) ) + 'ms'
			) }
Slowest time to move mouse between two block item in the inserter: ${ success(
				round( Math.max( ...inserterHover ) ) + 'ms'
			) }
Fastest time to move mouse between two block item in the inserter: ${ success(
				round( Math.min( ...inserterHover ) ) + 'ms'
			) }` );
		}

		// eslint-disable-next-line no-console
		console.log( '' );
	}
}

module.exports = PerformanceReporter;
