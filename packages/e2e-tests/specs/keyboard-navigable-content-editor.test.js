/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertAndPopulateBlock,
	navigateToContentEditorTop,
	tabThroughTextBlock,
} from '@wordpress/e2e-test-utils';

/**
 * External dependencies
 */

describe( 'Order of block keyboard navigation', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'permits tabbing through paragraph blocks in the expected order', async () => {
		const paragraphBlocks = [ 'Paragraph 0', 'Paragraph 1', 'Paragraph 2' ];

		// create 3 paragraphs blocks with some content
		for ( const paragraphBlock of paragraphBlocks ) {
			await insertAndPopulateBlock( 'Paragraph', paragraphBlock );
		}

		await navigateToContentEditorTop();

		for ( const paragraphBlock of paragraphBlocks ) {
			await tabThroughTextBlock( paragraphBlock, 'core/paragraph' );
		}

		// Repeat the same steps to ensure that there is no change introduced in how the focus is handled.
		// This prevents the previous regression explained in: https://github.com/WordPress/gutenberg/issues/11773.
		await navigateToContentEditorTop();

		for ( const paragraphBlock of paragraphBlocks ) {
			await tabThroughTextBlock( paragraphBlock, 'core/paragraph' );
		}
	} );
} );
