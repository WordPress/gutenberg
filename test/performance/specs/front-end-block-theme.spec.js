/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Internal dependencies
 */
const { saveResultsFile } = require( '../utils' );

const results = {
	timeToFirstByte: [],
	largestContentfulPaint: [],
	lcpMinusTtfb: [],
};

test.describe( 'Front End Performance', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentythree' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		saveResultsFile( __filename, results );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Report TTFB, LCP, and LCP-TTFB', async ( { page, metrics } ) => {
		let i = 16;
		while ( i-- ) {
			// Go to the base URL.
			await page.goto( '/', { waitUntil: 'networkidle' } );

			// Take the measurements.
			const lcp = await metrics.getLargestContentfulPaint();
			const ttfb = await metrics.getTimeToFirstByte();

			// Ensure the numbers are valid.
			expect( lcp ).toBeGreaterThan( 0 );
			expect( ttfb ).toBeGreaterThan( 0 );

			// Save the results.
			results.largestContentfulPaint.push( lcp );
			results.timeToFirstByte.push( ttfb );
			results.lcpMinusTtfb.push( lcp - ttfb );
		}
	} );
} );
