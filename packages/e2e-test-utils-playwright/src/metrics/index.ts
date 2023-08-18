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
			'server-response-time': 'TTFB',
		};

		const report = await lighthouse(
			this.page.url(),
			{ port: this.port },
			{
				extends: 'lighthouse:default',
				settings: {
					// "provided" means no throttling.
					// TODO: Make configurable.
					throttlingMethod: 'provided',
					// Default is "mobile".
					// See https://github.com/GoogleChrome/lighthouse/blob/main/docs/emulation.md
					// TODO: Make configurable.
					formFactor: 'desktop',
					screenEmulation: {
						disabled: true,
					},
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

	/**
	 * CLS is only reported on visibility change.
	 * FID requires an interaction.
	 * INP requires an interaction AND a visibility change.
	 */
	async getWebVitals() {
		const metricsDefinition = {
			CLS: {
				listen: 'onCLS',
				global: 'webVitalsCLS',
				get: () => window.webVitalsCLS,
				results: [] as number[],
			},
			FCP: {
				listen: 'onFCP',
				global: 'webVitalsFCP',
				get: () => window.webVitalsFCP,
				results: [] as number[],
			},
			FID: {
				listen: 'onFID',
				global: 'webVitalsFID',
				get: () => window.webVitalsFID,
				results: [] as number[],
			},
			INP: {
				listen: 'onINP',
				global: 'webVitalsINP',
				get: () => window.webVitalsINP,
				results: [] as number[],
			},
			LCP: {
				listen: 'onLCP',
				global: 'webVitalsLCP',
				get: () => window.webVitalsLCP,
				results: [] as number[],
			},
			TTFB: {
				listen: 'onTTFB',
				global: 'webVitalsTTFB',
				get: () => window.webVitalsTTFB,
				results: [] as number[],
			},
		};

		/*
		 * Aggregate metrics are metrics which are calculated for every request as
		 * a combination of other metrics.
		 */
		const aggregateMetricsDefinition = {
			'LCP-TTFB': {
				add: [ 'LCP' ],
				subtract: [ 'TTFB' ],
			},
		};

		let scriptTag = '';
		Object.entries( metricsDefinition ).forEach( ( [ key, value ] ) => {
			scriptTag += `webVitals.${
				value.listen
			}( ( { name, delta } ) => { window.${ value.global } = ${
				key === 'CLS' ? 'delta * 1000' : 'delta'
			}; } );`;
		} );

		await this.page.addScriptTag( {
			url: 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js',
		} );

		await this.page.addScriptTag( {
			content: scriptTag,
		} );

		await Promise.all(
			Object.values( metricsDefinition ).map( async ( value ) => {
				// // Wait until global is populated.
				// await this.page.waitForFunction(
				// 	`window.${ value.global } !== undefined`
				// );

				/*
				 * Do a random click, since only that triggers certain metrics
				 * like LCP, as only a user interaction stops reporting new LCP
				 * entries. See https://web.dev/lcp/.
				 *
				 * Click off screen to prevent clicking a link by accident and navigating away.
				 */
				await this.page.click( 'body', {
					position: { x: 1, y: 1 },
				} );
				// Get the metric value from the global.
				const metric = await this.page.evaluate< number, string >(
					// @ts-ignore
					( globalVarName ) => window[ globalVarName ] as number,
					value.global
				);
				value.results.push( metric );
			} )
		);

		const metrics: Record< string, number[] > = {};
		Object.entries( metricsDefinition ).forEach( ( [ key, value ] ) => {
			if ( value.results.length ) {
				metrics[ key ] = value.results;
			}
		} );

		Object.entries( aggregateMetricsDefinition ).forEach(
			( [ key, value ] ) => {
				// Bail if any of the necessary partial metrics are not provided.
				const partialMetrics = [
					...( value.add || [] ),
					...( value.subtract || [] ),
				];
				if ( ! partialMetrics.length ) {
					return;
				}
				for ( const metricKey of partialMetrics ) {
					if ( ! metrics[ metricKey ] ) {
						return;
					}
				}

				// Initialize all values for the metric as 0.
				metrics[ key ] = [] as number[];
				const numResults = value.add
					? metrics[ value.add[ 0 ] ].length
					: metrics[ value.subtract[ 0 ] ].length;
				for ( let n = 0; n < numResults; n++ ) {
					metrics[ key ].push( 0.0 );
				}

				// Add and subtract all values.
				if ( value.add ) {
					value.add.forEach( ( metricKey ) => {
						metrics[ metricKey ].forEach(
							( metricValue, metricIndex ) => {
								metrics[ key ][ metricIndex ] += metricValue;
							}
						);
					} );
				}
				if ( value.subtract ) {
					value.subtract.forEach( ( metricKey ) => {
						metrics[ metricKey ].forEach(
							( metricValue, metricIndex ) => {
								metrics[ key ][ metricIndex ] -= metricValue;
							}
						);
					} );
				}
			}
		);

		return metrics;
	}
}
