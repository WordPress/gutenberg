/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block deletion', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'deleting the last block via its options menu', async ( {
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
					name: 'Block: Paragraph',
				} )
				.last()
		).toBeFocused();

		// Remove the current paragraph via the Block Toolbar options menu.
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Delete' } ).click();

		// Ensure the last block was removed.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: 'First' } },
			{ name: 'core/paragraph', attributes: { content: 'Second' } },
		] );

		// Ensure the caret is in a correct position.
		await page.keyboard.type( '| ← caret was here' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: 'First' } },
			{
				name: 'core/paragraph',
				attributes: { content: 'Second| ← caret was here' },
			},
		] );
	} );

	// this test should be moved to a new testing story about focus management.
	test( 'deleting a block focuses the parent block', async ( {
		editor,
		page,
	} ) => {
		// Add a group with a paragraph in it.
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Paragraph child of group' },
				},
			],
		} );

		// Select the paragraph.
		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await editor.selectBlocks( paragraph );

		// Remove the current paragraph via the Block Toolbar options menu.
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Delete' } ).click();

		// Ensure the paragraph was removed.
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { name: 'core/group', attributes: {} } ] );

		// Ensure the group block is focused.
		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Block: Group',
				} )
				.last()
		).toBeFocused();
	} );

	test( 'deleting the last block via the keyboard shortcut', async ( {
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
					name: 'Block: Paragraph',
				} )
				.last()
		).toBeFocused();

		// Remove the current paragraph via dedicated keyboard shortcut.
		await pageUtils.pressKeys( 'access+z' );

		// Ensure the last block was removed.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: 'First' } },
			{ name: 'core/paragraph', attributes: { content: 'Second' } },
		] );

		// Ensure the caret is in a correct position.
		await page.keyboard.type( '| ← caret was here' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: 'First' } },
			{
				name: 'core/paragraph',
				attributes: { content: 'Second| ← caret was here' },
			},
		] );
	} );

	test( 'deleting the last block via backspace from an empty paragraph', async ( {
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
			editor.canvas.getByRole( 'document', { name: 'Empty block' } )
		).toBeFocused();

		// Hit backspace to remove the empty paragraph.
		await page.keyboard.press( 'Backspace' );

		// Ensure the last block was removed.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: 'First' } },
			{ name: 'core/paragraph', attributes: { content: 'Second' } },
		] );

		// Ensure the caret is in a correct position.
		await page.keyboard.type( '| ← caret was here' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: 'First' } },
			{
				name: 'core/paragraph',
				attributes: { content: 'Second| ← caret was here' },
			},
		] );
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
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: 'First' } },
			{ name: 'core/paragraph', attributes: { content: 'Second' } },
		] );

		// Ensure the caret is in a correct position.
		await page.keyboard.type( '| ← caret was here' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: 'First' } },
			{
				name: 'core/paragraph',
				attributes: { content: 'Second| ← caret was here' },
			},
		] );
	} );

	test( 'deleting the last two selected blocks via backspace', async ( {
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
				name: 'Empty block',
			} )
		).toBeFocused();

		// Select the last two paragraphs.
		await pageUtils.pressKeys( 'shift+ArrowUp' );
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data
						.select( 'core/block-editor' )
						.getMultiSelectedBlocks()
				)
			)
			.toHaveLength( 2 );

		// Hit backspace and ensure the last two paragraphs were deleted, and an
		// empty block was created.
		await page.keyboard.press( 'Backspace' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph', attributes: { content: 'First' } },
			{ name: 'core/paragraph', attributes: { content: 'Second' } },
			{ name: 'core/paragraph', attributes: { content: '' } },
		] );

		// Ensure that the newly created empty block is focused.
		await expect.poll( editor.getBlocks ).toHaveLength( 3 );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Empty block',
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
				name: 'Block: Paragraph',
			} )
		).toBeFocused();

		// Remove that paragraph via its options menu.
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Delete' } ).click();

		// Ensure an empty block was created and focused.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Empty block',
			} )
		).toBeFocused();
		await expect.poll( editor.getBlocks ).toEqual( [] );
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
				const defaultBlockName = window.wp.data
					.select( 'core/blocks' )
					.getDefaultBlockName();
				window.wp.data
					.dispatch( 'core/blocks' )
					.removeBlockTypes( defaultBlockName );
				return true;
			} catch {
				return false;
			}
		} );

		// Add the Image block.
		await editor.insertBlock( { name: 'core/image' } );
		const imageBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );

		// Initially, the "Upload" button is focused, so we need to move focus
		// up to the block wrapper.
		await expect(
			imageBlock.getByRole( 'button', { name: 'Upload' } )
		).toBeFocused();
		await page.keyboard.press( 'ArrowUp' );
		await expect( imageBlock ).toBeFocused();

		// Hit backspace to remove the Image block.
		await page.keyboard.press( 'Backspace' );

		// Ensure that there's no blocks.
		await expect.poll( editor.getBlocks ).toHaveLength( 0 );
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Empty block' } )
		).toBeHidden();

		// Ensure that the block appender button is visible.
		await expect(
			editor.canvas.getByRole( 'button', { name: 'Add block' } )
		).toBeVisible();

		// TODO: There should be expectations around where focus is placed in
		// this scenario. Currently, a focus loss occurs, which is unacceptable.
	} );
} );
