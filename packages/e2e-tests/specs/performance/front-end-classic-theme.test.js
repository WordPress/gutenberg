/**
 * WordPress dependencies
 */
import { activateTheme, createURL, logout } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { saveResultsFile } from './utils';

describe( 'Front End Performance', () => {
	const results = {
		timeToFirstByte: [],
		largestContentfulPaint: [],
		lcpMinusTtfb: [],
	};

	beforeAll( async () => {
		await activateTheme( 'gutenberg-test-themes/twentytwentyone' );
		await logout();
	} );

	afterAll( async () => {
		saveResultsFile( __filename, results );
	} );

	it( 'Report TTFB, LCP, and LCP-TTFB', async () => {
		// Based on https://addyosmani.com/blog/puppeteer-recipes/#performance-observer-lcp
		function calcLCP() {
			// By using -1 we know when it didn't record any event.
			window.largestContentfulPaint = -1;

			const observer = new PerformanceObserver( ( entryList ) => {
				const entries = entryList.getEntries();
				const lastEntry = entries[ entries.length - 1 ];
				// According to the spec, we can use startTime
				// as it'll report renderTime || loadTime:
				// https://www.w3.org/TR/largest-contentful-paint/#largestcontentfulpaint
				window.largestContentfulPaint = lastEntry.startTime;
			} );

			observer.observe( {
				type: 'largest-contentful-paint',
				buffered: true,
			} );

			document.addEventListener( 'visibilitychange', () => {
				if ( document.visibilityState === 'hidden' ) {
					observer.takeRecords();
					observer.disconnect();
				}
			} );
		}

		let i = 16;
		while ( i-- ) {
			await page.evaluateOnNewDocument( calcLCP );
			// By waiting for networkidle we make sure navigation won't be considered finished on load,
			// hence, it'll paint the page and largest-contentful-paint events will be dispatched.
			// https://pptr.dev/api/puppeteer.page.goto#remarks
			await page.goto( createURL( '/' ), { waitUntil: 'networkidle0' } );

			const { lcp, ttfb } = await page.evaluate( () => {
				const [ { responseStart, startTime } ] =
					performance.getEntriesByType( 'navigation' );
				return {
					lcp: window.largestContentfulPaint,
					ttfb: responseStart - startTime,
				};
			} );

			results.largestContentfulPaint.push( lcp );
			results.timeToFirstByte.push( ttfb );
			results.lcpMinusTtfb.push( lcp - ttfb );
		}
	} );
} );
