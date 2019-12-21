/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

async function getActiveLabel() {
	return await page.evaluate( () => {
		return (
			document.activeElement.getAttribute( 'aria-label' ) ||
			document.activeElement.innerHTML
		);
	} );
}

const navigateToContentEditorTop = async () => {
	// Use 'Ctrl+`' to return to the top of the editor
	await pressKeyWithModifier( 'ctrl', '`' );
	await pressKeyWithModifier( 'ctrl', '`' );
};

const tabThroughParagraphBlock = async ( paragraphText ) => {
	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Block: Paragraph' );

	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Add block' );

	await tabThroughBlockMoverControl();
	await tabThroughBlockToolbar();

	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Paragraph block' );
	await expect( await page.evaluate( () =>
		document.activeElement.innerHTML
	) ).toBe( paragraphText );

	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Open publish panel' );
};

const tabThroughBlockMoverControl = async () => {
	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Move up' );

	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Move down' );
};

const tabThroughBlockToolbar = async () => {
	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Change block type or style' );

	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Change text alignment' );

	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Bold' );

	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Italic' );

	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Link' );

	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'More rich text controls' );

	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'More options' );
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
		}

		// Select the middle block.
		await page.keyboard.press( 'ArrowUp' );
		// Move the mouse to show the block toolbar
		await page.mouse.move( 0, 0 );
		await page.mouse.move( 10, 10 );

		await navigateToContentEditorTop();
		await tabThroughParagraphBlock( 'Paragraph 1' );

		// Repeat the same steps to ensure that there is no change introduced in how the focus is handled.
		// This prevents the previous regression explained in: https://github.com/WordPress/gutenberg/issues/11773.
		await navigateToContentEditorTop();
		await tabThroughParagraphBlock( 'Paragraph 1' );
	} );
} );
