/**
 * External dependencies
 */
import { basename, join } from 'path';
import { writeFileSync } from 'fs';

/**
 * WordPress dependencies
 */
import {
	trashAllPosts,
	activateTheme,
	canvas,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { siteEditor } from '../../experimental-features';

jest.setTimeout( 1000000 );

describe( 'Site Editor Performance', () => {
	beforeAll( async () => {
		await activateTheme( 'tt1-blocks' );
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template', 'auto-draft' );
		await trashAllPosts( 'wp_template_part' );
	} );
	afterAll( async () => {
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
		await activateTheme( 'twentytwentyone' );
	} );

	it( 'Loading', async () => {
		const results = {
			load: [],
			type: [],
			focus: [],
			inserterOpen: [],
			inserterHover: [],
		};

		await siteEditor.visit();

		let i = 3;

		// Measuring loading time
		while ( i-- ) {
			const startTime = new Date();
			await page.reload();
			await page.waitForSelector( '.edit-site-visual-editor', {
				timeout: 120000,
			} );
			await canvas().waitForSelector( '.wp-block', { timeout: 120000 } );

			results.load.push( new Date() - startTime );
		}

		const resultsFilename = basename( __filename, '.js' ) + '.results.json';

		writeFileSync(
			join( __dirname, resultsFilename ),
			JSON.stringify( results, null, 2 )
		);

		expect( true ).toBe( true );
	} );
} );
