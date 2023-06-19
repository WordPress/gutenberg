/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Heading', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by prefixing number sign and a space', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '### 3' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/heading',
				attributes: { content: '3', level: 3 },
			},
		] );
	} );

	test( 'can be created by prefixing existing content with number signs and a space', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '4' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( '#### ' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/heading',
				attributes: { content: '4', level: 4 },
			},
		] );
	} );

	test( 'should not work with the list input rule', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '## 1. H' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/heading',
				attributes: { content: '1. H', level: 2 },
			},
		] );
	} );

	test( 'should work with the format input rules', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '## `code`' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/heading',
				attributes: { content: '<code>code</code>', level: 2 },
			},
		] );
	} );

	test( 'should create a paragraph block above when pressing enter at the start', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '## a' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '' },
			},
			{
				name: 'core/heading',
				attributes: { content: 'a', level: 2 },
			},
		] );
	} );

	test( 'should create a paragraph block below when pressing enter at the end', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '## a' );
		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/heading',
				attributes: { content: 'a', level: 2 },
			},
			{
				name: 'core/paragraph',
				attributes: { content: '' },
			},
		] );
	} );

	test( 'should correctly apply custom colors', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '### Heading' );
		await editor.openDocumentSettingsSidebar();

		const textColor = page
			.getByRole( 'region', {
				name: 'Editor settings',
			} )
			.getByRole( 'button', { name: 'Text' } );

		await textColor.click();
		await page
			.getByRole( 'button', { name: /Custom color picker./i } )
			.click();

		await page
			.getByRole( 'textbox', { name: 'Hex color' } )
			.fill( '4b7f4d' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/heading',
				attributes: {
					content: 'Heading',
					level: 3,
					style: { color: { text: '#4b7f4d' } },
				},
			},
		] );
	} );

	test( 'should correctly apply named colors', async ( { editor, page } ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '## Heading' );
		await editor.openDocumentSettingsSidebar();

		const textColor = page
			.getByRole( 'region', {
				name: 'Editor settings',
			} )
			.getByRole( 'button', { name: 'Text' } );

		await textColor.click();

		await page
			.getByRole( 'button', {
				name: 'Color: Luminous vivid orange',
			} )
			.click();

		// Close the popover.
		await textColor.click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/heading',
				attributes: {
					content: 'Heading',
					level: 2,
					textColor: 'luminous-vivid-orange',
				},
			},
		] );
	} );

	test( 'should change heading level with keyboard shortcuts', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '## Heading' );

		// Change text alignment
		await editor.clickBlockToolbarButton( 'Align text' );
		const textAlignButton = page.locator(
			'role=menuitemradio[name="Align text center"i]'
		);
		await textAlignButton.click();

		// Focus the block content
		await pageUtils.pressKeys( 'Tab' );

		await pageUtils.pressKeys( 'access+4' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/heading',
				attributes: {
					content: 'Heading',
					textAlign: 'center',
					level: 4,
				},
			},
		] );
	} );

	test( 'should be converted from a paragraph to a heading with keyboard shortcuts', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'Paragraph' );

		// Change text alignment
		await editor.clickBlockToolbarButton( 'Align text' );
		const textAlignButton = page.locator(
			'role=menuitemradio[name="Align text center"i]'
		);
		await textAlignButton.click();

		// Focus the block content
		await pageUtils.pressKeys( 'Tab' );

		await pageUtils.pressKeys( 'access+2' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/heading',
				attributes: {
					content: 'Paragraph',
					textAlign: 'center',
					level: 2,
				},
			},
		] );
	} );

	test( 'should be converted from a heading to a paragraph with keyboard shortcuts', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '## Heading' );

		// Change text alignment
		await editor.clickBlockToolbarButton( 'Align text' );
		const textAlignButton = page.locator(
			'role=menuitemradio[name="Align text center"i]'
		);

		await textAlignButton.click();

		// Focus the block content
		await pageUtils.pressKeys( 'Tab' );

		await pageUtils.pressKeys( 'access+0' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Heading',
					align: 'center',
				},
			},
		] );
	} );
} );
