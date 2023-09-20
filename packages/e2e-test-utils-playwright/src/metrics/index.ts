/**
 * External dependencies
 */
import type { Page, Browser } from '@playwright/test';

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

interface LoadingDurations {
	serverResponse: number;
	firstPaint: number;
	domContentLoaded: number;
	loaded: number;
	firstContentfulPaint: number;
	timeSinceResponseEnd: number;
}

type MetricsConstructorProps = {
	page: Page;
};

export class Metrics {
	browser: Browser;
	page: Page;
	trace: { traceEvents: TraceEvent[] };

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
	 */
	async getTimeToFirstByte(): Promise< number > {
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
	 */
	async getLargestContentfulPaint(): Promise< number > {
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
	 */
	async getCumulativeLayoutShift(): Promise< number > {
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
	 */
	async getLoadingDurations(): Promise< LoadingDurations > {
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
			)?.startTime as number;

			const firstContentfulPaintStartTime = paintTimings.find(
				( { name } ) => name === 'first-contentful-paint'
			)?.startTime as number;

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
	 *  Starts Chromium tracing with predefined options for performance testing.
	 *
	 * @param options Options to pass to `browser.startTracing()`.
	 */
	async startTracing( options = {} ): Promise< void > {
		return await this.browser.startTracing( this.page, {
			screenshots: false,
			categories: [ 'devtools.timeline' ],
			...options,
		} );
	}

	/**
	 * Stops Chromium tracing and saves the trace.
	 */
	async stopTracing(): Promise< void > {
		const traceBuffer = await this.browser.stopTracing();
		const traceJSON = JSON.parse( traceBuffer.toString() );

		this.trace = traceJSON;
	}

	/**
	 * Returns the durations of all typing events.
	 */
	getTypingEventDurations(): number[][] {
		return [
			this.getEventDurations( 'keydown' ),
			this.getEventDurations( 'keypress' ),
			this.getEventDurations( 'keyup' ),
		];
	}

	/**
	 * Returns the durations of all selection events.
	 */
	getSelectionEventDurations(): number[][] {
		return [
			this.getEventDurations( 'focus' ),
			this.getEventDurations( 'focusin' ),
		];
	}

	/**
	 * Returns the durations of all click events.
	 */
	getClickEventDurations(): number[][] {
		return [ this.getEventDurations( 'click' ) ];
	}

	/**
	 * Returns the durations of all hover events.
	 */
	getHoverEventDurations(): number[][] {
		return [
			this.getEventDurations( 'mouseover' ),
			this.getEventDurations( 'mouseout' ),
		];
	}

	/**
	 * Returns the durations of all events of a given type.
	 *
	 * @param eventType The type of event to filter.
	 */
	getEventDurations( eventType: EventType ): number[] {
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
}
