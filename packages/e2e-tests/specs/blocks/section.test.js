/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	searchForBlock,
	getEditedPostContent,
	createNewPost,
} from '@wordpress/e2e-test-utils';

describe( 'Section', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created using the block inserter', async () => {
		await searchForBlock( 'Section' );
		await page.click( '.editor-block-list-item-section' );
		await page.keyboard.type( 'Section block' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created using the slash inserter', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '/section' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Section block' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
