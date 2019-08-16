/**
 * WordPress dependencies
 */
import { getEditedPostContent } from '@wordpress/e2e-test-utils';

describe( 'Code', () => {
	it( 'can be created by three backticks and enter', async () => {
		await page.keyboard.type( '```' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '<?php' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
