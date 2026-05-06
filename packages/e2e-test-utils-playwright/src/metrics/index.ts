/**
 * External dependencies
 */
import { access, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { test, type Page, type Browser } from '@playwright/test';
// resolution-mode support in TypeScript 5.3 will resolve this.
// See https://devblogs.microsoft.com/typescript/announcing-typescript-5-3-beta/
// @ts-expect-error
import type { Metric } from 'web-vitals';

/**
 * Internal dependencies
 */
import { resolveTraceSourceMaps } from './resolve-trace-source-maps';

type EventType =
	| 'click'
	| 'focus'
	| 'focusin'
	| 'keydown'
	| 'keypress'
	| 'keyup'
	| 'mouseout'
	| 'mouseover';

interface TraceEvent {
	cat: string;
	name: string;
	dur?: number;
	args: {
		data?: {
			type: EventType;
		};
	};
}

interface Trace {
	traceEvents: TraceEvent[];
}

type MetricsConstructorProps = {
	page: Page;
};

interface WebVitalsMeasurements {
	CLS?: number;
	FCP?: number;
	FID?: number;
	INP?: number;
	LCP?: number;
	TTFB?: number;
}

export class Metrics {
	browser: Browser;
	page: Page;
	trace: Trace;

	webVitals: WebVitalsMeasurements = {};

	constructor( { page }: MetricsConstructorProps ) {
		this.page = page;
		this.browser = page.context().browser()!;
		this.trace = { traceEvents: [] };
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
				 )[ 0 ].serverTiming.reduce(
					( acc, entry ) => {
						if ( f.length === 0 || f.includes( entry.name ) ) {
							acc[ entry.name ] = entry.duration;
						}
						return acc;
					},
					{} as Record< string, number >
				),
			fields
		);
	}

	/**
	 * Returns time to first byte (TTFB) using the Navigation Timing API.
	 *
	 * @see https://web.dev/ttfb/#measure-ttfb-in-javascript
	 *
	 * @return TTFB value.
	 */
	async getTimeToFirstByte() {
		return await this.page.evaluate< number >( () => {
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
	 * @return LCP value.
	 */
	async getLargestContentfulPaint() {
		return await this.page.evaluate< number >(
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
	 * @return CLS value.
	 */
	async getCumulativeLayoutShift() {
		return await this.page.evaluate< number >(
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
	 * Returns the loading durations using the Navigation Timing API. All the
	 * durations exclude the server response time.
	 *
	 * @return Object with loading metrics durations.
	 */
	async getLoadingDurations() {
		return await this.page.evaluate( () => {
			const [
				{
					requestStart,
					responseStart,
					responseEnd,
					domContentLoadedEventEnd,
					loadEventEnd,
				},
			] = performance.getEntriesByType(
				'navigation'
			) as PerformanceNavigationTiming[];
			const paintTimings = performance.getEntriesByType(
				'paint'
			) as PerformancePaintTiming[];

			const firstPaintStartTime = paintTimings.find(
				( { name } ) => name === 'first-paint'
			)!.startTime;

			const firstContentfulPaintStartTime = paintTimings.find(
				( { name } ) => name === 'first-contentful-paint'
			)!.startTime;

			return {
				// Server side metric.
				serverResponse: responseStart - requestStart,
				// For client side metrics, consider the end of the response (the
				// browser receives the HTML) as the start time (0).
				firstPaint: firstPaintStartTime - responseEnd,
				domContentLoaded: domContentLoadedEventEnd - responseEnd,
				loaded: loadEventEnd - responseEnd,
				firstContentfulPaint:
					firstContentfulPaintStartTime - responseEnd,
				timeSinceResponseEnd: performance.now() - responseEnd,
			};
		} );
	}

	/**
	 * Starts Chromium tracing with predefined options for performance testing.
	 *
	 * The category set mirrors what Chrome DevTools enables when recording in
	 * the Performance panel: `devtools.timeline` provides the top-level event
	 * tree, and the `disabled-by-default-v8.cpu_profiler` + companion
	 * `devtools.timeline.stack` categories enable the V8 sampler that
	 * populates JavaScript call stacks. Without the latter, the saved trace
	 * shows only opaque "Function call" blocks with no JS frames inside.
	 *
	 * @param options Options to pass to `browser.startTracing()`.
	 */
	async startTracing( options = {} ) {
		return await this.browser.startTracing( this.page, {
			screenshots: false,
			categories: [
				'devtools.timeline',
				'disabled-by-default-devtools.timeline',
				'disabled-by-default-devtools.timeline.stack',
				'disabled-by-default-v8.cpu_profiler',
				'v8.execute',
			],
			...options,
		} );
	}

	/**
	 * Stops Chromium tracing and saves the trace.
	 *
	 * When the `WP_ARTIFACTS_PATH` environment variable is set, the raw trace
	 * is also written to `${WP_ARTIFACTS_PATH}/traces/<name>.trace.json`. The
	 * resulting file can be opened in Chrome DevTools (Performance panel →
	 * "Load profile…") to inspect the flame graph.
	 *
	 * The default file name is derived from the surrounding Playwright test's
	 * title path, with any `(N of M)` iteration suffix stripped. Subsequent
	 * `stopTracing` calls that resolve to an already-written file (repeated
	 * test iterations or in-test loops) are skipped — one trace per scenario
	 * is enough to investigate a regression. Pass an explicit `name` to
	 * override.
	 *
	 * @param name Optional file name (without extension), overriding the
	 *             default test-title-derived name.
	 */
	async stopTracing( name?: string ) {
		const traceBuffer = await this.browser.stopTracing();
		const traceJSON = JSON.parse( traceBuffer.toString() );

		this.trace = traceJSON;

		const artifactsPath = process.env.WP_ARTIFACTS_PATH;
		if ( artifactsPath ) {
			const tracesDir = join( artifactsPath, 'traces' );
			const baseName = name ?? defaultTraceName();
			const filePath = join( tracesDir, `${ baseName }.trace.json` );
			await mkdir( tracesDir, { recursive: true } );
			if ( ! ( await fileExists( filePath ) ) ) {
				await resolveTraceSourceMaps( traceJSON, fetchMap );
				await writeFile( filePath, JSON.stringify( traceJSON ) );
			}
		}
	}

	/**
	 * @return Durations of all traced `keydown`, `keypress`, and `keyup`
	 * events.
	 */
	getTypingEventDurations() {
		return [
			this.getEventDurations( 'keydown' ),
			this.getEventDurations( 'keypress' ),
			this.getEventDurations( 'keyup' ),
		];
	}

	/**
	 * @return Durations of all traced `focus` and `focusin` events.
	 */
	getSelectionEventDurations() {
		return [
			this.getEventDurations( 'focus' ),
			this.getEventDurations( 'focusin' ),
		];
	}

	/**
	 * @return Durations of all traced `click` events.
	 */
	getClickEventDurations() {
		return [ this.getEventDurations( 'click' ) ];
	}

	/**
	 * @return Durations of all traced `mouseover` and `mouseout` events.
	 */
	getHoverEventDurations() {
		return [
			this.getEventDurations( 'mouseover' ),
			this.getEventDurations( 'mouseout' ),
		];
	}

	/**
	 * @param eventType Type of event to filter.
	 * @return Durations of all events of a given type.
	 */
	getEventDurations( eventType: EventType ) {
		if ( this.trace.traceEvents.length === 0 ) {
			throw new Error(
				'No trace events found. Did you forget to call stopTracing()?'
			);
		}

		return this.trace.traceEvents
			.filter(
				( item: TraceEvent ): boolean =>
					item.cat === 'devtools.timeline' &&
					item.name === 'EventDispatch' &&
					item?.args?.data?.type === eventType &&
					!! item.dur
			)
			.map( ( item ) => ( item.dur ? item.dur / 1000 : 0 ) );
	}

	/**
	 * Initializes the web-vitals library upon next page navigation.
	 *
	 * Defaults to automatically triggering the navigation,
	 * but it can also be done manually.
	 *
	 * @example
	 * ```js
	 * await metrics.initWebVitals();
	 * console.log( await metrics.getWebVitals() );
	 * ```
	 *
	 * @example
	 * ```js
	 * await metrics.initWebVitals( false );
	 * await page.goto( '/some-other-page' );
	 * console.log( await metrics.getWebVitals() );
	 * ```
	 *
	 * @param reload Whether to force navigation by reloading the current page.
	 */
	async initWebVitals( reload = true ) {
		await this.page.addInitScript( {
			path: join(
				__dirname,
				'../../../../node_modules/web-vitals/dist/web-vitals.umd.cjs'
			),
		} );

		await this.page.exposeFunction(
			'__reportVitals__',
			( data: string ) => {
				const measurement: Metric = JSON.parse( data );
				this.webVitals[ measurement.name ] = measurement.value;
			}
		);

		await this.page.addInitScript( () => {
			const reportVitals = ( measurement: unknown ) =>
				window.__reportVitals__( JSON.stringify( measurement ) );

			window.addEventListener( 'DOMContentLoaded', () => {
				// @ts-expect-error This is valid but web-vitals does not register the global types.
				window.webVitals.onCLS( reportVitals );
				// @ts-expect-error This is valid but web-vitals does not register the global types.
				window.webVitals.onFCP( reportVitals );
				// @ts-expect-error This is valid but web-vitals does not register the global types.
				window.webVitals.onFID( reportVitals );
				// @ts-expect-error This is valid but web-vitals does not register the global types.
				window.webVitals.onINP( reportVitals );
				// @ts-expect-error This is valid but web-vitals does not register the global types.
				window.webVitals.onLCP( reportVitals );
				// @ts-expect-error This is valid but web-vitals does not register the global types.
				window.webVitals.onTTFB( reportVitals );
			} );
		} );

		if ( reload ) {
			// By reloading the page the script will be applied.
			await this.page.reload();
		}
	}

	/**
	 * Returns web vitals as collected by the web-vitals library.
	 *
	 * If the web-vitals library hasn't been loaded on the current page yet,
	 * it will be initialized with a page reload.
	 *
	 * Reloads the page to force web-vitals to report all collected metrics.
	 *
	 * @return {WebVitalsMeasurements} Web vitals measurements.
	 */
	async getWebVitals() {
		// Reset values.
		this.webVitals = {};

		const hasScript = await this.page.evaluate(
			// @ts-expect-error This is valid but web-vitals does not register the global types.
			() => typeof window.webVitals !== 'undefined'
		);

		if ( ! hasScript ) {
			await this.initWebVitals();
		}

		// Trigger navigation so the web-vitals library reports values on unload.
		await this.page.reload();

		return this.webVitals;
	}
}

/**
 * Build a filesystem-safe default trace name from the current Playwright test's
 * title path. Drops the project- and file-name segments that Playwright
 * prepends, and strips any `(N of M)` iteration suffix so that repeated runs
 * of the same scenario produce the same name. Falls back to "trace" when
 * called outside a test context.
 */
function defaultTraceName(): string {
	const info = ( () => {
		try {
			return test.info();
		} catch {
			// `test.info()` throws when called outside a test.
			return undefined;
		}
	} )();

	if ( ! info ) {
		return 'trace';
	}

	// `titlePath` is `[projectName, fileName, ...describes, testTitle]`. Keep
	// only the describe blocks and the test title — the rest is noise once
	// the artifact directory is already scoped to a single CI run.
	const segments = info.titlePath.slice( 2 );

	const slug = segments
		.map( ( segment ) =>
			segment.replace( /\s*\(\s*\d+\s*of\s*\d+\s*\)\s*$/i, '' )
		)
		.join( '__' )
		.replace( /[^a-zA-Z0-9-_]+/g, '-' )
		.replace( /^-+|-+$/g, '' );

	return slug || 'trace';
}

async function fileExists( filePath: string ): Promise< boolean > {
	try {
		await access( filePath );
		return true;
	} catch {
		return false;
	}
}

/**
 * Fetch a source map for a script URL. Strips any query string (WordPress
 * appends `?ver=…` cache-busters that, with Apache's default rules, would
 * otherwise let the bogus `<url>.map?ver=…` request resolve to the script
 * body itself). Returns the body text, or `null` when the map is missing or
 * unreachable. Used to deminify function names in saved traces; failures
 * are intentionally silent so the trace is still saved when individual
 * maps are unavailable (e.g. external scripts, runtime-injected code).
 *
 * @param scriptUrl URL of the script whose source map to fetch.
 */
async function fetchMap( scriptUrl: string ): Promise< string | null > {
	if ( ! /^https?:\/\//.test( scriptUrl ) ) {
		return null;
	}
	let mapUrl: URL;
	try {
		mapUrl = new URL( scriptUrl );
	} catch {
		return null;
	}
	mapUrl.search = '';
	mapUrl.hash = '';
	mapUrl.pathname = `${ mapUrl.pathname }.map`;

	try {
		const response = await fetch( mapUrl );
		if ( ! response.ok ) {
			return null;
		}
		return await response.text();
	} catch {
		return null;
	}
}
