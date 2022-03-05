/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	pressKeyWithModifier,
	clickBlockAppender,
	getEditedPostContent,
	showBlockToolbar,
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
	// Use 'Ctrl+`' to return to the top of the editor.
	await pressKeyWithModifier( 'ctrl', '`' );
	await pressKeyWithModifier( 'ctrl', '`' );
};

const tabThroughParagraphBlock = async ( paragraphText ) => {
	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Add block' );

	await tabThroughBlockToolbar();

	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Paragraph block' );
	await expect(
		await page.evaluate( () => document.activeElement.innerHTML )
	).toBe( paragraphText );

	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Open document settings' );
};

const tabThroughBlockToolbar = async () => {
	await page.keyboard.press( 'Tab' );
	await expect( await getActiveLabel() ).toBe( 'Paragraph' );

	await page.keyboard.press( 'ArrowRight' );
	await expect( await getActiveLabel() ).toBe( 'Move up' );

	await page.keyboard.press( 'ArrowRight' );
	await expect( await getActiveLabel() ).toBe( 'Move down' );

	await page.keyboard.press( 'ArrowRight' );
	await expect( await getActiveLabel() ).toBe( 'Align' );

	await page.keyboard.press( 'ArrowRight' );
	await expect( await getActiveLabel() ).toBe( 'Bold' );

	await page.keyboard.press( 'ArrowRight' );
	await expect( await getActiveLabel() ).toBe( 'Italic' );

	await page.keyboard.press( 'ArrowRight' );
	await expect( await getActiveLabel() ).toBe( 'Link' );

	await page.keyboard.press( 'ArrowRight' );
	await expect( await getActiveLabel() ).toBe( 'More' );

	await page.keyboard.press( 'ArrowRight' );
	await expect( await getActiveLabel() ).toBe( 'Options' );

	await page.keyboard.press( 'ArrowRight' );
	await expect( await getActiveLabel() ).toBe( 'Paragraph' );
};

describe( 'Order of block keyboard navigation', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'permits tabbing through paragraph blocks in the expected order', async () => {
		const paragraphBlocks = [ 'Paragraph 0', 'Paragraph 1', 'Paragraph 2' ];

		// Create 3 paragraphs blocks with some content.
		for ( const paragraphBlock of paragraphBlocks ) {
			await insertBlock( 'Paragraph' );
			await page.keyboard.type( paragraphBlock );
		}

		// Select the middle block.
		await page.keyboard.press( 'ArrowUp' );
		await showBlockToolbar();
		await navigateToContentEditorTop();
		await tabThroughParagraphBlock( 'Paragraph 1' );

		// Repeat the same steps to ensure that there is no change introduced in how the focus is handled.
		// This prevents the previous regression explained in: https://github.com/WordPress/gutenberg/issues/11773.
		await navigateToContentEditorTop();
		await tabThroughParagraphBlock( 'Paragraph 1' );
	} );

	it( 'allows tabbing in navigation mode if no block is selected', async () => {
		const paragraphBlocks = [ '0', '1' ];

		// Create 2 paragraphs blocks with some content.
		for ( const paragraphBlock of paragraphBlocks ) {
			await insertBlock( 'Paragraph' );
			await page.keyboard.type( paragraphBlock );
		}

		// Clear the selected block.
		const paragraph = await page.$( '[data-type="core/paragraph"]' );
		const box = await paragraph.boundingBox();
		await page.mouse.click( box.x - 1, box.y );

		await page.keyboard.press( 'Tab' );
		await expect(
			await page.evaluate( () => {
				return document.activeElement.getAttribute( 'aria-label' );
			} )
		).toBe( 'Add title' );

		await page.keyboard.press( 'Tab' );
		await expect( await getActiveLabel() ).toBe(
			'Paragraph Block. Row 1. 0'
		);

		await page.keyboard.press( 'Tab' );
		await expect( await getActiveLabel() ).toBe(
			'Paragraph Block. Row 2. 1'
		);

		await page.keyboard.press( 'Tab' );
		await expect( await getActiveLabel() ).toBe( 'Open document settings' );
	} );

	it( 'allows tabbing in navigation mode if no block is selected (reverse)', async () => {
		const paragraphBlocks = [ '0', '1' ];

		// Create 2 paragraphs blocks with some content.
		for ( const paragraphBlock of paragraphBlocks ) {
			await insertBlock( 'Paragraph' );
			await page.keyboard.type( paragraphBlock );
		}

		// Clear the selected block.
		const paragraph = await page.$( '[data-type="core/paragraph"]' );
		const box = await paragraph.boundingBox();
		await page.mouse.click( box.x - 1, box.y );

		// Put focus behind the block list.
		await page.evaluate( () => {
			document
				.querySelector( '.interface-interface-skeleton__sidebar' )
				.focus();
		} );

		await pressKeyWithModifier( 'shift', 'Tab' );
		await expect( await getActiveLabel() ).toBe( 'Add block' );

		await pressKeyWithModifier( 'shift', 'Tab' );
		await expect( await getActiveLabel() ).toBe( 'Add default block' );

		await pressKeyWithModifier( 'shift', 'Tab' );
		await expect( await getActiveLabel() ).toBe(
			'Paragraph Block. Row 2. 1'
		);

		await pressKeyWithModifier( 'shift', 'Tab' );
		await expect( await getActiveLabel() ).toBe(
			'Paragraph Block. Row 1. 0'
		);

		await pressKeyWithModifier( 'shift', 'Tab' );
		await expect(
			await page.evaluate( () => {
				return document.activeElement.getAttribute( 'aria-label' );
			} )
		).toBe( 'Add title' );
	} );

	it( 'should navigate correctly with multi selection', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '4' );
		await page.keyboard.press( 'ArrowUp' );
		await pressKeyWithModifier( 'shift', 'ArrowUp' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		expect( await getActiveLabel() ).toBe( 'Multiple selected blocks' );

		await page.keyboard.press( 'Tab' );
		await expect( await getActiveLabel() ).toBe( 'Post' );

		await pressKeyWithModifier( 'shift', 'Tab' );
		await expect( await getActiveLabel() ).toBe(
			'Multiple selected blocks'
		);

		await pressKeyWithModifier( 'shift', 'Tab' );
		await page.keyboard.press( 'ArrowRight' );
		await expect( await getActiveLabel() ).toBe( 'Move up' );
	} );

	it( 'allows the first element within a block to receive focus', async () => {
		// Insert a image block.
		await insertBlock( 'Image' );

		const uploadButton = await page.waitForXPath(
			'//button[contains( text(), "Upload" ) ]'
		);

		// Make sure the upload button has focus.
		await expect( uploadButton ).toHaveFocus();

		// Try to focus the image block wrapper.
		await page.keyboard.press( 'ArrowUp' );
		await expect( await getActiveLabel() ).toBe( 'Block: Image' );
	} );

	it( 'allows the block wrapper to gain focus for a group block instead of the first element', async () => {
		// Insert a group block.
		await insertBlock( 'Group' );

		// If active label matches, that means focus did not change from block wrapper.
		await expect( await getActiveLabel() ).toBe( 'Block: Group' );
	} );
} );
