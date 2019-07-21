/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertAndPopulateBlock,
	navigateToContentEditorTop,
	tabThroughTextBlock,
	tabThroughFileBlock,
} from '@wordpress/e2e-test-utils';

/**
 * External dependencies
 */

describe( 'Order of block keyboard navigation', () => {
	beforeEach( async () => {
		await createNewPost();
	} );
	it( 'permits tabbing through blocks in the expected order', async () => {
		await insertAndPopulateBlock( 'Heading', 'Heading Block Content' );
		await insertAndPopulateBlock( 'Quote', 'Quote Block Content' );
		await insertAndPopulateBlock( 'List', 'List Block Content' );
		await insertAndPopulateBlock( 'Paragraph', 'Paragraph Block Content' );
		await insertAndPopulateBlock( 'Image', 'Image Block Content' );
		await insertAndPopulateBlock( 'Gallery', 'Gallery Block Content' );
		await insertAndPopulateBlock( 'Audio', 'Audio Block Content' );
		await insertAndPopulateBlock( 'Cover', 'Cover Block Content' );
		await insertAndPopulateBlock( 'File', 'File Block Content' );

		await navigateToContentEditorTop();

		await tabThroughTextBlock( 'Heading Block Content', 'core/heading' );
		await tabThroughTextBlock( 'Quote Block Content', 'core/quote' );
		await tabThroughTextBlock( 'List Block Content', 'core/list' );
		await tabThroughTextBlock( 'Paragraph Block Content', 'core/paragraph' );
		await tabThroughFileBlock( 'Image Block Content', 'core/image' );
		await tabThroughFileBlock( 'Gallery Block Content', 'core/gallery' );
		await tabThroughFileBlock( 'Audio Block Content', 'core/audio' );
		await tabThroughFileBlock( 'Cover Block Content', 'core/cover' );
		await tabThroughFileBlock( 'File Block Content', 'core/file' );
	} );
} );
