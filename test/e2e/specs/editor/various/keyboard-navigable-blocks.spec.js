/* eslint-disable playwright/expect-expect */
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

test.describe( 'Canvas as a single tab stop', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	async function hasTextSelection( page ) {
		return page.evaluate( () => {
			const { getSelectionStart } =
				window.wp.data.select( 'core/block-editor' );
			return getSelectionStart().attributeKey !== undefined;
		} );
	}

	test( 'Escape steps out onto the canvas stop and Enter goes back in', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.canvas.getByText( 'First' ).click();
		await expect.poll( () => hasTextSelection( page ) ).toBe( true );

		await page.keyboard.press( 'Escape' );
		const stopBefore = page.getByRole( 'button', {
			name: 'Editor canvas',
		} );
		await expect( stopBefore ).toBeFocused();
		// The focused stop shows its hint badge.
		await expect(
			page.getByText( 'Press Enter to edit the document' )
		).toBeVisible();

		// The block selection is left as it is.
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/paragraph', attributes: { content: 'First' } },
			] );

		// Tab from the stop skips the whole canvas onwards.
		await page.keyboard.press( 'Tab' );
		await expect
			.poll( () =>
				page.evaluate( () =>
					Boolean(
						document.activeElement.closest(
							'[aria-label="Editor settings"]'
						)
					)
				)
			)
			.toBe( true );

		// Shift+Tab from the sidebar enters the canvas directly: focus
		// arriving on the stop engages it.
		await page.keyboard.press( 'Shift+Tab' );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
		).toBeFocused();
		await expect.poll( () => hasTextSelection( page ) ).toBe( true );

		// From a parked stop, Shift+Tab reaches the block toolbar floating
		// over the canvas.
		await page.keyboard.press( 'Escape' );
		await expect( stopBefore ).toBeFocused();
		await page.keyboard.press( 'Shift+Tab' );
		await expect
			.poll( () =>
				page.evaluate( () =>
					Boolean(
						document.activeElement.closest(
							'[aria-label="Block tools"]'
						)
					)
				)
			)
			.toBe( true );

		// Tab from the toolbar enters the canvas directly too.
		await page.keyboard.press( 'Tab' );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
		).toBeFocused();

		// Enter on the stop goes back to where focus left the canvas.
		await page.keyboard.press( 'Escape' );
		await expect( stopBefore ).toBeFocused();
		await page.keyboard.press( 'Enter' );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
		).toBeFocused();
		await expect.poll( () => hasTextSelection( page ) ).toBe( true );
	} );

	test( 'Escape on the stop goes back in too', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.canvas.getByText( 'First' ).click();

		await page.keyboard.press( 'Escape' );
		await expect(
			page.getByRole( 'button', { name: 'Editor canvas' } )
		).toBeFocused();

		await page.keyboard.press( 'Escape' );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
		).toBeFocused();
	} );
} );

class KeyboardNavigableBlocks {
	constructor( { editor, page, pageUtils } ) {
		this.editor = editor;
		this.page = page;
		this.pageUtils = pageUtils;
	}

	async expectLabelToHaveFocus( label ) {
		// Poll: the focused element and its label may settle asynchronously
		// (selection changes sync to the store on `selectionchange`).
		await expect.poll( this.editor.getFocusOwnerLabel ).toBe( label );
	}

	async navigateThroughBlockToolbar() {
		await this.expectLabelToHaveFocus( 'Paragraph' );

		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( 'Move up' );

		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( 'Move down' );

		await this.page.keyboard.press( 'ArrowRight' );
		await this.expectLabelToHaveFocus( 'Align block' );

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
