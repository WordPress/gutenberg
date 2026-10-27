/**
 * jsdom gaps the router tests need filled before `@wordpress/interactivity`
 * evaluates, so import this module first.
 */

// The runtime reads the navigation timing entry when it loads, and the
// `data-wp-on` and `data-wp-watch` directives call `performance.measure()`.
window.performance.getEntriesByType = () =>
	[ { domContentLoadedEventStart: 1 } ] as unknown as PerformanceEntryList;
window.performance.measure = () => undefined as unknown as PerformanceMeasure;

// jsdom reports the full page loads the router falls back to ("Not
// implemented: navigation") through a console created before the console
// spies are installed. Forward them to the spied console so a test can assert
// that a reload was attempted with `expect( console ).toHaveErrored()`.
(
	globalThis as typeof globalThis & {
		jsdom: {
			virtualConsole: {
				on: ( event: string, listener: ( e: unknown ) => void ) => void;
			};
		};
	}
 ).jsdom.virtualConsole.on( 'jsdomError', ( error ) => {
	// eslint-disable-next-line no-console
	console.error( error );
} );

export {};
