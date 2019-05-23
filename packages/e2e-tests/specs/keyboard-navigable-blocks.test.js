/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	navigateToContentEditorTop,
	tabThroughBlockMoverControl,
	tabThroughBlockToolbar,
} from '@wordpress/e2e-test-utils';

const tabThroughParagraphBlock = async ( paragraphText ) => {
	// Tab to the next paragraph block
	await page.keyboard.press( 'Tab' );

	// The block external focusable wrapper has focus
	const isFocusedParagraphBlock = await page.evaluate(
		() => document.activeElement.dataset.type
	);
	await expect( isFocusedParagraphBlock ).toEqual( 'core/paragraph' );

	// Tab causes 'add block' button to receive focus
	await page.keyboard.press( 'Tab' );
	const isFocusedParagraphInserterToggle = await page.evaluate( () =>
		document.activeElement.classList.contains( 'block-editor-inserter__toggle' )
	);
	await expect( isFocusedParagraphInserterToggle ).toBe( true );

	await tabThroughBlockMoverControl();
	await tabThroughBlockToolbar();

	// Tab causes the paragraph content to receive focus
	await page.keyboard.press( 'Tab' );
	const isFocusedParagraphContent = await page.evaluate(
		() => document.activeElement.contentEditable
	);
	// The value of 'contentEditable' should be the string 'true'
	await expect( isFocusedParagraphContent ).toBe( 'true' );

	const paragraphEditableContent = await page.evaluate(
		() => document.activeElement.innerHTML
	);
	await expect( paragraphEditableContent ).toBe( paragraphText );
};

describe( 'Order of block keyboard navigation', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'permits tabbing through paragraph blocks in the expected order', async () => {
		const paragraphBlocks = [ 'Paragraph 0', 'Paragraph 1', 'Paragraph 2' ];

		// create 3 paragraphs blocks with some content
		for ( const paragraphBlock of paragraphBlocks ) {
			await insertBlock( 'Paragraph' );
			await page.keyboard.type( paragraphBlock );
			await page.keyboard.press( 'Enter' );
		}

		await navigateToContentEditorTop();

		for ( const paragraphBlock of paragraphBlocks ) {
			await tabThroughParagraphBlock( paragraphBlock );
		}

		// Repeat the same steps to ensure that there is no change introduced in how the focus is handled.
		// This prevents the previous regression explained in: https://github.com/WordPress/gutenberg/issues/11773.
		await navigateToContentEditorTop();

		for ( const paragraphBlock of paragraphBlocks ) {
			await tabThroughParagraphBlock( paragraphBlock );
		}
	} );
} );
