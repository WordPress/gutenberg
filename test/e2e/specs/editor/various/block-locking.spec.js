/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block Locking', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can prevent removal', async ( { editor, page } ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'Some paragraph' );

		await editor.clickBlockOptionsMenuItem( 'Lock' );

		await page.click( 'role=checkbox[name="Prevent removal"]' );
		await page.click( 'role=button[name="Apply"]' );

		await expect(
			page.locator( 'role=menuitem[name="Delete"]' )
		).not.toBeVisible();
	} );

	test( 'can disable movement', async ( { editor, page } ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'First paragraph' );

		await page.keyboard.type( 'Enter' );
		await page.keyboard.type( 'Second paragraph' );

		await editor.clickBlockOptionsMenuItem( 'Lock' );

		await page.click( 'role=checkbox[name="Disable movement"]' );
		await page.click( 'role=button[name="Apply"]' );

		// Hide options.
		await editor.clickBlockToolbarButton( 'Options' );

		// Drag handle is hidden.
		await expect(
			page.locator( 'role=button[name="Drag"]' )
		).not.toBeVisible();

		// Movers are hidden. No need to check for both.
		await expect(
			page.locator( 'role=button[name="Move up"]' )
		).not.toBeVisible();
	} );

	test( 'can lock everything', async ( { editor, page } ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'Some paragraph' );

		await editor.clickBlockOptionsMenuItem( 'Lock' );

		await page.click( 'role=checkbox[name="Lock all"]' );
		await page.click( 'role=button[name="Apply"]' );

		expect( await editor.getEditedPostContent() )
			.toBe( `<!-- wp:paragraph {"lock":{"move":true,"remove":true}} -->
<p>Some paragraph</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'can unlock from toolbar', async ( { editor, page } ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'Some paragraph' );

		await editor.clickBlockOptionsMenuItem( 'Lock' );

		await page.click( 'role=checkbox[name="Lock all"]' );
		await page.click( 'role=button[name="Apply"]' );

		await editor.clickBlockToolbarButton( 'Unlock' );
		await page.click( 'role=checkbox[name="Lock all"]' );
		await page.click( 'role=button[name="Apply"]' );

		expect( await editor.getEditedPostContent() )
			.toBe( `<!-- wp:paragraph {"lock":{"move":false,"remove":false}} -->
<p>Some paragraph</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'block locking supersedes template locking', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				layout: { type: 'constrained' },
				templateLock: 'all',
			},
			innerBlocks: [
				{
					name: 'core/heading',
					attributes: { content: 'Hello, hello' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'WordPress' },
				},
			],
		} );

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Paragraph block',
		} );
		await paragraph.click();

		await editor.clickBlockToolbarButton( 'Unlock' );
		await page.click( 'role=checkbox[name="Lock all"]' );
		await page.click( 'role=button[name="Apply"]' );

		await expect(
			page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Move up' } )
		).toBeVisible();

		await paragraph.click();
		await pageUtils.pressKeys( 'access+z' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				attributes: {
					layout: { type: 'constrained' },
					templateLock: 'all',
				},
				innerBlocks: [
					{
						name: 'core/heading',
						attributes: { content: 'Hello, hello' },
					},
				],
			},
		] );
	} );
} );
