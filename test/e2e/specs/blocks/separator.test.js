/**
 * Internal dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	newPost,
} from '../../support/utils';

describe( 'Separator', () => {
	beforeEach( async () => {
		await newPost();
	} );

	it( 'can be created by three dashes and enter', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '---' );
		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
