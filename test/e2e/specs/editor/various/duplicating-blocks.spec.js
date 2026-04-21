/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Duplicating blocks', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should duplicate blocks using the block settings menu and keyboard shortcut', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Clone me' );

		// Test: Duplicate using the block settings menu.
		await editor.clickBlockToolbarButton( 'Options' );
		await page.click( 'role=menuitem[name=/Duplicate/i]' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p>Clone me</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Clone me</p>
<!-- /wp:paragraph -->`
		);

		// Test: Duplicate using the keyboard shortccut.
		await pageUtils.pressKeys( 'primaryShift+d' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p>Clone me</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Clone me</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Clone me</p>
<!-- /wp:paragraph -->`
		);
	} );
} );
