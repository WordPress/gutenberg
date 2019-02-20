/**
 * WordPress dependencies
 */
import {
	searchForBlock,
	getEditedPostContent,
	createNewPost,
} from '@wordpress/e2e-test-utils';

describe( 'Container', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created by using the block inserter', async () => {
		await searchForBlock( 'Container' );
		await page.click( '.editor-block-list-item-container' );
		await page.keyboard.type( 'Container block' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
