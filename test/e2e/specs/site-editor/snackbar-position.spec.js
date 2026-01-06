/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site Editor snackbars', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );
	test( 'renders snackbars inside layout areas in view mode', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();
		await page.getByRole( 'button', { name: 'Pages' } ).click();
		await page.waitForSelector( '.dataviews-wrapper' );

		await page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/notices' )
				.createSuccessNotice( 'Area snackbar', {
					type: 'snackbar',
				} );
		} );

		await expect(
			page.locator( '.components-snackbar__content' )
		).toContainText( 'Area snackbar' );

		const hasAreaParent = await page.evaluate( () => {
			const snackbar = document.querySelector(
				'.edit-site-layout__snackbar'
			);
			return snackbar?.parentElement?.classList.contains(
				'edit-site-layout__area'
			);
		} );

		expect( hasAreaParent ).toBe( true );
	} );

	test( 'renders snackbars fixed in edit mode', async ( { admin, page } ) => {
		await admin.visitSiteEditor( { canvas: 'edit' } );
		await page.waitForSelector( '.edit-site-layout__content' );

		await page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/notices' )
				.createSuccessNotice( 'Fixed snackbar', {
					type: 'snackbar',
				} );
		} );

		await expect(
			page.locator( '.components-snackbar__content' )
		).toContainText( 'Fixed snackbar' );

		const hasContentParent = await page.evaluate( () => {
			const snackbar = document.querySelector(
				'.edit-site-layout__snackbar'
			);
			return snackbar?.parentElement?.classList.contains(
				'edit-site-layout__content'
			);
		} );

		expect( hasContentParent ).toBe( true );
	} );
} );
