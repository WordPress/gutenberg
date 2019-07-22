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

		await tabThroughTextBlock( 'core/heading', 'Heading Block Content' );
		await tabThroughTextBlock( 'core/quote', 'Quote Block Content' );
		await tabThroughTextBlock( 'core/list', 'List Block Content' );
		await tabThroughTextBlock( 'core/paragraph', 'Paragraph Block Content' );
		await tabThroughFileBlock( 'core/image' );
		await tabThroughFileBlock( 'core/gallery' );
		await tabThroughFileBlock( 'core/audio' );
		await tabThroughFileBlock( 'core/cover' );
		await tabThroughFileBlock( 'core/file' );
	} );
} );
