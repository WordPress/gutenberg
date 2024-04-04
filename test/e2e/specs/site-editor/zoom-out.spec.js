/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Zoom Out', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin, page, editor } ) => {
		await admin.visitAdminPage( 'admin.php', 'page=gutenberg-experiments' );

		const zoomedOutCheckbox = page.getByLabel(
			'Test a new zoomed out view on'
		);

		await zoomedOutCheckbox.setChecked( true );
		await expect( zoomedOutCheckbox ).toBeChecked();
		await page.getByRole( 'button', { name: 'Save Changes' } ).click();

		// Select a template part with a few blocks.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
		} );
		await editor.canvas.locator( 'body' ).click();
	} );

	test.afterEach( async ( { admin, page } ) => {
		await admin.visitAdminPage( 'admin.php', 'page=gutenberg-experiments' );
		const zoomedOutCheckbox = page.getByLabel(
			'Test a new zoomed out view on'
		);
		await zoomedOutCheckbox.setChecked( false );
		await expect( zoomedOutCheckbox ).not.toBeChecked();
		await page.getByRole( 'button', { name: 'Save Changes' } ).click();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'Zoom-out button should not steal focus when a block is focused', async ( {
		page,
		editor,
	} ) => {
		const zoomOutButton = page.getByRole( 'button', {
			name: 'Zoom-out View',
			exact: true,
		} );

		// Select a block for this test to surface the potential focus-stealing behavior
		await editor.canvas.getByLabel( 'Site title text' ).click();

		await zoomOutButton.click();

		await expect( zoomOutButton ).toBeFocused();

		await page.keyboard.press( 'Enter' );

		await expect( zoomOutButton ).toBeFocused();
	} );
} );
