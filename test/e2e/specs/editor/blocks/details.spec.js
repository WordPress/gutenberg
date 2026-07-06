/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const LINE_START_KEY =
	process.platform === 'darwin' ? 'Meta+ArrowLeft' : 'Home';

test.describe( 'Details', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can toggle hidden blocks by pressing enter', async ( {
		editor,
		page,
	} ) => {
		// Insert a details block with empty inner blocks.
		await editor.insertBlock( {
			name: 'core/details',
			attributes: {
				summary: 'Details summary',
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Details content',
					},
				},
			],
		} );

		// Open the details block.
		await page.keyboard.press( 'Enter' );

		// The inner block should be visible.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toContainText( 'Details content' );

		// Close the details block.
		await page.keyboard.press( 'Enter' );

		// The inner block should be hidden.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toBeHidden();
	} );

	test( 'can create a multiline summary with Shift+Enter', async ( {
		editor,
		page,
	} ) => {
		// Insert a details block.
		await editor.insertBlock( {
			name: 'core/details',
		} );

		const summary = editor.canvas.getByRole( 'textbox', {
			name: 'Write summary',
		} );

		// Add a multiline summary.
		await summary.type( 'First line' );
		await page.keyboard.press( 'Shift+Enter' );
		await summary.type( 'Second line' );

		// Verify the summary is multiline.
		await expect( summary ).toHaveText( 'First line\nSecond line', {
			useInnerText: true,
		} );
	} );

	test( 'typing space in summary rich-text should not toggle details', async ( {
		editor,
	} ) => {
		// Insert a details block.
		await editor.insertBlock( {
			name: 'core/details',
		} );

		const summary = editor.canvas.getByRole( 'textbox', {
			name: 'Write summary',
		} );

		// Type space in the summary rich-text.
		await summary.type( ' ' );

		// Verify the details block is not toggled.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Empty block' } )
		).toBeHidden();
	} );

	test( 'removes the block when pressing Backspace in an empty summary', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/details',
		} );

		const summary = editor.canvas.getByRole( 'textbox', {
			name: 'Write summary',
		} );

		await summary.click();
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getBlocks ).toEqual( [] );
	} );

	test( 'moves focus to the summary when pressing Backspace at the start of body content', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/details',
			attributes: {
				summary: 'Details summary',
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Details content',
					},
				},
			],
		} );

		await page.keyboard.press( 'Enter' );

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );

		await expect( paragraph ).toContainText( 'Details content' );

		await paragraph.click();
		await expect( paragraph ).toBeFocused();
		await page.keyboard.press( LINE_START_KEY );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( ' updated' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/details',
				attributes: {
					summary: 'Details summary updated',
				},
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Details content',
						},
					},
				],
			},
		] );
	} );

	test( 'selecting hidden blocks in list view expands details and focuses content', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a details block.
		await editor.insertBlock( {
			name: 'core/details',
			attributes: {
				summary: 'Details summary',
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Details content',
					},
				},
			],
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		// Open the list view.
		await pageUtils.pressKeys( 'access+o' );

		// Verify inner blocks appear in the list view.
		await page.keyboard.press( 'ArrowRight' );
		await expect(
			listView.getByRole( 'link', {
				name: 'Paragraph',
				exact: true,
			} )
		).toBeVisible();

		// Verify the first inner block in the list view is focused.
		await page.keyboard.press( 'ArrowDown' );
		await expect(
			listView.getByRole( 'link', {
				name: 'Paragraph',
				exact: true,
			} )
		).toBeFocused();

		// Verify the first inner block in the editor canvas is focused.
		await page.keyboard.press( 'Enter' );
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toBeFocused();
	} );
} );
