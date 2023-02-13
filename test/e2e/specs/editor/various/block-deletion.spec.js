/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block deletion', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'deleting last block via the Block Toolbar options menu', async ( {
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

		// Make sure the last paragraph is focused.
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

		// Make sure the last block was removed.
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toContainText( 'Second' );

		// Make sure the caret is in a correct position.
		await page.keyboard.type( '| ← caret was here' );
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toContainText( 'Second| ← caret was here' );
	} );

	test( 'deleting last block via the Remove Block shortcut', async ( {
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

		// Make sure the last paragraph is focused.
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toBeFocused();

		// Remove the current paragraph via dedicated keyboard shortcut.
		await pageUtils.pressKeyWithModifier( 'access', 'z' );

		// Make sure the last block was removed.
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toContainText( 'Second' );

		// Make sure the caret is in a correct position.
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

		// Leave last paragraph empty and make sure it's focused.
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await expect(
			editor.canvas.getByRole( 'document', { name: /Empty block/ } )
		).toBeFocused();

		// Hit backspace to remove the empty paragraph.
		await page.keyboard.press( 'Backspace' );

		// Make sure the last block was removed.
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Paragraph block',
				} )
				.last()
		).toContainText( 'Second' );

		// Make sure the caret is in a correct position.
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

	test( 'deleting all blocks', () => {} );

	test( 'deleting all blocks when the default block is unavailable', () => {} );
} );
