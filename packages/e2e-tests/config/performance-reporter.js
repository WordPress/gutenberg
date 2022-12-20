/**
 * External dependencies
 */
const { readFileSync, existsSync } = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );

function round( number, decimalPlaces = 2 ) {
	const factor = Math.pow( 10, decimalPlaces );
	return Math.round( number * factor ) / factor;
}

/**
 * Computes the median number from an array numbers.
 *
 * @param {number[]} array
 *
 * @return {number} Median.
 */
function median( array ) {
	const mid = Math.floor( array.length / 2 ),
		numbers = [ ...array ].sort( ( a, b ) => a - b );
	return array.length % 2 !== 0
		? numbers[ mid ]
		: ( numbers[ mid - 1 ] + numbers[ mid ] ) / 2;
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
			typeContainer,
			focus,
			listViewOpen,
			inserterOpen,
			inserterHover,
			inserterSearch,
		} = JSON.parse( results );

		if ( serverResponse && serverResponse.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Loading Time:' ) }
Median time to server response (subtracted from client side metrics): ${ success(
				round( median( serverResponse ) ) + 'ms'
			) }
Median time to first paint: ${ success( round( median( firstPaint ) ) + 'ms' ) }
Median time to DOM content load: ${ success(
				round( median( domContentLoaded ) ) + 'ms'
			) }
Median time to load: ${ success( round( median( loaded ) ) + 'ms' ) }
Median time to first contentful paint: ${ success(
				round( median( firstContentfulPaint ) ) + 'ms'
			) }
Median time to first block: ${ success(
				round( median( firstBlock ) ) + 'ms'
			) }` );
		}

		if ( type && type.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Typing:' ) }
Median time to type character: ${ success( round( median( type ) ) + 'ms' ) }
Slowest time to type character: ${ success(
				round( Math.max( ...type ) ) + 'ms'
			) }
Fastest time to type character: ${ success(
				round( Math.min( ...type ) ) + 'ms'
			) }` );
		}

		if ( typeContainer && typeContainer.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Typing within a container:' ) }
Median time to type within a container: ${ success(
				round( median( typeContainer ) ) + 'ms'
			) }
Slowest time to type within a container: ${ success(
				round( Math.max( ...typeContainer ) ) + 'ms'
			) }
Fastest time to type within a container: ${ success(
				round( Math.min( ...typeContainer ) ) + 'ms'
			) }` );
		}

		if ( focus && focus.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Block Selection:' ) }
Median time to select a block: ${ success( round( median( focus ) ) + 'ms' ) }
Slowest time to select a block: ${ success(
				round( Math.max( ...focus ) ) + 'ms'
			) }
Fastest time to select a block: ${ success(
				round( Math.min( ...focus ) ) + 'ms'
			) }` );
		}

		if ( listViewOpen && listViewOpen.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Opening List View:' ) }
Median time to open list view: ${ success(
				round( median( listViewOpen ) ) + 'ms'
			) }
Slowest time to open list view: ${ success(
				round( Math.max( ...listViewOpen ) ) + 'ms'
			) }
Fastest time to open list view: ${ success(
				round( Math.min( ...listViewOpen ) ) + 'ms'
			) }` );
		}

		if ( inserterOpen && inserterOpen.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Opening Global Inserter:' ) }
Median time to open global inserter: ${ success(
				round( median( inserterOpen ) ) + 'ms'
			) }
Slowest time to open global inserter: ${ success(
				round( Math.max( ...inserterOpen ) ) + 'ms'
			) }
Fastest time to open global inserter: ${ success(
				round( Math.min( ...inserterOpen ) ) + 'ms'
			) }` );
		}

		if ( inserterSearch && inserterSearch.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Inserter Search:' ) }
Median time to type the inserter search input: ${ success(
				round( median( inserterSearch ) ) + 'ms'
			) }
Slowest time to type the inserter search input: ${ success(
				round( Math.max( ...inserterSearch ) ) + 'ms'
			) }
Fastest time to type the inserter search input: ${ success(
				round( Math.min( ...inserterSearch ) ) + 'ms'
			) }` );
		}

		if ( inserterHover && inserterHover.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Inserter Block Item Hover:' ) }
Median time to move mouse between two block item in the inserter: ${ success(
				round( median( inserterHover ) ) + 'ms'
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
