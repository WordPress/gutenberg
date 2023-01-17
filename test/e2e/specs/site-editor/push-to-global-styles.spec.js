/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Push to Global Styles button', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin, siteEditor } ) => {
		await admin.visitSiteEditor();
		await siteEditor.enterEditMode();
	} );

	test( 'should apply Heading block styles to all Heading blocks', async ( {
		page,
		editor,
	} ) => {
		// Add a Heading block.
		await editor.insertBlock( { name: 'core/heading' } );
		await page.keyboard.type( 'A heading' );

		// Navigate to Styles -> Blocks -> Heading -> Typography
		await page.getByRole( 'button', { name: 'Styles' } ).click();
		await page.getByRole( 'button', { name: 'Blocks styles' } ).click();
		await page
			.getByRole( 'button', { name: 'Heading block styles' } )
			.click();
		await page.getByRole( 'button', { name: 'Typography styles' } ).click();

		// Headings should not have uppercase
		await expect(
			page.getByRole( 'button', { name: 'Uppercase' } )
		).toHaveAttribute( 'aria-pressed', 'false' );

		// Go to block settings, select inner tab, and open the Advanced panel
		await page.getByRole( 'button', { name: 'Settings' } ).click();
		await page.getByRole( 'tab', { name: 'Settings' } ).click();
		await page.getByRole( 'button', { name: 'Advanced' } ).click();

		// Push button should be disabled
		await expect(
			page.getByRole( 'button', {
				name: 'Apply globally',
			} )
		).toBeDisabled();

		// Switch back to the Styles inspector tab to check typography style
		await page.getByRole( 'tab', { name: 'Styles' } ).click();

		// Make the Heading block uppercase
		await page.getByRole( 'button', { name: 'Uppercase' } ).click();

		// Switch back to the Settings inspector tab to check for enabled button
		await page.getByRole( 'tab', { name: 'Settings' } ).click();
		await page.getByRole( 'button', { name: 'Advanced' } ).click();

		// Push button should now be enabled
		await expect(
			page.getByRole( 'button', {
				name: 'Apply globally',
			} )
		).toBeEnabled();

		// Press the Push button
		await page.getByRole( 'button', { name: 'Apply globally' } ).click();

		// Snackbar notification should appear
		await expect(
			page.getByRole( 'button', {
				name: 'Dismiss this notice',
				text: 'Heading styles applied.',
			} )
		).toBeVisible();

		// Push button should be disabled again
		await expect(
			page.getByRole( 'button', {
				name: 'Apply globally',
			} )
		).toBeDisabled();

		// Navigate again to Styles -> Blocks -> Heading -> Typography
		await page.getByRole( 'button', { name: 'Styles' } ).click();
		await page.getByRole( 'button', { name: 'Blocks styles' } ).click();
		await page
			.getByRole( 'button', { name: 'Heading block styles' } )
			.click();
		await page.getByRole( 'button', { name: 'Typography styles' } ).click();

		// Headings should now have uppercase
		await expect(
			page.getByRole( 'button', { name: 'Uppercase' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
	} );
} );
