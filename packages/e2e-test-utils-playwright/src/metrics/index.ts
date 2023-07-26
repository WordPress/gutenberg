/**
 * External dependencies
 */
import lighthouse from 'lighthouse';
import type { Page } from '@playwright/test';

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
	 * Returns time to first byte (TTFB) from PerformanceObserver.
	 */
	async getTimeToFirstByte() {
		return this.page.evaluate< number >(
			() =>
				new Promise( ( resolve ) => {
					new PerformanceObserver( ( entryList ) => {
						const [ pageNav ] = entryList.getEntriesByType(
							'navigation'
						) as PerformanceNavigationTiming[];

						resolve( pageNav.responseStart );
					} ).observe( {
						type: 'navigation',
						buffered: true,
					} );
				} )
		);
	}

	/**
	 * Returns Largest Contentful Paint (LCP) time.
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
	 * Returns Largest Contentful Paint (LCP) time.
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
			result[ acronym ] = lhr.audits[ audit ].numericValue || 0;
		}

		return result;
	}
}
