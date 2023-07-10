/**
 * External dependencies
 */
import path from 'path';
import { writeFileSync } from 'fs';
import type {
	Reporter,
	FullResult,
	TestCase,
	TestResult,
} from '@playwright/test/reporter';

/**
 * Internal dependencies
 */
import { average, median, formatTime } from '../utils';

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
	private results: Record< string, WPPerformanceResults >;

	constructor() {
		this.results = {};
	}

	onTestEnd( test: TestCase, result: TestResult ): void {
		for ( const attachment of result.attachments ) {
			if ( attachment.name !== 'results' ) {
				continue;
			}

			if ( ! attachment.body ) {
				throw new Error( 'Empty results attachment' );
			}

			const testSuite = path.basename( test.location.file, '.spec.js' );
			const resultsId = process.env.RESULTS_ID || testSuite;
			const resultsPath = process.env.WP_ARTIFACTS_PATH as string;
			const resultsBody = attachment.body.toString();

			// Save raw results to file.
			writeFileSync(
				path.join(
					resultsPath,
					`${ resultsId }.performance-results.raw.json`
				),
				resultsBody
			);

			const curatedResults = curateResults(
				testSuite,
				JSON.parse( resultsBody )
			);

			// Save curated results to file.
			writeFileSync(
				path.join(
					resultsPath,
					`${ resultsId }.performance-results.json`
				),
				JSON.stringify( curatedResults, null, 2 )
			);

			this.results[ testSuite ] = curatedResults;
		}
	}

	onEnd( result: FullResult ) {
		if ( result.status !== 'passed' ) {
			return;
		}

		if ( process.env.CI ) {
			return;
		}

		// Print the results.
		for ( const [ testSuite, results ] of Object.entries( this.results ) ) {
			const printableResults: Record< string, { value: string } > = {};

			for ( const [ key, value ] of Object.entries( results ) ) {
				if ( isFinite( value ) ) {
					printableResults[ key ] = { value: `${ value } ms` };
				}
			}

			// eslint-disable-next-line no-console
			console.log( `\n${ testSuite }\n` );
			// eslint-disable-next-line no-console
			console.table( printableResults );
		}
	}
}

export default PerformanceReporter;
