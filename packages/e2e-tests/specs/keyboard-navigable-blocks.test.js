/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

const navigateToContentEditorTop = async () => {
	// Use 'Ctrl+`' to return to the top of the editor
	await pressKeyWithModifier( 'ctrl', '`' );
	await pressKeyWithModifier( 'ctrl', '`' );

	// Tab into the Title block
	await page.keyboard.press( 'Tab' );
};

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

const tabThroughBlockMoverControl = async () => {
	// Tab to focus on the 'move up' control
	await page.keyboard.press( 'Tab' );
	const isFocusedMoveUpControl = await page.evaluate( () =>
		document.activeElement.classList.contains( 'block-editor-block-mover__control' )
	);
	await expect( isFocusedMoveUpControl ).toBe( true );

	// Tab to focus on the 'move down' control
	await page.keyboard.press( 'Tab' );
	const isFocusedMoveDownControl = await page.evaluate( () =>
		document.activeElement.classList.contains( 'block-editor-block-mover__control' )
	);
	await expect( isFocusedMoveDownControl ).toBe( true );
};

const tabThroughBlockToolbar = async () => {
	// Tab to focus on the 'block switcher' control
	await page.keyboard.press( 'Tab' );
	const isFocusedBlockSwitcherControl = await page.evaluate( () =>
		document.activeElement.classList.contains(
			'block-editor-block-switcher__toggle'
		)
	);
	await expect( isFocusedBlockSwitcherControl ).toBe( true );

	// Tab to focus on the 'Change text alignment' dropdown control
	await page.keyboard.press( 'Tab' );
	const isFocusedChangeTextAlignmentControl = await page.evaluate( () =>
		document.activeElement.classList.contains( 'components-dropdown-menu__toggle' )
	);
	await expect( isFocusedChangeTextAlignmentControl ).toBe( true );

	// Tab to focus on the 'More formatting' dropdown toggle
	await page.keyboard.press( 'Tab' );
	const isFocusedBlockSettingsDropdown = await page.evaluate( () =>
		document.activeElement.classList.contains( 'components-dropdown-menu__toggle' )
	);
	await expect( isFocusedBlockSettingsDropdown ).toBe( true );
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
