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
import { average, median, minimum, maximum, round } from '../utils';

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
	typeWithoutInspector?: number;
	typeWithTopToolbar?: number;
	typeContainer?: number;
	focus?: number;
	inserterOpen?: number;
	inserterSearch?: number;
	inserterHover?: number;
	loadPatterns?: number;
	listViewOpen?: number;
	navigate?: number;
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
		timeToFirstByte: median( results.timeToFirstByte ),
		largestContentfulPaint: median( results.largestContentfulPaint ),
		lcpMinusTtfb: median( results.lcpMinusTtfb ),
		serverResponse: median( results.serverResponse ),
		firstPaint: median( results.firstPaint ),
		domContentLoaded: median( results.domContentLoaded ),
		loaded: median( results.loaded ),
		firstContentfulPaint: median( results.firstContentfulPaint ),
		firstBlock: median( results.firstBlock ),
		type: average( results.type ),
		typeWithoutInspector: average( results.typeWithoutInspector ),
		typeWithTopToolbar: average( results.typeWithTopToolbar ),
		typeContainer: average( results.typeContainer ),
		focus: average( results.focus ),
		inserterOpen: average( results.inserterOpen ),
		inserterSearch: average( results.inserterSearch ),
		inserterHover: average( results.inserterHover ),
		loadPatterns: average( results.loadPatterns ),
		listViewOpen: average( results.listViewOpen ),
		navigate: median( results.navigate ),
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
