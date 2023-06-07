/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Internal dependencies
 */
import { saveResultsFile } from './utils';

const results = {
	timeToFirstByte: [],
	largestContentfulPaint: [],
	lcpMinusTtfb: [],
};

test.describe( 'Front End Performance', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.afterAll( async () => {
		saveResultsFile( __filename, results );
	} );

	const iterations = 16;
	for ( let i = 1; i <= iterations; i++ ) {
		test( `Measure TTFB, LCP, and LCP-TTFB (${ i } of ${ iterations })`, async ( {
			browser,
		} ) => {
			// Create a new, logged-out page for each iteration.
			const guestPage = await browser.newPage( {
				storageState: undefined,
			} );

			// Go to the base URL.
			await guestPage.goto( '/' );

			// Take the measurements.
			const [ lcp, ttfb ] = await guestPage.evaluate( () => {
				return Promise.all( [
					// Measure the Largest Contentful Paint time.
					// Based on https://www.checklyhq.com/learn/headless/basics-performance#largest-contentful-paint-api-largest-contentful-paint
					new Promise( ( resolve ) => {
						new PerformanceObserver( ( entryList ) => {
							const entries = entryList.getEntries();
							// The last entry is the largest contentful paint.
							const largestPaintEntry = entries.at( -1 );

							resolve( largestPaintEntry.startTime );
						} ).observe( {
							type: 'largest-contentful-paint',
							buffered: true,
						} );
					} ),
					// Measure the Time To First Byte.
					// Based on https://web.dev/ttfb/#measure-ttfb-in-javascript
					new Promise( ( resolve ) => {
						new PerformanceObserver( ( entryList ) => {
							const [ pageNav ] =
								entryList.getEntriesByType( 'navigation' );

							resolve( pageNav.responseStart );
						} ).observe( {
							type: 'navigation',
							buffered: true,
						} );
					} ),
				] );
			} );

			// Ensure the numbers are valid.
			expect( lcp ).toBeGreaterThan( 0 );
			expect( ttfb ).toBeGreaterThan( 0 );

			// Save the results.
			results.largestContentfulPaint.push( lcp );
			results.timeToFirstByte.push( ttfb );
			results.lcpMinusTtfb.push( lcp - ttfb );

			// Close the current page.
			await guestPage.close();
		} );
	}
} );
