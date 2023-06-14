/**
 * External dependencies
 */
import path from 'path';
import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import type { Reporter, TestCase } from '@playwright/test/reporter';

/**
 * Internal dependencies
 */
import { average, round } from '../utils';

const title = chalk.bold;
const success = chalk.bold.green;

class PerformanceReporter implements Reporter {
	onTestEnd( test: TestCase ) {
		const basename = path.basename( test.location.file, '.js' );
		const filepath = path.join(
			process.env.WP_ARTIFACTS_PATH as string,
			basename + '.performance-results.json'
		);

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
${ title( 'Typing:' ) }
Average time to type character: ${ success( round( average( type ) ) + 'ms' ) }
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
Average time to type within a container: ${ success(
				round( average( typeContainer ) ) + 'ms'
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
Average time to select a block: ${ success( round( average( focus ) ) + 'ms' ) }
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
Average time to open list view: ${ success(
				round( average( listViewOpen ) ) + 'ms'
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

		if ( inserterSearch && inserterSearch.length ) {
			// eslint-disable-next-line no-console
			console.log( `
${ title( 'Inserter Search:' ) }
Average time to type the inserter search input: ${ success(
				round( average( inserterSearch ) ) + 'ms'
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

export default PerformanceReporter;
