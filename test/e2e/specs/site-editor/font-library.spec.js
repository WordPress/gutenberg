/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Font Library', () => {
	test.describe( 'When a blank theme is active', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );
		} );

		test.beforeEach( async ( { admin } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//index',
				postType: 'wp_template',
				canvas: 'edit',
			} );
		} );

		test( 'should display the "no font installed." message', async ( {
			page,
		} ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Styles' } )
				.click();
			await page.getByRole( 'button', { name: 'Typography' } ).click();
			await page
				.getByRole( 'button', {
					name: 'Add fonts',
				} )
				.click();
			await page.getByRole( 'tab', { name: 'Library' } ).click();
			await expect(
				page.getByLabel( 'library' ).getByText( 'No fonts installed.' )
			).toBeVisible();
		} );

		test( 'should display the "Manage fonts" icon', async ( { page } ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Styles' } )
				.click();
			await page.getByRole( 'button', { name: 'Typography' } ).click();
			const manageFontsIcon = page.getByRole( 'button', {
				name: 'Manage fonts',
			} );
			await expect( manageFontsIcon ).toBeVisible();
		} );
	} );

	test.describe( 'When a theme with bundled fonts is active', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentythree' );
		} );

		test.beforeEach( async ( { admin } ) => {
			await admin.visitSiteEditor( {
				postId: 'twentytwentythree//index',
				postType: 'wp_template',
				canvas: 'edit',
			} );
		} );

		test( 'should display the "Manage fonts" icon', async ( { page } ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Styles' } )
				.click();
			await page.getByRole( 'button', { name: 'Typography' } ).click();
			const manageFontsIcon = page.getByRole( 'button', {
				name: 'Manage fonts',
			} );
			await expect( manageFontsIcon ).toBeVisible();
		} );

		test( 'should open the "Manage fonts" modal when clicking the "Manage fonts" icon', async ( {
			page,
		} ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Styles' } )
				.click();
			await page.getByRole( 'button', { name: 'Typography' } ).click();
			await page
				.getByRole( 'button', {
					name: 'Manage fonts',
				} )
				.click();
			await expect( page.getByRole( 'dialog' ) ).toBeVisible();
			await expect(
				page.getByRole( 'heading', { name: 'Fonts', exact: true } )
			).toBeVisible();
		} );

		test( 'should show font variant panel when clicking on a font family', async ( {
			page,
		} ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Styles' } )
				.click();
			await page.getByRole( 'button', { name: 'Typography' } ).click();
			await page
				.getByRole( 'button', {
					name: 'Manage fonts',
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

	test.describe( 'When a user manages custom fonts via the UI', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );
			/*
			 * Delete all installed fonts, font files, the fonts directory, and user font settings
			 * in global styles for the active theme before and after starting the tests.
			 */
			await requestUtils.activatePlugin(
				'gutenberg-test-delete-installed-fonts'
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-delete-installed-fonts'
			);
		} );

		test.beforeEach( async ( { admin } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//index',
				postType: 'wp_template',
				canvas: 'edit',
			} );
		} );

		test( 'should allow user to add and remove multiple local font files', async ( {
			page,
			editor,
		} ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Styles' } )
				.click();
			await page.getByRole( 'button', { name: 'Typography' } ).click();
			await page
				.getByRole( 'button', {
					name: 'Add fonts',
				} )
				.click();

			// Upload local fonts.
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
			).toBeVisible();
			await page.getByRole( 'tab', { name: 'Library' } ).click();
			// Provides coverage for https://github.com/WordPress/gutenberg/issues/60040.
			await page.getByRole( 'button', { name: 'Exo 2' } ).click();
			await expect( page.getByLabel( 'Exo 2 Normal' ) ).toBeVisible();
			await expect(
				page.getByLabel( 'Exo 2 Semi-bold Italic' )
			).toBeVisible();

			// Check CSS preset was created.
			await page.getByRole( 'button', { name: 'Close' } ).click();
			await page
				.getByRole( 'button', { name: 'Headings', exact: true } )
				.click();
			await page.getByRole( 'combobox', { name: 'Font' } ).click();
			await page.getByRole( 'option', { name: 'Exo 2' } ).click();
			await expect(
				editor.canvas.locator( '.is-root-container h1' )
			).toHaveCSS( 'font-family', '"Exo 2"' );

			// Check fonts can be uninstalled.
			await page.getByRole( 'button', { name: 'Back' } ).click();
			await page
				.getByRole( 'button', {
					name: 'Manage fonts',
				} )
				.click();

			await page.getByRole( 'button', { name: 'Exo 2' } ).click();
			await page.getByRole( 'button', { name: 'Delete' } ).click();
			await page.getByRole( 'button', { name: 'Delete' } ).click();
			await expect(
				page
					.getByLabel( 'Library' )
					.getByText( 'Font family uninstalled successfully.' )
			).toBeVisible();
		} );
	} );

	test.describe( 'When switching Theme Style variations', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyfour' );
		} );

		test.beforeEach( async ( { admin } ) => {
			await admin.visitSiteEditor( {
				postId: 'twentytwentyfour//home',
				postType: 'wp_template',
				canvas: 'edit',
			} );
		} );

		test( 'clicking on a font in the global styles sidebar should activate the font in the overlay when switching Theme Style variation', async ( {
			page,
		} ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Styles' } )
				.click();

			// Click "Browse styles"
			await page.getByRole( 'button', { name: 'Browse styles' } ).click();

			// Activate "Ember" Theme Variation.
			await page.getByRole( 'button', { name: 'Ember' } ).click();

			// Click "Back" button
			await page.getByRole( 'button', { name: 'Back' } ).click();

			await page.getByRole( 'button', { name: 'Typography' } ).click();

			// Click "Jost 2 variants" button
			await page
				.getByRole( 'button', { name: 'Jost 2 variants' } )
				.click();

			await expect( page.getByRole( 'dialog' ) ).toBeVisible();
			await expect(
				page.getByRole( 'heading', { name: 'Fonts' } )
			).toBeVisible();

			// Check correct font is displayed in Font Library
			await expect(
				page.getByRole( 'heading', { name: 'Jost' } )
			).toBeVisible();

			// Close the Font Library dialog
			await page.getByRole( 'button', { name: 'Close' } ).click();

			// Click "Back"
			await page.getByRole( 'button', { name: 'Back' } ).click();

			// Click "Browse styles"
			await page.getByRole( 'button', { name: 'Browse styles' } ).click();

			// Activate "Maelstrom" Theme Variation.
			await page.getByRole( 'button', { name: 'Maelstrom' } ).click();

			// Click "Back" button
			await page.getByRole( 'button', { name: 'Back' } ).click();

			await page.getByRole( 'button', { name: 'Typography' } ).click();

			// Click Cardo font-family.
			await page
				.getByRole( 'button', { name: 'Cardo 3 variants' } )
				.click();

			await expect( page.getByRole( 'dialog' ) ).toBeVisible();
			await expect(
				page.getByRole( 'heading', { name: 'Fonts' } )
			).toBeVisible();

			// Check correct font is displayed in Font Library
			await expect(
				page.getByRole( 'heading', { name: 'Cardo' } )
			).toBeVisible();
		} );
	} );
} );
