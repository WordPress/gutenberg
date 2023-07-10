/**
 * External dependencies
 */
import path from 'path';
import type {
	Reporter,
	FullConfig,
	Suite,
	FullResult,
} from '@playwright/test/reporter';

/**
 * Internal dependencies
 */
import {
	readFile,
	average,
	median,
	formatTime,
	saveResultsFile,
} from '../utils';

export interface WPRawPerformanceResults {
	timeToFirstByte: number[];
	largestContentfulPaint: number[];
	lcpMinusTtfb: number[];
	serverResponse: number[];
	firstPaint: number[];
	domContentLoaded: number[];
	loaded: number[];
	firstContentfulPaint: number[];
	firstBlock: number[];
	type: number[];
	typeContainer: number[];
	focus: number[];
	inserterOpen: number[];
	inserterSearch: number[];
	inserterHover: number[];
	listViewOpen: number[];
}

export interface WPPerformanceResults {
	timeToFirstByte?: number;
	largestContentfulPaint?: number;
	lcpMinusTtfb?: number;
	serverResponse?: number;
	firstPaint?: number;
	domContentLoaded?: number;
	loaded?: number;
	firstContentfulPaint?: number;
	firstBlock?: number;
	type?: number;
	minType?: number;
	maxType?: number;
	typeContainer?: number;
	minTypeContainer?: number;
	maxTypeContainer?: number;
	focus?: number;
	minFocus?: number;
	maxFocus?: number;
	inserterOpen?: number;
	minInserterOpen?: number;
	maxInserterOpen?: number;
	inserterSearch?: number;
	minInserterSearch?: number;
	maxInserterSearch?: number;
	inserterHover?: number;
	minInserterHover?: number;
	maxInserterHover?: number;
	listViewOpen?: number;
	minListViewOpen?: number;
	maxListViewOpen?: number;
}

/**
 * Curate the raw performance results.
 *
 * @param {string}                  testSuite
 * @param {WPRawPerformanceResults} results
 *
 * @return {WPPerformanceResults} Curated Performance results.
 */
export function curateResults(
	testSuite: string,
	results: WPRawPerformanceResults
): WPPerformanceResults {
	let output: WPPerformanceResults;

	if ( testSuite.includes( 'front-end' ) ) {
		output = {
			timeToFirstByte: median( results.timeToFirstByte ),
			largestContentfulPaint: median( results.largestContentfulPaint ),
			lcpMinusTtfb: median( results.lcpMinusTtfb ),
		};
	} else {
		output = {
			serverResponse: average( results.serverResponse ),
			firstPaint: average( results.firstPaint ),
			domContentLoaded: average( results.domContentLoaded ),
			loaded: average( results.loaded ),
			firstContentfulPaint: average( results.firstContentfulPaint ),
			firstBlock: average( results.firstBlock ),
			type: average( results.type ),
			minType: Math.min( ...results.type ),
			maxType: Math.max( ...results.type ),
			typeContainer: average( results.typeContainer ),
			minTypeContainer: Math.min( ...results.typeContainer ),
			maxTypeContainer: Math.max( ...results.typeContainer ),
			focus: average( results.focus ),
			minFocus: Math.min( ...results.focus ),
			maxFocus: Math.max( ...results.focus ),
			inserterOpen: average( results.inserterOpen ),
			minInserterOpen: Math.min( ...results.inserterOpen ),
			maxInserterOpen: Math.max( ...results.inserterOpen ),
			inserterSearch: average( results.inserterSearch ),
			minInserterSearch: Math.min( ...results.inserterSearch ),
			maxInserterSearch: Math.max( ...results.inserterSearch ),
			inserterHover: average( results.inserterHover ),
			minInserterHover: Math.min( ...results.inserterHover ),
			maxInserterHover: Math.max( ...results.inserterHover ),
			listViewOpen: average( results.listViewOpen ),
			minListViewOpen: Math.min( ...results.listViewOpen ),
			maxListViewOpen: Math.max( ...results.listViewOpen ),
		};
	}

	return Object.fromEntries(
		Object.entries( output ).map( ( [ key, value ] ) => {
			return [ key, formatTime( value ) ];
		} )
	);
}
class PerformanceReporter implements Reporter {
	private testSuites: string[];

	constructor() {
		this.testSuites = [];
	}

	onBegin( _: FullConfig, suite: Suite ) {
		// Map suites from the reporter state instead of reading from the disk
		// to avoid including existing result files that are irrelevant to the
		// current run.
		const suites = suite.suites[ 0 ].suites; // It's where the suites are at.
		this.testSuites = suites.map( ( s ) =>
			path.basename( s.location?.file as string, '.spec.js' )
		);
	}

	onEnd( result: FullResult ) {
		if ( result.status !== 'passed' ) {
			return;
		}

		for ( const testSuite of this.testSuites ) {
			// Get raw results filepaths.
			const rawResultsPath = path.join(
				process.env.WP_ARTIFACTS_PATH as string,
				testSuite + '.performance-results.raw.json'
			);

			// Read the raw metrics.
			const rawResults = JSON.parse(
				readFile( rawResultsPath )
			) as WPRawPerformanceResults;

			// Curate the results.
			const results = curateResults( testSuite, rawResults );

			// Save curated results to file.
			saveResultsFile( testSuite, results );

			if ( ! process.env.CI ) {
				// Print the results.
				const printableResults = Object.fromEntries(
					Object.entries( results ).map( ( [ key, value ] ) => {
						return [ key, { value: `${ value } ms` } ];
					} )
				);

				// eslint-disable-next-line no-console
				console.log( `\n${ testSuite }\n` );
				// eslint-disable-next-line no-console
				console.table( printableResults );
			}
		}
	}
}

export default PerformanceReporter;
