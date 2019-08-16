/**
 * WordPress dependencies
 */
import {
	createNewPost,
	getEditedPostContent,
	clickBlockAppender,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

describe( 'RichText', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should transform backtick to code', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'A `backtick`' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		// To do: still not possible in block editor on its own...
		await pressKeyWithModifier( 'primary', 'z' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
