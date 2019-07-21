/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertAndPopulateBlock,
	navigateToContentEditorTop,
	tabThroughBlockMoverControl,
	tabThroughBlockToolbar,
	tabThroughPlaceholderButtons,
	textContentAreas,
} from '@wordpress/e2e-test-utils';

/**
 * External dependencies
 */

const externalWrapperHasFocus = async ( blockType ) => {
	const activeElementDataType = await page.evaluate( () => document.activeElement.dataset.type );
	await expect( activeElementDataType ).toEqual( blockType );
};

const inserterToggleHasFocus = async () => {
	const isFocusedInserterToggle = await page.evaluate( () => document.activeElement.classList.contains( 'block-editor-inserter__toggle' ) );
	await expect( isFocusedInserterToggle ).toBe( true );
};

const textContentAreasHaveFocus = async ( content ) => {
	const blocks = await textContentAreas( { empty: false } );
	const isFocusedTextContentArea = await page.evaluate( () => document.activeElement.contentEditable );
	const textContentAreaContent = await page.evaluate( () => document.activeElement.innerHTML );

	for ( let i = 0; i < blocks.length; i++ ) {
		if ( i > 0 ) {
			await page.keyboard.press( 'Tab' );
		}

		// The value of 'contentEditable' should be the string 'true'
		await expect( isFocusedTextContentArea ).toBe( 'true' );
		await expect( textContentAreaContent ).toContain( content );
	}
};

const tabThroughBlock = async ( content, blockType ) => {
	// Tab to the next block
	await page.keyboard.press( 'Tab' );
	await externalWrapperHasFocus( blockType );

	// Tab causes 'add block' button to receive focus
	await page.keyboard.press( 'Tab' );
	await inserterToggleHasFocus();

	await tabThroughBlockMoverControl();
	await tabThroughBlockToolbar();
};

const tabThroughTextBlock = async ( content, blockType ) => {
	await tabThroughBlock( content, blockType );

	// Tab causes the block text content to receive focus
	await page.keyboard.press( 'Tab' );
	await textContentAreasHaveFocus( content );
};

const tabThroughFileBlock = async ( content, blockType ) => {
	await tabThroughBlock( content, blockType );
	await tabThroughPlaceholderButtons();
};

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
