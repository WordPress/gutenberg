/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
} from '@wordpress/e2e-test-utils';

describe( 'Separator', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created by three dashes and enter', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '---' );
		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
