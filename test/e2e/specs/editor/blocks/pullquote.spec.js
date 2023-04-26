/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Quote', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by converting a quote and converted back to quote', async ( {
		admin,
		editor,
		page,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );

		await page.keyboard.type( 'test' );

		await page.mouse.move( 50, 50 );
		await page.mouse.move( 75, 75 );
		await page.mouse.move( 100, 100 );

		await page.click( 'role=button[name="Paragraph"i]' );

		await page.click(
			"button[class='components-button components-menu-item__button editor-block-list-item-quote']"
		);

		expect( await editor.getEditedPostContent() ).toMatchSnapshot( `
		"<!-- wp:quote -->
<blockquote class=\"wp-block-quote\">
<p>test</p>
</blockquote>
<!-- /wp:quote -->"
	` );

		await page.click( 'role=button[name="Quote"i]' );

		await page.click(
			"button[class='components-button components-menu-item__button editor-block-list-item-pullquote']"
		);
		expect( await editor.getEditedPostContent() ).toMatchSnapshot( `
		"<!-- wp:pullquote -->
<figure class=\\"wp-block-pullquote\\"><blockquote><p>test</p></blockquote></figure>
<!-- /wp:pullquote -->"
	` );

		await page.click( 'role=button[name="Pullquote"i]' );

		await page.click(
			"button[class='components-button components-menu-item__button editor-block-list-item-quote']"
		);

		expect( await editor.getEditedPostContent() ).toMatchSnapshot( `
		"<!-- wp:quote -->
<blockquote class=\\"wp-block-quote\\"><!-- wp:paragraph -->
<p>test</p>
<!-- /wp:paragraph --></blockquote>
<!-- /wp:quote -->"
	` );
	} );
} );
