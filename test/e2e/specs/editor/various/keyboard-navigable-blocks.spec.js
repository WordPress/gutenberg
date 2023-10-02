/* eslint-disable playwright/expect-expect */

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	KeyboardNavigableBlocks: async ( { page }, use ) => {
		await use( new KeyboardNavigableBlocks( { page } ) );
	},
} );

test.describe( 'Order of block keyboard navigation', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'permits arrowing through paragraph blocks in the expected order', async ( {
		editor,
		page,
	} ) => {
		// Add a title
		await page.keyboard.type( 'Post Title' );
		const paragraphBlocks = [ 'Paragraph 0', 'Paragraph 1', 'Paragraph 2' ];

		// Create 3 paragraphs blocks with some content.
		for ( const paragraphBlock of paragraphBlocks ) {
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( paragraphBlock );
		}

		// Focus should be on the last pargraph block.
		const activeElement = editor.canvas.locator( ':focus' );
		await expect( activeElement ).toHaveText( 'Paragraph 2' );

		await page.keyboard.press( 'ArrowUp' );
		await expect( activeElement ).toHaveText( 'Paragraph 1' );

		await page.keyboard.press( 'ArrowUp' );
		await expect( activeElement ).toHaveText( 'Paragraph 0' );

		await page.keyboard.press( 'ArrowUp' );
		await expect( activeElement ).toHaveText( 'Post Title' );

		// Go back down
		await page.keyboard.press( 'ArrowDown' );
		await expect( activeElement ).toHaveText( 'Paragraph 0' );

		await page.keyboard.press( 'ArrowDown' );
		await expect( activeElement ).toHaveText( 'Paragraph 1' );

		await page.keyboard.press( 'ArrowDown' );
		await expect( activeElement ).toHaveText( 'Paragraph 2' );
	} );

	test( 'allows tabbing in navigation mode if no block is selected', async ( {
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

		// Clear the selected block and switch to Select mode
		await page.keyboard.press( 'Escape' );
		// Move focus into the sidebar
		await page.keyboard.press( 'Tab' );
		const activeElement = page.locator( ':focus' );
		await expect( activeElement ).toHaveText( 'Post' );

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

		// Make sure it works tabbing back through in sequence
		await pageUtils.pressKeys( 'Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus(
			'Paragraph Block. Row 1. 0'
		);

		await pageUtils.pressKeys( 'Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus(
			'Paragraph Block. Row 2. 1'
		);
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
		await KeyboardNavigableBlocks.expectLabelToHaveFocus( 'Post' );

		await pageUtils.pressKeys( 'shift+Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus(
			'Multiple selected blocks'
		);

		await pageUtils.pressKeys( 'alt+F10' );
		await page.keyboard.press( 'ArrowRight' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus( 'Move up' );
		// Return focus to the editor
		await page.keyboard.press( 'Escape' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus(
			'Multiple selected blocks'
		);
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
		page,
	} ) => {
		// Insert a group block.
		await editor.insertBlock( { name: 'core/group' } );

		const activeElement = editor.canvas.locator( ':focus' );

		await expect( activeElement ).toHaveAttribute(
			'aria-label',
			'Group: Gather blocks in a container.'
		);

		await page.keyboard.press( 'Enter' );

		// If active label matches, that means focus did not change from group block wrapper.
		await expect( activeElement ).toHaveAttribute(
			'aria-label',
			'Block: Group'
		);
	} );
} );

class KeyboardNavigableBlocks {
	constructor( { page } ) {
		this.page = page;
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
}

/* eslint-enable playwright/expect-expect */
