/**
 * Debug logger for client-side media processing.
 *
 * Provides diagnostic logging via `console.debug` and performance
 * measurement via the User Timings API. Both are only emitted when
 * SCRIPT_DEBUG is true, so there is no overhead in production builds.
 */

function isDebugEnabled(): boolean {
	// eslint-disable-next-line @wordpress/wp-global-usage
	return globalThis.SCRIPT_DEBUG === true;
}

/**
 * Logs a diagnostic message visible in the browser console.
 *
 * Unlike `@wordpress/warning`, this does not throw a caught `Error`, so it
 * won't trip the debugger for developers who pause on caught exceptions.
 * Use it for non-error lifecycle diagnostics (cancellations, batch
 * completion). Only emits when SCRIPT_DEBUG is true.
 *
 * @param message Message to log.
 * @param args    Additional values to log.
 */
export function debug( message: string, ...args: unknown[] ): void {
	if ( ! isDebugEnabled() ) {
		return;
	}

	// eslint-disable-next-line no-console -- Deliberately log diagnostics here.
	console.debug( `[upload-media] ${ message }`, ...args );
}

interface MeasureOptions {
	measureName: string;
	startTime: number;
	endTime?: number;
	tooltipText?: string;
	properties?: Array< [ string, string ] >;
}

/**
 * Records a performance measure visible in DevTools Performance panel.
 *
 * Uses the User Timings API (performance.measure) to create entries
 * under a custom "Upload Media" track in DevTools. Only emits when
 * SCRIPT_DEBUG is true, so there's no overhead in production builds.
 *
 * @param options             Measure options.
 * @param options.measureName Name for the performance measure entry.
 * @param options.startTime   Start time from performance.now().
 * @param options.endTime     End time from performance.now(). Defaults to current time.
 * @param options.tooltipText Tooltip text shown in DevTools.
 * @param options.properties  Key-value pairs shown in DevTools detail view.
 */
export function measure( options: MeasureOptions ): void {
	if ( ! isDebugEnabled() ) {
		return;
	}

	const {
		measureName,
		startTime,
		endTime = performance.now(),
		tooltipText,
		properties,
	} = options;

	const detail: Record< string, unknown > = {
		devtools: {
			dataType: 'track-entry',
			track: 'Upload Media',
			tooltipText,
			properties: properties?.map( ( [ key, value ] ) => ( {
				key,
				value,
			} ) ),
		},
	};

	try {
		performance.measure( measureName, {
			start: startTime,
			end: endTime,
			detail,
		} );
	} catch {
		// Silently ignore if User Timings API is unavailable.
	}
}
