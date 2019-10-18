/**
 * WordPress dependencies
 */
import {
	getEditedPostContent,
	createNewPost,
	insertBlock,
	transformBlockTo,
} from '@wordpress/e2e-test-utils';

describe( 'Code block', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should convert to a preformatted block', async () => {
		const code = 'print "Hello Dolly!"';

		await insertBlock( 'Code' );

		await page.type( '.block-editor-block-list__block textarea', code );

		// Verify the content starts out as a Code block.
		const originalPostContent = await getEditedPostContent();
		expect( originalPostContent ).toMatchSnapshot();

		await transformBlockTo( 'Preformatted' );

		// The content should now be a Preformatted block with no data loss.
		const convertedPostContent = await getEditedPostContent();
		expect( convertedPostContent ).toMatchSnapshot();
	} );
} );
