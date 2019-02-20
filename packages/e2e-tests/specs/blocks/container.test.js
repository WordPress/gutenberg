/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	searchForBlock,
	getEditedPostContent,
	createNewPost,
} from '@wordpress/e2e-test-utils';

describe( 'Container', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created using the block inserter', async () => {
		await searchForBlock( 'Container' );
		await page.click( '.editor-block-list-item-container' );
		await page.keyboard.type( 'Container block' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created using the slash inserter', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '/container' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Container block' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
