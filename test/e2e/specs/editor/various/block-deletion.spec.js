/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block deletion', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'deleting last block via its options menu', async ( {
		editor,
		page,
	} ) => {
		// Add a couple of paragraphs.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Third' },
		} );

		// Ensure the last paragraph is focused.
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toBeFocused();

		// Remove the current paragraph via the Block Toolbar options menu.
		await editor.showBlockToolbar();
		await editor.canvas
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page
			.getByRole( 'menuitem', { name: /Remove Paragraph/ } )
			.click();

		// Ensure the last block was removed.
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toContainText( 'Second' );

		// Ensure the caret is in a correct position.
		await page.keyboard.type( '| ← caret was here' );
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toContainText( 'Second| ← caret was here' );
	} );

	test( 'deleting last block via the keyboard shortcut', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add a couple of paragraphs.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Third' },
		} );

		// Ensure the last paragraph is focused.
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toBeFocused();

		// Remove the current paragraph via dedicated keyboard shortcut.
		await pageUtils.pressKeyWithModifier( 'access', 'z' );

		// Ensure the last block was removed.
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toContainText( 'Second' );

		// Ensure the caret is in a correct position.
		await page.keyboard.type( '| ← caret was here' );
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toContainText( 'Second| ← caret was here' );
	} );

	test( 'deleting last block via backspace from an empty paragraph', async ( {
		editor,
		page,
	} ) => {
		// Add a couple of paragraphs.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second' },
		} );

		// Leave last paragraph empty and ensure it's focused.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await expect(
			editor.canvas.getByRole( 'document', { name: /Empty block/ } )
		).toBeFocused();

		// Hit backspace to remove the empty paragraph.
		await page.keyboard.press( 'Backspace' );

		// Ensure the last block was removed.
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toContainText( 'Second' );

		// Ensure the caret is in a correct position.
		await page.keyboard.type( '| ← caret was here' );
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toContainText( 'Second| ← caret was here' );
	} );

	test( 'deleting last selected block via backspace', async ( {
		editor,
		page,
	} ) => {
		// Add a couple of paragraphs.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second' },
		} );

		// Add the Image block and focus it.
		await editor.insertBlock( {
			name: 'core/image',
		} );
		const imageBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		await expect(
			imageBlock.getByRole( 'button', { name: 'Upload' } )
		).toBeFocused();
		await page.keyboard.press( 'ArrowUp' );
		await expect( imageBlock ).toBeFocused();

		// Hit backspace and ensure the Image block was removed.
		await page.keyboard.press( 'Backspace' );
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toContainText( 'Second' );

		// Ensure the caret is in a correct position.
		await page.keyboard.type( '| ← caret was here' );
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toContainText( 'Second| ← caret was here' );
	} );

	test( 'deleting last two selected blocks via backspace', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add a couple of paragraphs.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Third' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );

		// Ensure the empty paragraph is focused.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: /Empty block/i,
			} )
		).toBeFocused();

		// Select the last two paragraphs.
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowUp' );
		await expect(
			editor.canvas.locator( 'p.is-multi-selected' )
		).toHaveCount( 2 );

		// Hit backspace and ensure the last two paragraphs were deleted.
		await page.keyboard.press( 'Backspace' );
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toContainText( 'Second' );

		// Ensure a new empty block was created and focused.
		await expect.poll( editor.getBlocks ).toHaveLength( 3 );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: /Empty block/i,
			} )
		).toBeFocused();
	} );

	test( 'deleting all blocks', async ( { editor, page } ) => {
		// Add one paragraph with content and ensure it's focused.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test' },
		} );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Paragraph block',
			} )
		).toBeFocused();

		// Remove that paragraph via its options menu.
		await editor.showBlockToolbar();
		await editor.canvas
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page
			.getByRole( 'menuitem', { name: /Remove Paragraph/ } )
			.click();

		// Ensure an empty block was created and focused.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: /Empty block/i,
			} )
		).toBeFocused();
	} );

	/**
	 * Regression Test: Previously, removing a block would not clear
	 * selection state when there were no other blocks to select.
	 *
	 * See: https://github.com/WordPress/gutenberg/issues/15458
	 * See: https://github.com/WordPress/gutenberg/pull/15543
	 */
	test( 'deleting all blocks when the default block is unavailable', async ( {
		editor,
		page,
	} ) => {
		// Unregister default block type. This may happen if the editor is
		// configured to not allow the default (paragraph) block type, either
		// by plugin editor settings filtering or user block preferences.
		await page.waitForFunction( () => {
			try {
				// eslint-disable-next-line no-undef
				const defaultBlockName = wp.data
					.select( 'core/blocks' )
					.getDefaultBlockName();
				// eslint-disable-next-line no-undef
				wp.data
					.dispatch( 'core/blocks' )
					.removeBlockTypes( defaultBlockName );
				return true;
			} catch {
				return false;
			}
		} );

		// Add the Image block and remove it.
		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		await expect(
			imageBlock.getByRole( 'button', { name: 'Upload' } )
		).toBeFocused();
		await page.keyboard.press( 'ArrowUp' );
		await expect( imageBlock ).toBeFocused();
		await page.keyboard.press( 'Backspace' );

		// Verify that there's no blocks and only the block appender button is
		// visible.
		await expect.poll( editor.getBlocks ).toHaveLength( 0 );
		await expect(
			editor.canvas.getByRole( 'document', { name: /Empty block/i } )
		).not.toBeVisible();
		await expect(
			editor.canvas.getByRole( 'button', { name: 'Add block' } )
		).toBeVisible();
		// TODO: There should be expectations around where focus is placed in
		// this scenario. Currently, a focus loss occurs, which is unacceptable.
	} );
} );
