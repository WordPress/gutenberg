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
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '## Heading' );

		await editor.openDocumentSettingsSidebar();
		await page.click( 'role=button[name="Text"i]' );

		await page.click( 'role=button[name="Color: Luminous vivid orange"i]' );

		await page.click( 'role=button[name="Heading"i]' );
		await page.click( 'role=menuitem[name="Paragraph"i]' );

		expect( await editor.getEditedPostContent() )
			.toBe( `<!-- wp:paragraph {"textColor":"luminous-vivid-orange"} -->
<p class="has-luminous-vivid-orange-color has-text-color">Heading</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'Should keep the font size during a transform from multiple blocks into multiple blocks', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		// Create a paragraph block with some content.
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'Line 1 to be made large' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Line 2 to be made large' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Line 3 to be made large' );
		await pageUtils.pressKeys( 'shift+ArrowUp' );
		await pageUtils.pressKeys( 'shift+ArrowUp' );
		await page.click( 'role=radio[name="Large"i]' );
		await page.click( 'role=button[name="Paragraph"i]' );
		await page.click( 'role=menuitem[name="Group"i]' );
		expect( await editor.getEditedPostContent() )
			.toBe( `<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"fontSize":"large"} -->
<p class="has-large-font-size">Line 1 to be made large</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"fontSize":"large"} -->
<p class="has-large-font-size">Line 2 to be made large</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"fontSize":"large"} -->
<p class="has-large-font-size">Line 3 to be made large</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->` );
	} );

	test( 'Should not include styles in the group block when grouping a block', async ( {
		page,
		editor,
	} ) => {
		// Create a paragraph block with some content.
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'Line 1 to be made large' );
		await page.click( 'role=radio[name="Large"i]' );
		await page.mouse.move( 50, 50 );
		await page.mouse.move( 75, 75 );
		await page.mouse.move( 100, 100 );
		await page.click( 'role=button[name="Paragraph"i]' );
		await page.click( 'role=menuitem[name="Group"i]' );

		expect( await editor.getEditedPostContent() )
			.toBe( `<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"fontSize":"large"} -->
<p class="has-large-font-size">Line 1 to be made large</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->` );
	} );
} );
