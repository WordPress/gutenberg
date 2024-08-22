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
		await editor.canvas
			.locator( 'role=button[name="Two columns; equal split"i]' )
			.click();

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
			.getByRole( 'gridcell', { name: 'Column', exact: true } )
			.last()
			.click();

		// Add another column block.
		await pageUtils.pressKeys( 'primary+Alt+Y' );

		// Wait for the new column block to appear in the list view
		await expect(
			listView.getByRole( 'gridcell', {
				name: 'Column',
				exact: true,
			} )
		).toHaveCount( 3 );

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
		await editor.canvas
			.locator( 'role=button[name="Two columns; equal split"i]' )
			.click();

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

		// Add another column block.
		await page.keyboard.press( 'ArrowDown' );
		await pageUtils.pressKeys( 'primary+Alt+Y' );

		// Navigate to the third column in the columns block via List View.
		await pageUtils.pressKeys( 'access+o' );
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
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
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
		await editor.canvas
			.locator(
				'role=button[name="Group: Gather blocks in a container."i]'
			)
			.click();

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
		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.click();

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
