/**
 * External dependencies
 */
import { basename, join } from 'path';
import { writeFileSync } from 'fs';

/**
 * WordPress dependencies
 */
import { activateTheme, createURL, logout } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { getLoadingDurations } from './utils';

describe( 'Front End Performance', () => {
	const results = {
		timeToFirstByte: [],
	};

	beforeAll( async () => {
		await activateTheme( 'twentytwentythree' );
		await logout();
	} );

	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );
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
			const { timeToFirstByte } = await getLoadingDurations();
			results.timeToFirstByte.push( timeToFirstByte );
		}
	} );
} );
