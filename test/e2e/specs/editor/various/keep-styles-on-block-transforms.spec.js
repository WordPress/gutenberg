/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Keep styles on block transforms', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Should keep colors during a transform', async ( {
		page,
		editor,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '## Heading' );
		await page.click( 'role=button[name="Text"i]' );
		await page.click( 'role=option[name="Color: Luminous vivid orange"i]' );

		await page.click( 'role=button[name="Heading"i]' );
		await page.click( 'role=menuitem[name="Paragraph"i]' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Heading',
					textColor: 'luminous-vivid-orange',
				},
			},
		] );
	} );

	test( 'Should keep the font size during a transform from multiple blocks into multiple blocks', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'Line 1 to be made large' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Line 2 to be made large' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Line 3 to be made large' );
		await pageUtils.pressKeys( 'shift+ArrowUp' );
		await pageUtils.pressKeys( 'shift+ArrowUp' );
		await page.click( 'role=radio[name="Large"i]' );
		await page.click( 'role=button[name="Multiple blocks selected"i]' );
		await page.click( 'role=menuitem[name="Heading"i]' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/heading',
				attributes: { fontSize: 'large' },
			},
			{
				name: 'core/heading',
				attributes: { fontSize: 'large' },
			},
			{
				name: 'core/heading',
				attributes: { fontSize: 'large' },
			},
		] );
	} );

	test( 'Should not include styles in the group block when grouping a block', async ( {
		page,
		editor,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'Line 1 to be made large' );
		await page.click( 'role=radio[name="Large"i]' );
		await editor.showBlockToolbar();
		await page.click( 'role=button[name="Paragraph"i]' );
		await page.click( 'role=menuitem[name="Group"i]' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				attributes: expect.not.objectContaining( {
					fontSize: 'large',
				} ),
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Line 1 to be made large',
							fontSize: 'large',
						},
					},
				],
			},
		] );
	} );
} );
