/**
 * External dependencies
 */
import { basename, join } from 'path';
import { writeFileSync } from 'fs';

/**
 * WordPress dependencies
 */
import { createURL, logout } from '@wordpress/e2e-test-utils';

describe( 'Front End Performance', () => {
	const results = {
		timeToFirstByte: [],
		largestContentfulPaint: [],
	};

	beforeAll( async () => {
		await logout();
	} );

	afterAll( async () => {
		const resultsFilename = basename( __filename, '.js' ) + '.results.json';
		writeFileSync(
			join( __dirname, resultsFilename ),
			JSON.stringify( results, null, 2 )
		);
	} );

	it( 'Time To First Byte (TTFB)', async () => {
		// We derive the 75th percentile of the TTFB based on these results.
		// By running it 16 times, the percentile value would be (75/100)*16=12,
		// meaning that we discard the worst 4 values.
		let i = 16;
		while ( i-- ) {
			await page.goto( createURL( '/' ) );
			const navigationTimingJson = await page.evaluate( () =>
				JSON.stringify( performance.getEntriesByType( 'navigation' ) )
			);
			const [ navigationTiming ] = JSON.parse( navigationTimingJson );
			results.timeToFirstByte.push(
				navigationTiming.responseStart - navigationTiming.startTime
			);
		}
	} );

	it( 'Largest Contentful Paint (LCP)', async () => {
		// Based on https://addyosmani.com/blog/puppeteer-recipes/#performance-observer-lcp
		function calcLCP() {
			window.largestContentfulPaint = 0;

			const observer = new PerformanceObserver( ( entryList ) => {
				const entries = entryList.getEntries();
				const lastEntry = entries[ entries.length - 1 ];
				window.largestContentfulPaint =
					lastEntry.renderTime || lastEntry.loadTime;
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

		// We derive the 75th percentile of the TTFB based on these results.
		// By running it 16 times, the percentile value would be (75/100)*16=12,
		// meaning that we discard the worst 4 values.
		let i = 16;
		while ( i-- ) {
			await page.evaluateOnNewDocument( calcLCP );
			await page.goto( createURL( '/' ) );

			const lcp = await page.evaluate(
				() => window.largestContentfulPaint
			);
			results.largestContentfulPaint.push( lcp );
		}
	} );
} );
