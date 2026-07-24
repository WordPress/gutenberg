/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigation Overlay back navigation', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyfive' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'does not require an extra back click to exit the navigation overlay', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( { canvas: 'edit' } );

		await page.getByRole( 'button', { name: /Header/i } ).click();
		await page
			.getByRole( 'button', { name: 'Edit original', exact: true } )
			.click();
		await expect( page ).toHaveURL( /wp_template_part.*header/ );

		const navigationBlock = editor.canvas.locator(
			'[data-type="core/navigation"]'
		);
		await expect( navigationBlock ).toBeVisible();
		await editor.selectBlocks( navigationBlock );

		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'tab', { name: 'Settings', exact: true } )
			.click();

		const createOverlayButton = page.getByRole( 'button', {
			name: 'Create overlay',
			exact: true,
		} );

		if ( await createOverlayButton.isVisible() ) {
			await createOverlayButton.click();
		} else {
			await page.getByRole( 'button', { name: /Edit overlay:/ } ).click();
		}

		const overlayHeading = page
			.locator( 'h1' )
			.filter( { hasText: 'Navigation Overlay' } );
		await expect( overlayHeading ).toBeVisible();
		const urlBeforeBacks = page.url();

		await page.goBack();
		await page.waitForURL( ( url ) => url.toString() !== urlBeforeBacks );
		const urlAfterFirstBack = page.url();

		await page.goBack();
		await page.waitForURL(
			( url ) => url.toString() !== urlAfterFirstBack
		);

		await expect( page ).toHaveURL( /site-editor\.php\?.*p=%2F(&|$)/ );
	} );
} );
