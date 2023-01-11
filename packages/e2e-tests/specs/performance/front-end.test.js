/**
 * External dependencies
 */
import { basename, join } from 'path';
import { writeFileSync } from 'fs';

/**
 * WordPress dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';

describe( 'Front End Performance', () => {
	const results = {
		timeToFirstByte: [],
	};

	afterAll( async () => {
		const resultsFilename = basename( __filename, '.js' ) + '.results.json';
		writeFileSync(
			join( __dirname, resultsFilename ),
			JSON.stringify( results, null, 2 )
		);
	} );

	it( 'Time To First Byte (TTFB)', async () => {
		let i = 5;
		while ( i-- ) {
			await page.goto( createURL( '/' ) );
			const navigationTimingJson = await page.evaluate( () =>
				JSON.stringify( performance.getEntriesByType( 'navigation' ) )
			);
			const [ navigationTiming ] = JSON.parse( navigationTimingJson );
			results.timeToFirstByte.push(
				navigationTiming.responseStart - navigationTiming.requestStart
			);
		}
	} );
} );
