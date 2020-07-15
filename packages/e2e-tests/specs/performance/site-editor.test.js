/**
 * External dependencies
 */
import { basename, join } from 'path';
import { writeFileSync } from 'fs';

/**
 * Internal dependencies
 */
import { useExperimentalFeatures } from '../../experimental-features';

/**
 * WordPress dependencies
 */
import { trashAllPosts, visitAdminPage } from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

jest.setTimeout( 1000000 );

describe( 'Site Editor Performance', () => {
	useExperimentalFeatures( [
		'#gutenberg-full-site-editing',
		'#gutenberg-full-site-editing-demo',
	] );

	beforeAll( async () => {
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
	} );
	afterAll( async () => {
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
	} );

	it( 'Loading', async () => {
		const results = {
			load: [],
			domcontentloaded: [],
			type: [],
			focus: [],
		};

		await visitAdminPage(
			'admin.php',
			addQueryArgs( '', {
				page: 'gutenberg-edit-site',
			} ).slice( 1 )
		);

		let i = 3;

		// Measuring loading time
		while ( i-- ) {
			await page.reload( { waitUntil: [ 'domcontentloaded', 'load' ] } );
			const timings = JSON.parse(
				await page.evaluate( () =>
					JSON.stringify( window.performance.timing )
				)
			);
			const {
				navigationStart,
				domContentLoadedEventEnd,
				loadEventEnd,
			} = timings;
			results.load.push( loadEventEnd - navigationStart );
			results.domcontentloaded.push(
				domContentLoadedEventEnd - navigationStart
			);
		}

		const resultsFilename = basename( __filename, '.js' ) + '.results.json';

		writeFileSync(
			join( __dirname, resultsFilename ),
			JSON.stringify( results, null, 2 )
		);

		expect( true ).toBe( true );
	} );
} );
