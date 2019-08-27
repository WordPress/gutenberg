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

describe( 'Order of block keyboard navigation', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	describe( 'Order of heading block keyboard navigation', () => {
		it( 'permits tabbing through heading blocks in the expected order', async () => {
			await insertAndPopulateBlock( 'Heading', 'Heading Block Content' );

			await navigateToContentEditorTop();

			await tabThroughTextBlock( 'core/heading', 'Heading Block Content' );
		} );
	} );

	describe( 'Order of quote block keyboard navigation', () => {
		it( 'permits tabbing through quote blocks in the expected order', async () => {
			await insertAndPopulateBlock( 'Quote', 'Quote Block Content' );
			// in order to see the block mover controls, we must insert more than one of these blocks:
			await insertAndPopulateBlock( 'Quote', 'Quote Block 2 Content' );

			await navigateToContentEditorTop();

			await tabThroughTextBlock( 'core/quote', 'Quote Block Content' );
		} );
	} );

	describe( 'Order of list block keyboard navigation', () => {
		it( 'permits tabbing through list blocks in the expected order', async () => {
			await insertAndPopulateBlock( 'List', 'List Block Content' );
			// in order to see the block mover controls, we must insert more than one of these blocks:
			await insertAndPopulateBlock( 'List', 'List Block 2 Content' );

			await navigateToContentEditorTop();

			await tabThroughTextBlock( 'core/list', 'List Block Content' );
		} );
	} );

	describe( 'Order of paragraph block keyboard navigation', () => {
		it( 'permits tabbing through paragraph blocks in the expected order', async () => {
			await insertAndPopulateBlock( 'Paragraph', 'Paragraph Block Content' );
			// in order to see the block mover controls, we must insert more than one of these blocks:
			await insertAndPopulateBlock( 'Paragraph', 'Paragraph Block 2 Content' );

			await navigateToContentEditorTop();

			await tabThroughTextBlock( 'core/paragraph', 'Paragraph Block Content' );
		} );
	} );

	describe( 'Order of image block keyboard navigation', () => {
		it( 'permits tabbing through image blocks in the expected order', async () => {
			await insertAndPopulateBlock( 'Image', 'Image Block Content' );
			// in order to see the block mover controls, we must insert more than one of these blocks:
			await insertAndPopulateBlock( 'Image', 'Image Block 2 Content' );

			await navigateToContentEditorTop();

			await tabThroughFileBlock( 'core/image' );
		} );
	} );

	describe( 'Order of gallery block keyboard navigation', () => {
		it( 'permits tabbing through gallery blocks in the expected order', async () => {
			await insertAndPopulateBlock( 'Gallery', 'Gallery Block Content' );
			// in order to see the block mover controls, we must insert more than one of these blocks:
			await insertAndPopulateBlock( 'Gallery', 'Gallery Block 2 Content' );

			await navigateToContentEditorTop();

			await tabThroughFileBlock( 'core/gallery' );
		} );
	} );

	describe( 'Order of audio block keyboard navigation', () => {
		it( 'permits tabbing through audio blocks in the expected order', async () => {
			await insertAndPopulateBlock( 'Audio', 'Audio Block Content' );
			// in order to see the block mover controls, we must insert more than one of these blocks:
			await insertAndPopulateBlock( 'Audio', 'Audio Block 2 Content' );

			await navigateToContentEditorTop();

			await tabThroughFileBlock( 'core/audio' );
		} );
	} );

	describe( 'Order of cover block keyboard navigation', () => {
		it( 'permits tabbing through cover blocks in the expected order', async () => {
			await insertAndPopulateBlock( 'Cover', 'Cover Block 2 Content' );
			// in order to see the block mover controls, we must insert more than one of these blocks:
			await insertAndPopulateBlock( 'Cover', 'Cover Block Content' );

			await navigateToContentEditorTop();

			await tabThroughFileBlock( 'core/cover' );
		} );
	} );

	describe( 'Order of file block keyboard navigation', () => {
		it( 'permits tabbing through file blocks in the expected order', async () => {
			await insertAndPopulateBlock( 'File', 'File Block Content' );
			// in order to see the block mover controls, we must insert more than one of these blocks:
			await insertAndPopulateBlock( 'File', 'File Block 2 Content' );

			await navigateToContentEditorTop();

			await tabThroughFileBlock( 'core/file' );
		} );
	} );
} );
