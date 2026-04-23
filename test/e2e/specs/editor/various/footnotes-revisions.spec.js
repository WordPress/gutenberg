/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Footnotes in Revisions UI', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should show the correct footnotes for each revision', async ( {
		editor,
		page,
	} ) => {
		// --- Revision 1: paragraph with footnote "alpha" ---
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Paragraph one' );

		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'More' );
		await page.getByRole( 'menuitem', { name: 'Footnote' } ).click();
		await page.keyboard.type( 'alpha' );

		await editor.saveDraft();

		// --- Revision 2: change footnote to "beta" ---
		await editor.canvas.locator( 'ol.wp-block-footnotes li span' ).click();
		await page.keyboard.press( 'Meta+a' );
		await page.keyboard.type( 'beta' );

		await editor.saveDraft();

		// --- Open the Revisions UI ---
		await editor.openDocumentSettingsSidebar();
		const settingsSidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settingsSidebar.getByRole( 'tab', { name: 'Post' } ).click();
		await settingsSidebar
			.getByRole( 'button', { name: '2', exact: true } )
			.click();

		// Wait for the revisions mode to be active.
		await expect(
			page.getByRole( 'button', { name: 'Restore' } )
		).toBeVisible();

		// Latest revision (revision 2) — footnote should say "beta".
		await expect(
			editor.canvas.locator( 'ol.wp-block-footnotes' )
		).toBeVisible();
		await expect(
			editor.canvas.locator( 'ol.wp-block-footnotes li' ).first()
		).toContainText( 'beta' );

		// Navigate to oldest revision (revision 1).
		const slider = page.getByRole( 'slider', { name: 'Revision' } );
		await slider.focus();
		await page.keyboard.press( 'Home' );

		// Revision 1 — footnote should say "alpha", not "beta".
		await expect(
			editor.canvas.locator( 'ol.wp-block-footnotes li' ).first()
		).toContainText( 'alpha' );
		await expect(
			editor.canvas.locator( 'ol.wp-block-footnotes li' ).first()
		).not.toContainText( 'beta' );
	} );
} );
