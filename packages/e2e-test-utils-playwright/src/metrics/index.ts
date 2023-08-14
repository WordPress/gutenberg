/**
 * External dependencies
 */
import type { Page } from '@playwright/test';
import * as lighthouse from 'lighthouse/core/index.cjs';

export class Metrics {
	constructor( public readonly page: Page, public readonly port: number ) {
		this.page = page;
		this.port = port;
	}

	/**
	 * Returns durations from the Server-Timing header.
	 *
	 * @param fields Optional fields to filter.
	 */
	async getServerTiming( fields: string[] = [] ) {
		return this.page.evaluate< Record< string, number >, string[] >(
			( f: string[] ) =>
				(
					performance.getEntriesByType(
						'navigation'
					) as PerformanceNavigationTiming[]
				 )[ 0 ].serverTiming.reduce( ( acc, entry ) => {
					if ( f.length === 0 || f.includes( entry.name ) ) {
						acc[ entry.name ] = entry.duration;
					}
					return acc;
				}, {} as Record< string, number > ),
			fields
		);
	}

	/**
	 * Returns time to first byte (TTFB) using the Navigation Timing API.
	 *
	 * @see https://web.dev/ttfb/#measure-ttfb-in-javascript
	 *
	 * @return {Promise<number>} TTFB value.
	 */
	async getTimeToFirstByte() {
		return this.page.evaluate< number >( () => {
			const { responseStart, startTime } = (
				performance.getEntriesByType(
					'navigation'
				) as PerformanceNavigationTiming[]
			 )[ 0 ];
			return responseStart - startTime;
		} );
	}

	/**
	 * Returns the Largest Contentful Paint (LCP) value using the dedicated API.
	 *
	 * @see https://w3c.github.io/largest-contentful-paint/
	 * @see https://web.dev/lcp/#measure-lcp-in-javascript
	 *
	 * @return {Promise<number>} LCP value.
	 */
	async getLargestContentfulPaint() {
		return this.page.evaluate< number >(
			() =>
				new Promise( ( resolve ) => {
					new PerformanceObserver( ( entryList ) => {
						const entries = entryList.getEntries();
						// The last entry is the largest contentful paint.
						const largestPaintEntry = entries.at( -1 );

						resolve( largestPaintEntry?.startTime || 0 );
					} ).observe( {
						type: 'largest-contentful-paint',
						buffered: true,
					} );
				} )
		);
	}

	/**
	 * Returns the Cumulative Layout Shift (CLS) value using the dedicated API.
	 *
	 * @see https://github.com/WICG/layout-instability
	 * @see https://web.dev/cls/#measure-layout-shifts-in-javascript
	 *
	 * @return {Promise<number>} CLS value.
	 */
	async getCumulativeLayoutShift() {
		return this.page.evaluate< number >(
			() =>
				new Promise( ( resolve ) => {
					let CLS = 0;

					new PerformanceObserver( ( l ) => {
						const entries = l.getEntries() as LayoutShift[];

						entries.forEach( ( entry ) => {
							if ( ! entry.hadRecentInput ) {
								CLS += entry.value;
							}
						} );

						resolve( CLS );
					} ).observe( {
						type: 'layout-shift',
						buffered: true,
					} );
				} )
		);
	}

	/**
	 * Returns the Lighthouse report for the current URL.
	 *
	 * Runs several Lighthouse audits in a separate browser window and returns
	 * the summary.
	 */
	async getLighthouseReport() {
		// From https://github.com/GoogleChrome/lighthouse/blob/d149e9c1b628d5881ca9ca451278d99ff1b31d9a/core/config/default-config.js#L433-L503
		const audits = {
			'largest-contentful-paint': 'LCP',
			'total-blocking-time': 'TBT',
			interactive: 'TTI',
			'cumulative-layout-shift': 'CLS',
			'experimental-interaction-to-next-paint': 'INP',
		};

		const report = await lighthouse(
			this.page.url(),
			{ port: this.port },
			{
				extends: 'lighthouse:default',
				settings: {
					// Only run certain audits to speed things up.
					onlyAudits: Object.keys( audits ),
				},
			}
		);

		const result: Record< string, number > = {};

		if ( ! report ) {
			return result;
		}

		const { lhr } = report;

		for ( const [ audit, acronym ] of Object.entries( audits ) ) {
			result[ acronym ] = lhr.audits[ audit ]?.numericValue || 0;
		}

		return result;
	}
}
