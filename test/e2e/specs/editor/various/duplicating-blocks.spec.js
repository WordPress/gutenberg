/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Duplicating blocks', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should duplicate blocks using the block settings menu', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Clone me' );

		// Select the test we just typed
		// This doesn't do anything but we previously had a duplicationi bug
		// When the selection was not collapsed.
		await pageUtils.pressKeyWithModifier( 'primary', 'a' );

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
	} );

	test( 'should duplicate blocks using the keyboard shortcut', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Clone me' );

		// Select the test we just typed
		// This doesn't do anything but we previously had a duplicationi bug
		// When the selection was not collapsed.
		await pageUtils.pressKeyWithModifier( 'primary', 'a' );

		// Duplicate using the keyboard shortccut.
		await pageUtils.pressKeyWithModifier( 'primaryShift', 'd' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p>Clone me</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Clone me</p>
<!-- /wp:paragraph -->`
		);
	} );
} );
