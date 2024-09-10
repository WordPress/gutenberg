/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Push to Global Styles button', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
	} );

	test( 'should apply Heading block styles to all Heading blocks', async ( {
		page,
		editor,
	} ) => {
		// Add a Heading block.
		await editor.insertBlock( { name: 'core/heading' } );
		await page.keyboard.type( 'A heading' );

		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		const settingsPanel = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		// Navigate to Styles -> Blocks -> Heading -> Typography
		await topBar.getByRole( 'button', { name: 'Styles' } ).click();
		await settingsPanel.getByRole( 'button', { name: 'Blocks' } ).click();
		await settingsPanel.getByRole( 'button', { name: 'Heading' } ).click();

		// Headings should not have uppercase
		await expect(
			page.getByRole( 'button', { name: 'Uppercase' } )
		).toHaveAttribute( 'aria-pressed', 'false' );

		// Go to block settings and open the Advanced panel
		await topBar.getByRole( 'button', { name: 'Settings' } ).click();
		await page.getByRole( 'button', { name: 'Advanced' } ).click();

		// Push button should be disabled
		await expect(
			page.getByRole( 'button', {
				name: 'Apply globally',
			} )
		).toBeDisabled();

		// Enable letter case.
		const typographyOptions = page.getByRole( 'button', {
			name: 'Typography options',
		} );
		await typographyOptions.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Letter case' } )
			.click();
		await typographyOptions.click();

		// Make the Heading block uppercase
		await page.getByRole( 'button', { name: 'Uppercase' } ).click();

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
		await page
			.getByRole( 'button', { name: 'Styles', exact: true } )
			.click();
		await page.getByRole( 'button', { name: 'Blocks' } ).click();
		await settingsPanel
			.getByRole( 'button', { name: 'Heading', exact: true } )
			.click();

		// Headings should now have uppercase
		await expect(
			page.getByRole( 'button', { name: 'Uppercase' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
	} );
} );
