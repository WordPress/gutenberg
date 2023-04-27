/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Quote', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by converting a quote and converted back to quote', async ( {
		editor,
		page,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );

		await page.keyboard.type( 'test' );
		await editor.showBlockToolbar();

		await page.click( 'role=button[name="Paragraph"i]' );

		await page.click(
			"button[class='components-button components-menu-item__button editor-block-list-item-quote']"
		);

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/quote',
			},
		] );

		await page.click( 'role=button[name="Quote"i]' );

		await page.click(
			"button[class='components-button components-menu-item__button editor-block-list-item-pullquote']"
		);

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/pullquote',
			},
		] );

		await page.click( 'role=button[name="Pullquote"i]' );

		await page.click(
			"button[class='components-button components-menu-item__button editor-block-list-item-quote']"
		);

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/quote',
			},
		] );
	} );
} );
