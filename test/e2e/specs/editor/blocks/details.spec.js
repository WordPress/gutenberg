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

		// Verify the first inner block in the editor canvas holds the
		// selection.
		await page.keyboard.press( 'Enter' );
		await expect
			.poll( () =>
				editor.ownsSelection(
					editor.canvas.getByRole( 'document', {
						name: 'Block: Paragraph',
					} )
				)
			)
			.toBe( true );
	} );
	test( 'should select the parent when clicking its summary from an inner paragraph', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/details',
			attributes: { summary: 'Parent summary', showContent: true },
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Inner paragraph' },
				},
			],
		} );

		// Select the inner paragraph.
		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await paragraph.click();
		await expect
			.poll( () =>
				page.evaluate( () => {
					const { getSelectedBlockClientId, getBlockName } =
						window.wp.data.select( 'core/block-editor' );
					return getBlockName( getSelectedBlockClientId() );
				} )
			)
			.toBe( 'core/paragraph' );

		// Click the summary, a rich text owned by the parent Details block:
		// the parent must become the selected block and own the caret, even
		// though it is an ancestor of the previously selected paragraph.
		const summary = editor.canvas.getByRole( 'textbox', {
			name: 'Write summary. Press Enter to expand or collapse the details.',
		} );
		await summary.click();
		await expect
			.poll( () =>
				page.evaluate( () => {
					const { getSelectedBlockClientId, getBlockName } =
						window.wp.data.select( 'core/block-editor' );
					return getBlockName( getSelectedBlockClientId() );
				} )
			)
			.toBe( 'core/details' );
		await expect.poll( () => editor.ownsSelection( summary ) ).toBe( true );
	} );
} );
