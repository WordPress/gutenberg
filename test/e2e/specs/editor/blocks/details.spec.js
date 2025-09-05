/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

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
			} )
		).toBeVisible();

		// Verify the first inner block in the list view is focused.
		await page.keyboard.press( 'ArrowDown' );
		await expect(
			listView.getByRole( 'link', {
				name: 'Paragraph',
			} )
		).toBeFocused();

		// Verify the first inner block in the editor canvas is focused.
		await page.keyboard.press( 'Enter' );
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toBeFocused();
	} );
} );
