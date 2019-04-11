/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	searchForBlock,
	getEditedPostContent,
	createNewPost,
} from '@wordpress/e2e-test-utils';

describe( 'Group', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created using the block inserter', async () => {
		await searchForBlock( 'Group' );
		await page.click( '.editor-block-list-item-group' );
		await page.keyboard.type( 'Group block' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created using the slash inserter', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '/group' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Group block' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
