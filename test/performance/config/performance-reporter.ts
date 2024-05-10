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
import { quartiles, round } from '../utils';

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

type PerformanceStats = {
	q25: number;
	q50: number;
	q75: number;
	out: number[]; // outliers
	cnt: number; // number of data points
};

export interface WPPerformanceResults {
	timeToFirstByte?: PerformanceStats;
	largestContentfulPaint?: PerformanceStats;
	lcpMinusTtfb?: PerformanceStats;
	serverResponse?: PerformanceStats;
	firstPaint?: PerformanceStats;
	domContentLoaded?: PerformanceStats;
	loaded?: PerformanceStats;
	firstContentfulPaint?: PerformanceStats;
	firstBlock?: PerformanceStats;
	type?: PerformanceStats;
	typeWithoutInspector?: PerformanceStats;
	typeWithTopToolbar?: PerformanceStats;
	typeContainer?: PerformanceStats;
	focus?: PerformanceStats;
	inserterOpen?: PerformanceStats;
	inserterSearch?: PerformanceStats;
	inserterHover?: PerformanceStats;
	loadPatterns?: PerformanceStats;
	listViewOpen?: PerformanceStats;
	navigate?: PerformanceStats;
	wpBeforeTemplate?: PerformanceStats;
	wpTemplate?: PerformanceStats;
	wpTotal?: PerformanceStats;
	wpMemoryUsage?: PerformanceStats;
	wpDbQueries?: PerformanceStats;
}

function stats( values: number[] ): PerformanceStats | undefined {
	if ( ! values || values.length === 0 ) {
		return undefined;
	}
	const { q25, q50, q75 } = quartiles( values );
	const iqr = q75 - q25;
	const out = values.filter(
		( v ) => v > q75 + 1.5 * iqr || v < q25 - 1.5 * iqr
	);
	const cnt = values.length;
	return {
		q25: round( q25 ),
		q50: round( q50 ),
		q75: round( q75 ),
		out: out.map( ( n ) => round( n ) ),
		cnt,
	};
}

/**
 * Curate the raw performance results.
 *
 * @param results Raw results.
 * @return Curated statistics for the results.
 */
export function curateResults(
	results: WPRawPerformanceResults
): WPPerformanceResults {
	const output = {
		timeToFirstByte: stats( results.timeToFirstByte ),
		largestContentfulPaint: stats( results.largestContentfulPaint ),
		lcpMinusTtfb: stats( results.lcpMinusTtfb ),
		serverResponse: stats( results.serverResponse ),
		firstPaint: stats( results.firstPaint ),
		domContentLoaded: stats( results.domContentLoaded ),
		loaded: stats( results.loaded ),
		firstContentfulPaint: stats( results.firstContentfulPaint ),
		firstBlock: stats( results.firstBlock ),
		type: stats( results.type ),
		typeWithoutInspector: stats( results.typeWithoutInspector ),
		typeWithTopToolbar: stats( results.typeWithTopToolbar ),
		typeContainer: stats( results.typeContainer ),
		focus: stats( results.focus ),
		inserterOpen: stats( results.inserterOpen ),
		inserterSearch: stats( results.inserterSearch ),
		inserterHover: stats( results.inserterHover ),
		loadPatterns: stats( results.loadPatterns ),
		listViewOpen: stats( results.listViewOpen ),
		navigate: stats( results.navigate ),
		wpBeforeTemplate: stats( results.wpBeforeTemplate ),
		wpTemplate: stats( results.wpTemplate ),
		wpTotal: stats( results.wpTotal ),
		wpMemoryUsage: stats( results.wpMemoryUsage ),
		wpDbQueries: stats( results.wpDbQueries ),
	};

	return Object.fromEntries(
		Object.entries( output )
			// Reduce the output to contain taken metrics only.
			.filter( ( [ _, value ] ) => value !== undefined )
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

			// For now, to keep back compat, save only the medians, not the full stats.
			const savedResults = Object.fromEntries(
				Object.entries( curatedResults ).map( ( [ key, value ] ) => [
					key,
					value.q50,
				] )
			);

			// Save curated results to file.
			writeFileSync(
				path.join(
					resultsPath,
					`${ resultsId }.performance-results.json`
				),
				JSON.stringify( savedResults, null, 2 )
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
				const p = value.q75 - value.q50;
				const pp = round( ( 100 * p ) / value.q50 );
				const m = value.q50 - value.q25;
				const mp = round( ( 100 * m ) / value.q50 );
				const outs =
					value.out.length > 0
						? ' [' + value.out.join( ', ' ) + ']'
						: '';
				printableResults[ key ] = {
					value: `${ value.q50 } ±${ round( p ) }/${ round(
						m
					) } ms (±${ pp }/${ mp }%)${ outs } (${ value.cnt })`,
				};
			}

			// eslint-disable-next-line no-console
			console.log( `\n${ testSuite }\n` );
			// eslint-disable-next-line no-console
			console.table( printableResults );
		}
	}
}

export default PerformanceReporter;
