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

		test( 'should allow user to upload multiple local font files', async ( {
			page,
			editor,
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

			// Delete test font family (Exo 2) if it exists.
			await expect(
				page.getByRole( 'tab', { name: 'Upload' } )
			).toBeVisible( { timeout: 80000 } );

			if (
				await page.getByRole( 'button', { name: 'Exo 2' } ).isVisible()
			) {
				await page.getByRole( 'button', { name: 'Exo 2' } ).click();
				await page.getByRole( 'button', { name: 'Delete' } ).click();
				await page.getByRole( 'button', { name: 'Delete' } ).click();
				await page.getByRole( 'tab', { name: 'Library' } ).click();
				await expect(
					page
						.getByLabel( 'Library' )
						.getByText( 'Font family uninstalled successfully.' )
				).toBeVisible( { timeout: 40000 } );
			}

			// Upload local fonts
			await page.getByRole( 'tab', { name: 'Upload' } ).click();
			const fileChooserPromise = page.waitForEvent( 'filechooser' );
			await page.getByRole( 'button', { name: 'Upload Font' } ).click();
			const fileChooser = await fileChooserPromise;
			// Provides coverage for https://github.com/WordPress/gutenberg/issues/59023.
			await fileChooser.setFiles( [
				'./test/e2e/assets/Exo2-Regular.woff',
				'./test/e2e/assets/Exo2-SemiBoldItalic.woff2',
			] );

			// Check fonts were installed.
			await expect(
				page
					.getByLabel( 'Upload' )
					.getByText( 'Fonts were installed successfully.' )
			).toBeVisible( { timeout: 40000 } );
			await page.getByRole( 'tab', { name: 'Library' } ).click();
			// Provides coverage for https://github.com/WordPress/gutenberg/issues/60040.
			await expect(
				page.getByRole( 'button', { name: 'Exo 2' } )
			).toBeVisible();

			// Check CSS preset was created.
			await page.getByRole( 'button', { name: 'Close' } ).click();
			await page
				.getByRole( 'button', { name: 'Typography Headings styles' } )
				.click();
			await page.getByLabel( 'Font' ).selectOption( 'Exo 2' );
			await expect(
				editor.canvas.locator( '.is-root-container h1' )
			).toHaveCSS( 'font-family', '"Exo 2"' );
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
					name: 'Manage Fonts',
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
} );
