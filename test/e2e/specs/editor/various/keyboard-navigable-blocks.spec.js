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
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.openDocumentSettingsSidebar();
	} );

	test( 'permits tabbing through the block toolbar of the paragraph block', async ( {
		editor,
		KeyboardNavigableBlocks,
		page,
		pageUtils,
	} ) => {
		// Insert three paragraph blocks.
		for ( let i = 0; i < 3; i++ ) {
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( `Paragraph ${ i + 1 }` );
		}
		// Select the middle paragraph block.
		await page.keyboard.press( 'ArrowUp' );
		await editor.showBlockToolbar();
		await pageUtils.pressKeys( 'shift+Tab' );
		await KeyboardNavigableBlocks.navigateThroughBlockToolbar();
		await page.keyboard.press( 'Tab' );
		await KeyboardNavigableBlocks.expectLabelToHaveFocus(
			'Block: Paragraph'
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

	async navigateThroughBlockToolbar() {
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
