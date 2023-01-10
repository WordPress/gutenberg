/**
 * WordPress dependencies
 */
const {
	test,
	expect,
	Editor,
} = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	editor: async ( { page }, use ) => {
		await use( new Editor( { page, hasIframe: true } ) );
	},
} );

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

		// Go to block settings and open the Advanced panel
		await page.getByRole( 'button', { name: 'Settings' } ).click();
		await page.getByRole( 'button', { name: 'Advanced' } ).click();

		// Push button should be disabled
		await expect(
			page.getByRole( 'button', {
				name: 'Push changes to Global Styles',
			} )
		).toBeDisabled();

		// Make the Heading block uppercase
		await page.getByRole( 'button', { name: 'Uppercase' } ).click();

		// Push button should now be enabled
		await expect(
			page.getByRole( 'button', {
				name: 'Push changes to Global Styles',
			} )
		).toBeEnabled();

		// Press the Push button
		await page
			.getByRole( 'button', { name: 'Push changes to Global Styles' } )
			.click();

		// Snackbar notification should appear
		await expect(
			page.getByRole( 'button', {
				name: 'Dismiss this notice',
				text: 'Pushed styles to all Heading blocks.',
			} )
		).toBeVisible();

		// Push button should be disabled again
		await expect(
			page.getByRole( 'button', {
				name: 'Push changes to Global Styles',
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
