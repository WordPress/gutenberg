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
import { average, median, variance, round } from '../utils';

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
	typeWithoutInspector: number[];
	typeWithTopToolbar: number[];
	typeContainer: number[];
	focus: number[];
	inserterOpen: number[];
	inserterSearch: number[];
	inserterHover: number[];
	loadPatterns: number[];
	listViewOpen: number[];
	navigate: number[];
	wpBeforeTemplate: number[];
	wpTemplate: number[];
	wpTotal: number[];
	wpMemoryUsage: number[];
	wpDbQueries: number[];
}

export interface WPPerformanceResults {
	timeToFirstByte?: number;
	timeToFirstByteV?: number;
	largestContentfulPaint?: number;
	largestContentfulPaintV?: number;
	lcpMinusTtfb?: number;
	lcpMinusTtfbV?: number;
	serverResponse?: number;
	serverResponseV?: number;
	firstPaint?: number;
	firstPaintV?: number;
	domContentLoaded?: number;
	domContentLoadedV?: number;
	loaded?: number;
	loadedV?: number;
	firstContentfulPaint?: number;
	firstContentfulPaintV?: number;
	firstBlock?: number;
	firstBlockV?: number;
	type?: number;
	typeV?: number;
	typeWithoutInspector?: number;
	typeWithoutInspectorV?: number;
	typeWithTopToolbar?: number;
	typeWithTopToolbarV?: number;
	typeContainer?: number;
	typeContainerV?: number;
	focus?: number;
	focusV?: number;
	inserterOpen?: number;
	inserterOpenV?: number;
	inserterSearch?: number;
	inserterSearchV?: number;
	inserterHover?: number;
	inserterHoverV?: number;
	loadPatterns?: number;
	loadPatternsV?: number;
	listViewOpen?: number;
	listViewOpenV?: number;
	navigate?: number;
	wpBeforeTemplate?: number;
	wpTemplate?: number;
	wpTotal?: number;
	wpMemoryUsage?: number;
	wpDbQueries?: number;
}

/**
 * Curate the raw performance results.
 *
 * @param {WPRawPerformanceResults} results
 *
 * @return {WPPerformanceResults} Curated Performance results.
 */
export function curateResults(
	results: WPRawPerformanceResults
): WPPerformanceResults {
	const output = {
		timeToFirstByte: average( results.timeToFirstByte ),
		timeToFirstByteV: variance( results.timeToFirstByte ),
		largestContentfulPaint: average( results.largestContentfulPaint ),
		largestContentfulPaintV: variance( results.largestContentfulPaint ),
		lcpMinusTtfb: average( results.lcpMinusTtfb ),
		lcpMinusTtfbV: variance( results.lcpMinusTtfb ),
		serverResponse: average( results.serverResponse ),
		serverResponseV: variance( results.serverResponse ),
		firstPaint: average( results.firstPaint ),
		firstPaintV: variance( results.firstPaint ),
		domContentLoaded: average( results.domContentLoaded ),
		domContentLoadedV: variance( results.domContentLoaded ),
		loaded: average( results.loaded ),
		loadedV: variance( results.loaded ),
		firstContentfulPaint: average( results.firstContentfulPaint ),
		firstContentfulPaintV: variance( results.firstContentfulPaint ),
		firstBlock: average( results.firstBlock ),
		firstBlockV: variance( results.firstBlock ),
		type: average( results.type ),
		typeV: variance( results.type ),
		typeWithoutInspector: average( results.typeWithoutInspector ),
		typeWithoutInspectorV: variance( results.typeWithoutInspector ),
		typeWithTopToolbar: average( results.typeWithTopToolbar ),
		typeWithTopToolbarV: variance( results.typeWithTopToolbar ),
		typeContainer: average( results.typeContainer ),
		typeContainerV: variance( results.typeContainer ),
		focus: average( results.focus ),
		focusV: variance( results.focus ),
		inserterOpen: average( results.inserterOpen ),
		inserterOpenV: variance( results.inserterOpen ),
		inserterSearch: average( results.inserterSearch ),
		inserterSearchV: variance( results.inserterSearch ),
		inserterHover: average( results.inserterHover ),
		inserterHoverV: variance( results.inserterHover ),
		loadPatterns: average( results.loadPatterns ),
		loadPatternsV: variance( results.loadPatterns ),
		listViewOpen: average( results.listViewOpen ),
		navigate: median( results.navigate ),
		wpBeforeTemplate: median( results.wpBeforeTemplate ),
		wpTemplate: median( results.wpTemplate ),
		wpTotal: median( results.wpTotal ),
		wpMemoryUsage: median( results.wpMemoryUsage ),
		wpDbQueries: median( results.wpDbQueries ),
	};

	return (
		Object.entries( output )
			// Reduce the output to contain taken metrics only.
			.filter( ( [ _, value ] ) => typeof value === 'number' )
			.reduce(
				( acc, [ key, value ] ) => ( {
					...acc,
					[ key ]: round( value ),
				} ),
				{}
			)
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

			const curatedResults = curateResults( JSON.parse( resultsBody ) );

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
				printableResults[ key ] = { value: `${ value } ms` };
			}

			// eslint-disable-next-line no-console
			console.log( `\n${ testSuite }\n` );
			// eslint-disable-next-line no-console
			console.table( printableResults );
		}
	}
}

export default PerformanceReporter;
