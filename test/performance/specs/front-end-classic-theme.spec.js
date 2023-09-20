/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const results = {
	timeToFirstByte: [],
	largestContentfulPaint: [],
	lcpMinusTtfb: [],
};

test.describe( 'Front End Performance', () => {
	test.use( { storageState: {} } ); // User will be logged out.

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.afterAll( async ( {}, testInfo ) => {
		await testInfo.attach( 'results', {
			body: JSON.stringify( results, null, 2 ),
			contentType: 'application/json',
		} );
	} );

	const samples = 16;
	const throwaway = 0;
	const rounds = samples + throwaway;
	for ( let i = 1; i <= rounds; i++ ) {
		test( `Report TTFB, LCP, and LCP-TTFB (${ i } of ${ rounds })`, async ( {
			page,
			metrics,
		} ) => {
			// Go to the base URL.
			// eslint-disable-next-line playwright/no-networkidle
			await page.goto( '/', { waitUntil: 'networkidle' } );

			// Take the measurements.
			const lcp = await metrics.getLargestContentfulPaint();
			const ttfb = await metrics.getTimeToFirstByte();

			// Ensure the numbers are valid.
			expect( lcp ).toBeGreaterThan( 0 );
			expect( ttfb ).toBeGreaterThan( 0 );

			// Save the results.
			if ( i >= throwaway ) {
				results.largestContentfulPaint.push( lcp );
				results.timeToFirstByte.push( ttfb );
				results.lcpMinusTtfb.push( lcp - ttfb );
			}
		} );
	}
} );
