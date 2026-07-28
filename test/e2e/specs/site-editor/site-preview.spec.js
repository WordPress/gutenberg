/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site preview', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// The site preview iframe is only rendered for classic (non-block) themes.
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'makes interactive elements inside the preview non-interactive', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();

		const previewFrame = page.frameLocator(
			'iframe[title="Site Preview"]'
		);

		const interactiveSelector = [
			'a[href]',
			'button:not([disabled])',
			'input:not([type="hidden"]):not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
		]
			.map( ( selector ) => `${ selector }:visible` )
			.join( ',' );
		const interactiveElements = previewFrame.locator( interactiveSelector );

		await expect( interactiveElements.first() ).toBeVisible();

		const count = await interactiveElements.count();
		for ( let i = 0; i < count; i++ ) {
			const element = interactiveElements.nth( i );
			await expect( element ).toHaveAttribute( 'aria-hidden', 'true' );
			await expect( element ).toHaveCSS( 'pointer-events', 'none' );
		}
	} );
} );
