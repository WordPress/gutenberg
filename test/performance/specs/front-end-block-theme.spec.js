/* eslint-disable playwright/no-conditional-in-test, playwright/expect-expect */

/**
 * WordPress dependencies
 */
import { test, Metrics } from '@wordpress/e2e-test-utils-playwright';

const results = {
	timeToFirstByte: [],
	largestContentfulPaint: [],
	lcpMinusTtfb: [],
};

test.describe( 'Front End Performance', () => {
	test.use( {
		storageState: {}, // User will be logged out.
		metrics: async ( { page }, use ) => {
			await use( new Metrics( { page } ) );
		},
	} );

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentythree' );
	} );

	test.afterAll( async ( { requestUtils }, testInfo ) => {
		await testInfo.attach( 'results', {
			body: JSON.stringify( results, null, 2 ),
			contentType: 'application/json',
		} );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	const samples = 16;
	const throwaway = 0;
	const iterations = samples + throwaway;
	for ( let i = 1; i <= iterations; i++ ) {
		test( `Measure TTFB, LCP, and LCP-TTFB (${ i } of ${ iterations })`, async ( {
			page,
			metrics,
		} ) => {
			// Go to the base URL.
			// eslint-disable-next-line playwright/no-networkidle
			await page.goto( '/', { waitUntil: 'networkidle' } );

			// Take the measurements.
			const ttfb = await metrics.getTimeToFirstByte();
			const lcp = await metrics.getLargestContentfulPaint();

			// Save the results.
			if ( i > throwaway ) {
				results.largestContentfulPaint.push( lcp );
				results.timeToFirstByte.push( ttfb );
				results.lcpMinusTtfb.push( lcp - ttfb );

				const serverTiming = await metrics.getServerTiming();

				for ( const [ key, value ] of Object.entries( serverTiming ) ) {
					results[ key ] ??= [];
					results[ key ].push( value );
				}
			}
		} );
	}
} );

/* eslint-enable playwright/no-conditional-in-test, playwright/expect-expect */
