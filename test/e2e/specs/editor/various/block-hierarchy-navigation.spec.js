/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const COLUMNS_BLOCK = [
	{
		name: 'core/columns',
		innerBlocks: [
			{
				name: 'core/column',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'First column' },
					},
				],
			},
			{
				name: 'core/column',
			},
			{
				name: 'core/column',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'Third column' },
					},
				],
			},
		],
	},
];

test.describe( 'Navigating the block hierarchy', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should navigate using the list view sidebar', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		await editor.insertBlock( { name: 'core/columns' } );
		await editor.canvas.click(
			'role=button[name="Two columns; equal split"i]'
		);

		// Open the block inserter.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Enter' );

		// Add a paragraph in the first column.
		const paragraph = page.getByRole( 'option', { name: 'Paragraph' } );
		await expect( paragraph ).toBeVisible();
		await paragraph.click();
		await page.keyboard.type( 'First column' );

		await pageUtils.pressKeys( 'access+o' );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		await expect( listView ).toBeVisible();
		await listView
			.getByRole( 'gridcell', { name: 'Columns', exact: true } )
			.click();

		// Tweak the columns count.
		await page.getByRole( 'spinbutton', { name: 'Columns' } ).fill( '3' );

		// Wait for the new column block to appear in the list view
		const column = listView.getByRole( 'gridcell', {
			name: 'Column',
			exact: true,
		} );
		await expect( column ).toHaveCount( 3 );

		await column.last().click();

		// Open the block inserter.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Enter' );

		await expect( paragraph ).toBeVisible();
		await paragraph.click();
		await page.keyboard.type( 'Third column' );

		await expect.poll( editor.getBlocks ).toMatchObject( COLUMNS_BLOCK );
	} );

	test( 'should navigate block hierarchy using only the keyboard', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		await editor.insertBlock( { name: 'core/columns' } );
		await editor.canvas.click(
			'role=button[name="Two columns; equal split"i]'
		);

		// Open the block inserter.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Enter' );

		// Add a paragraph in the first column.
		const paragraph = page.getByRole( 'option', { name: 'Paragraph' } );
		await expect( paragraph ).toBeVisible();
		await paragraph.click();
		await page.keyboard.type( 'First column' );

		await pageUtils.pressKeys( 'access+o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		await expect( listView ).toBeVisible();

		// Navigate to the columns blocks using the keyboard.
		await pageUtils.pressKeys( 'ArrowUp', { times: 2 } );
		await page.keyboard.press( 'Enter' );

		// Move focus to the sidebar area.
		await pageUtils.pressKeys( 'ctrl+`' );

		// Navigate to the block settings sidebar and tweak the column count.
		await pageUtils.pressKeys( 'Tab', { times: 5 } );
		await expect(
			page.getByRole( 'slider', { name: 'Columns' } )
		).toBeFocused();
		await page.keyboard.press( 'ArrowRight' );

		// Navigate to the third column in the columns block via List View.
		await pageUtils.pressKeys( 'ctrlShift+`', { times: 2 } );
		await pageUtils.pressKeys( 'Tab', { times: 3 } );
		await pageUtils.pressKeys( 'ArrowDown', { times: 4 } );

		// Insert text in the last column block.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Enter' );

		await expect( paragraph ).toBeVisible();
		await paragraph.click();
		await page.keyboard.type( 'Third column' );

		await expect.poll( editor.getBlocks ).toMatchObject( COLUMNS_BLOCK );
	} );

	test( 'should appear and function even without nested blocks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'You say goodbye' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '## Hello, hello' );

		// Open list view and return to the first block.
		await pageUtils.pressKeys( 'access+o' );
		await expect(
			page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} )
		).toBeVisible();
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Space' );

		// Replace its contents.
		await pageUtils.pressKeys( 'primary+a' );
		await page.keyboard.type( 'and I say hello' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'and I say hello' },
			},
			{
				name: 'core/heading',
			},
		] );
	} );

	test( 'should select the wrapper div for a group', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/group' } );
		await editor.canvas.click(
			'role=button[name="Group: Gather blocks in a container."i]'
		);

		// Open the block inserter.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Enter' );

		// Add some random blocks.
		const paragraph = page.getByRole( 'option', { name: 'Paragraph' } );
		await expect( paragraph ).toBeVisible();
		await paragraph.click();
		await page.keyboard.type( 'just a paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/spacer' );
		await page.keyboard.press( 'Enter' );

		// Verify group block contents.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'just a paragraph' },
					},
					{
						name: 'core/spacer',
					},
				],
			},
		] );

		// Deselect the blocks.
		await editor.canvas.click( 'role=textbox[name="Add title"i]' );

		// Open list view and return to the first block.
		await pageUtils.pressKeys( 'access+o' );
		await expect(
			page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );

		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Group' } )
		).toBeFocused();
	} );
} );
