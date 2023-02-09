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
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '### 3' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">3</h3>
<!-- /wp:heading -->`
		);
	} );

	test( 'can be created by prefixing existing content with number signs and a space', async ( {
		editor,
		page,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '4' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( '#### ' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:heading {"level":4} -->
<h4 class="wp-block-heading">4</h4>
<!-- /wp:heading -->` );
	} );

	test( 'should not work with the list input rule', async ( {
		editor,
		page,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '## 1. H' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:heading -->
<h2 class="wp-block-heading">1. H</h2>
<!-- /wp:heading -->`
		);
	} );

	test( 'should work with the format input rules', async ( {
		editor,
		page,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '## `code`' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:heading -->
<h2 class="wp-block-heading"><code>code</code></h2>
<!-- /wp:heading -->`
		);
	} );

	test( 'should create a paragraph block above when pressing enter at the start', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '## a' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">a</h2>
<!-- /wp:heading -->`
		);
	} );

	test( 'should create a paragraph block below when pressing enter at the end', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '## a' );
		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:heading -->
<h2 class="wp-block-heading">a</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should correctly apply custom colors', async ( {
		editor,
		page,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '### Heading' );

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

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:heading {"level":3,"style":{"color":{"text":"#4b7f4d"}}} -->
<h3 class="wp-block-heading has-text-color" style="color:#4b7f4d">Heading</h3>
<!-- /wp:heading -->` );
	} );

	test( 'should correctly apply named colors', async ( { editor, page } ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '## Heading' );

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

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:heading {"textColor":"luminous-vivid-orange"} -->
<h2 class="wp-block-heading has-luminous-vivid-orange-color has-text-color">Heading</h2>
<!-- /wp:heading -->` );
	} );
} );
