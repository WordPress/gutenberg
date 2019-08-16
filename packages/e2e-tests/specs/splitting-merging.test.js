/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	isInDefaultBlock,
	getEditedPostContent,
} from '@wordpress/e2e-test-utils';

describe( 'splitting and merging blocks', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should ensure always a default block', async () => {
		// Feature: To avoid focus loss, removal of all blocks will result in a
		// default block insertion at the root. Pressing backspace in a new
		// paragraph should not effectively allow removal. This is counteracted
		// with pre-save content processing to save post consisting of only the
		// unmodified default block as an empty string.
		//
		// See: https://github.com/WordPress/gutenberg/issues/9626
		await insertBlock( 'Paragraph' );
		await page.keyboard.press( 'Backspace' );

		// There is a default block:
		expect( await page.$$( '.block-editor-block-list__block' ) ).toHaveLength( 1 );

		// But the effective saved content is still empty:
		expect( await getEditedPostContent() ).toBe( '' );

		// And focus is retained:
		expect( await isInDefaultBlock() ).toBe( true );
	} );
} );
