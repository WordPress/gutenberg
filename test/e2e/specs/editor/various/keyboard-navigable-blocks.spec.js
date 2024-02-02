/* eslint-disable playwright/expect-expect */

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	KeyboardNavigableBlocks: async ( { editor, page, pageUtils }, use ) => {
		await use( new KeyboardNavigableBlocks( { editor, page, pageUtils } ) );
	},
} );

test.describe( 'Order of block keyboard navigation', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'permits tabbing through paragraph blocks in the expected order', async ( {
		editor,
		KeyboardNavigableBlocks,
		page,
	} ) => {
		const paragraphBlocks = [ 'Paragraph 0', 'Paragraph 1', 'Paragraph 2' ];

		// Create 3 paragraphs blocks with some content.
		for ( const paragraphBlock of paragraphBlocks ) {
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( paragraphBlock );
		}

		// Select the middle block.
		await page.keyboard.press( 'ArrowUp' );
		await editor.showBlockToolbar();
		await KeyboardNavigableBlocks.navigateToContentEditorTop();
		await KeyboardNavigableBlocks.tabThroughParagraphBlock( 'Paragraph 1' );

		// Repeat the same steps to ensure that there is no change introduced in how the focus is handled.
		// This prevents the previous regression explained in: https://github.com/WordPress/gutenberg/issues/11773.
		await KeyboardNavigableBlocks.navigateToContentEditorTop();
		await KeyboardNavigableBlocks.tabThroughParagraphBlock( 'Paragraph 1' );
	} );

	test( 'allows tabbing in navigation mode if no block is selected', async ( {
		editor,
		KeyboardNavigableBlocks,
		page,
	} ) => {
		const paragraphBlocks = [ '0', '1' ];

		// Create 2 paragraphs blocks with some content.
		for ( const paragraphBlock of paragraphBlocks ) {
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( paragraphBlock );
		}

		// Clear the selected block.
		const paragraph = editor.canvas
			.locator( '[data-type="core/paragraph"]' )
			.getByText( '1' );
		const box = await paragraph.boundingBox();
		await page.mouse.click( box.x - 1, box.y );

		await page.keyboard.press( 'Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus( 'Add title' );

		await page.keyboard.press( 'Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus(
			'Paragraph Block. Row 1. 0'
		);

		await page.keyboard.press( 'Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus(
			'Paragraph Block. Row 2. 1'
		);

		await page.keyboard.press( 'Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus( 'Block' );
	} );

	test( 'allows tabbing in navigation mode if no block is selected (reverse)', async ( {
		editor,
		KeyboardNavigableBlocks,
		page,
		pageUtils,
	} ) => {
		const paragraphBlocks = [ '0', '1' ];

		// Create 2 paragraphs blocks with some content.
		for ( const paragraphBlock of paragraphBlocks ) {
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( paragraphBlock );
		}

		// Clear the selected block.
		const paragraph = editor.canvas
			.locator( '[data-type="core/paragraph"]' )
			.getByText( '1' );
		const box = await paragraph.boundingBox();
		await page.mouse.click( box.x - 1, box.y );

		// Put focus behind the block list.
		await page.evaluate( () => {
			document
				.querySelector( '.interface-interface-skeleton__sidebar' )
				.focus();
		} );

		await pageUtils.pressKeys( 'shift+Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus( 'Add block' );

		await pageUtils.pressKeys( 'shift+Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus(
			'Add default block'
		);

		await pageUtils.pressKeys( 'shift+Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus(
			'Paragraph Block. Row 2. 1'
		);

		await pageUtils.pressKeys( 'shift+Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus(
			'Paragraph Block. Row 1. 0'
		);

		await pageUtils.pressKeys( 'shift+Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus( 'Add title' );
	} );

	test( 'should navigate correctly with multi selection', async ( {
		editor,
		KeyboardNavigableBlocks,
		page,
		pageUtils,
	} ) => {
		const paragraphBlocks = [ '0', '1', '2', '3' ];

		// Create 4 paragraphs blocks with some content.
		for ( const paragraphBlock of paragraphBlocks ) {
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( paragraphBlock );
		}
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'shift+ArrowUp' );

		await KeyboardNavigableBlocks.expectLabelToHaveFocus(
			'Multiple selected blocks'
		);

		await page.keyboard.press( 'Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus( 'Block' );

		await pageUtils.pressKeys( 'shift+Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus(
			'Multiple selected blocks'
		);

		await pageUtils.pressKeys( 'shift+Tab' );
		await page.keyboard.press( 'ArrowRight' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus( 'Move up' );
	} );

	test( 'allows the first element within a block to receive focus', async ( {
		editor,
		KeyboardNavigableBlocks,
		page,
	} ) => {
		// Insert a image block.
		await editor.insertBlock( { name: 'core/image' } );

		// Make sure the upload button has focus.
		await KeyboardNavigableBlocks.expectLabelToHaveFocus( 'Upload' );

		// Try to focus the image block wrapper.
		await page.keyboard.press( 'ArrowUp' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus( 'Block: Image' );
	} );

	test( 'allows the block wrapper to gain focus for a group block instead of the first element', async ( {
		editor,
		KeyboardNavigableBlocks,
	} ) => {
		// Insert a group block.
		await editor.insertBlock( { name: 'core/group' } );
		// Select the default, selected Group layout from the variation picker.
		const groupButton = editor.canvas.locator(
			'button[aria-label="Group: Gather blocks in a container."]'
		);

		await groupButton.click();

		// If active label matches, that means focus did not change from group block wrapper.
		await KeyboardNavigableBlocks.expectLabelToHaveFocus( 'Block: Group' );
	} );
} );

class KeyboardNavigableBlocks {
	constructor( { editor, page, pageUtils } ) {
		this.editor = editor;
		this.page = page;
		this.pageUtils = pageUtils;
	}

	async expectLabelToHaveFocus( label ) {
		const ariaLabel = await this.page.evaluate( () => {
			const { activeElement } =
				document.activeElement.contentDocument ?? document;
			return (
				activeElement.getAttribute( 'aria-label' ) ||
				activeElement.innerText
			);
		} );

		expect( ariaLabel ).toBe( label );
	}

	async navigateToContentEditorTop() {
		// Use 'Ctrl+`' to return to the top of the editor.
		await this.pageUtils.pressKeys( 'ctrl+`', { times: 5 } );
	}

	async tabThroughParagraphBlock( paragraphText ) {
		await this.tabThroughBlockToolbar();

		await this.page.keyboard.press( 'Tab' );
		await this.expectLabelToHaveFocus( 'Block: Paragraph' );

		const activeElement = this.editor.canvas.locator( ':focus' );

		await expect( activeElement ).toHaveText( paragraphText );

		await this.page.keyboard.press( 'Tab' );
		await this.expectLabelToHaveFocus( 'Block' );

		// Need to shift+tab here to end back in the block. If not, we'll be in the next region and it will only require 4 region jumps instead of 5.
		await this.pageUtils.pressKeys( 'shift+Tab' );
		await this.expectLabelToHaveFocus( 'Block: Paragraph' );
	}

	async tabThroughBlockToolbar() {
		await this.page.keyboard.press( 'Tab' );
		await this.expectLabelToHaveFocus( 'Paragraph' );

		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( 'Move up' );

		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( 'Move down' );

		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( 'Align text' );

		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( 'Bold' );

		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( 'Italic' );

		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( 'Link' );

		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( 'More' );

		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( 'Options' );

		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( 'Paragraph' );
	}
}

/* eslint-enable playwright/expect-expect */
