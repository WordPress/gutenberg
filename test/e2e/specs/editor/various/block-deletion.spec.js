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

	test( 'deleting last selected block via backspace', () => {} );

	test( 'deleting last two selected blocks via backspace', () => {} );

	test( 'deleting all blocks', () => {} );

	test( 'deleting all blocks when the default block is unavailable', () => {} );
} );
