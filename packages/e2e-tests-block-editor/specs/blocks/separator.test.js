/**
 * WordPress dependencies
 */
import { getEditedPostContent } from '@wordpress/e2e-test-utils';

describe( 'Separator', () => {
	it( 'can be created by three dashes and enter', async () => {
		await page.keyboard.type( '---' );
		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
