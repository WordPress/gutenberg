/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Font Library', () => {
	test.describe( 'When a blank theme is active', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );
		} );

		test.beforeEach( async ( { admin, editor } ) => {
			await admin.visitSiteEditor();
			await editor.canvas.locator( 'body' ).click();
		} );

		test( 'should display the "Manage Fonts" icon', async ( { page } ) => {
			await page.getByRole( 'button', { name: 'Styles' } ).click();
			await page
				.getByRole( 'button', { name: 'Typography Styles' } )
				.click();
			const manageFontsIcon = page.getByRole( 'button', {
				name: 'Manage Fonts',
			} );
			await expect( manageFontsIcon ).toBeVisible();
		} );
	} );

	test.describe( 'When a theme with bundled fonts is active', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentythree' );
		} );

		test.beforeEach( async ( { admin, editor } ) => {
			await admin.visitSiteEditor();
			await editor.canvas.locator( 'body' ).click();
		} );

		test( 'should display the "Manage Fonts" icon', async ( { page } ) => {
			await page.getByRole( 'button', { name: 'Styles' } ).click();
			await page
				.getByRole( 'button', { name: 'Typography Styles' } )
				.click();
			const manageFontsIcon = page.getByRole( 'button', {
				name: 'Manage Fonts',
			} );
			await expect( manageFontsIcon ).toBeVisible();
		} );

		test( 'should open the "Manage Fonts" modal when clicking the "Manage Fonts" icon', async ( {
			page,
		} ) => {
			await page.getByRole( 'button', { name: 'Styles' } ).click();
			await page
				.getByRole( 'button', { name: 'Typography Styles' } )
				.click();
			await page
				.getByRole( 'button', {
					name: 'Manage Fonts',
				} )
				.click();
			await expect( page.getByRole( 'dialog' ) ).toBeVisible();
			await expect(
				page.getByRole( 'heading', { name: 'Fonts' } )
			).toBeVisible();
		} );

		test( 'should show font variant panel when clicking on a font family', async ( {
			page,
		} ) => {
			await page.getByRole( 'button', { name: 'Styles' } ).click();
			await page
				.getByRole( 'button', { name: 'Typography Styles' } )
				.click();
			await page
				.getByRole( 'button', {
					name: /manage fonts/i,
				} )
				.click();
			await page.getByRole( 'button', { name: 'System Font' } ).click();
			await expect(
				page.getByRole( 'heading', { name: 'System Font' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'checkbox', { name: 'System Font Normal' } )
			).toBeVisible();
		} );
	} );

	test.describe( 'When user has permissions to edit font families', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentythree' );
		} );

		test.beforeEach( async ( { admin, editor, page } ) => {
			await admin.visitSiteEditor();
			await editor.canvas.locator( 'body' ).click();
			await page.getByRole( 'button', { name: 'Styles' } ).click();
			await page
				.getByRole( 'button', { name: 'Typography Styles' } )
				.click();
			await page
				.getByRole( 'button', {
					name: 'Manage Fonts',
				} )
				.click();

			// We need to wait the response from the `wp_font_family` request in order to test the Upload tab.
			await page.waitForResponse(
				( resp ) =>
					resp
						.url()
						.includes(
							'/index.php?rest_route=%2Fwp%2Fv2%2Ffont-families'
						) && resp.status() === 200,
				{ timeout: 50000 }
			);
		} );

		test( 'should display the "Upload" tab', async ( { page } ) => {
			await expect(
				page.getByRole( 'tab', { name: 'Upload' } )
			).toBeVisible();
		} );
	} );

	test.describe( 'When user does not have permission to edit font families', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentythree' );
			await requestUtils.activatePlugin(
				'gutenberg-test-font-library-permissions'
			);
		} );

		test.beforeEach( async ( { admin, editor, page } ) => {
			await admin.visitSiteEditor();
			await editor.canvas.locator( 'body' ).click();
			await page.getByRole( 'button', { name: 'Styles' } ).click();
			await page
				.getByRole( 'button', { name: 'Typography Styles' } )
				.click();
			await page
				.getByRole( 'button', {
					name: 'Manage Fonts',
				} )
				.click();

			// We need to wait the response from the `wp_font_family` request in order to test the Upload tab.
			await page.waitForResponse(
				( resp ) =>
					resp
						.url()
						.includes(
							'/index.php?rest_route=%2Fwp%2Fv2%2Ffont-families'
						) && resp.status() === 200,
				{ timeout: 50000 }
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-font-library-permissions'
			);
		} );

		test( 'should not display the "Upload" tab', async ( { page } ) => {
			await expect(
				page.getByRole( 'tab', { name: 'Upload' } )
			).toBeHidden();
		} );
	} );
} );
