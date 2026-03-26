/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Font Library', () => {
	test.describe( 'When a user manages custom fonts via the UI', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyone' );
			/*
			 * Delete all installed fonts, font files, the fonts directory, and user font settings
			 * in global styles for the active theme before and after starting the tests.
			 */
			await requestUtils.activatePlugin(
				'gutenberg-test-delete-installed-fonts'
			);
		} );

		test.beforeEach( async ( { admin } ) => {
			await admin.visitAdminPage(
				'admin.php',
				'page=font-library-wp-admin'
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-delete-installed-fonts'
			);
		} );

		test( 'should allow user to add and remove multiple local font files', async ( {
			page,
			editor,
			admin,
		} ) => {
			await page.getByRole( 'tab', { name: 'Upload' } ).click();

			// Upload local fonts.
			const fileChooserPromise = page.waitForEvent( 'filechooser' );
			await page.getByRole( 'button', { name: 'Upload Font' } ).click();
			const fileChooser = await fileChooserPromise;
			// Provides coverage for https://github.com/WordPress/gutenberg/issues/59023.
			await fileChooser.setFiles( [
				'./assets/Exo2-Regular.woff',
				'./assets/Exo2-SemiBoldItalic.woff2',
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

			// Check CSS preset was created by creating a post and applying the font.
			await admin.createNewPost();
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( 'Testing custom font' );

			// Open typography settings and apply the custom font.
			await page
				.getByRole( 'button', { name: 'Typography options' } )
				.click();
			await page
				.getByRole( 'menuitemcheckbox', { name: 'Show Font' } )
				.click();
			await page.getByRole( 'combobox', { name: 'Font' } ).click();
			await page.getByRole( 'option', { name: 'Exo 2' } ).click();
			await expect(
				editor.canvas.locator( 'p:has-text("Testing custom font")' )
			).toHaveCSS( 'font-family', '"Exo 2"' );

			// Publish the post and verify font is applied on frontend.
			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			// Verify the font is applied in the frontend.
			await expect(
				page.locator( 'p:has-text("Testing custom font")' )
			).toHaveCSS( 'font-family', '"Exo 2"' );

			// Verify the font is actually loaded by checking document.fonts.
			const isFontLoaded = await page.evaluate( async () => {
				try {
					// Attempt to load the font - this will throw or return empty array if not available.
					const fonts = await document.fonts.load( '16px "Exo 2"' );
					return fonts.length > 0;
				} catch {
					return false;
				}
			} );
			expect( isFontLoaded ).toBe( true );

			// Check fonts can be uninstalled.
			await admin.visitAdminPage(
				'admin.php',
				'page=font-library-wp-admin'
			);

			await page.getByRole( 'button', { name: 'Exo 2' } ).click();
			await page.getByRole( 'button', { name: 'Delete' } ).click();
			await expect(
				page.getByText(
					'Are you sure you want to delete "Exo 2" font and all its variants and assets?'
				)
			).toBeVisible();
			await page.getByRole( 'button', { name: 'Delete' } ).click();
			await expect(
				page
					.getByLabel( 'Library' )
					.getByText( 'Font family uninstalled successfully.' )
			).toBeVisible();
		} );

		test( 'should handle fonts with special characters in the name', async ( {
			page,
			editor,
			admin,
		} ) => {
			// The font's OpenType name table family name contains special characters:
			// `"Ephesis" font with <special \> {chars} & things, ya'know?`
			const fontNamePattern = /Ephesis/;

			await page.getByRole( 'tab', { name: 'Upload' } ).click();

			// Upload the font with special characters in its name.
			const fileChooserPromise = page.waitForEvent( 'filechooser' );
			await page.getByRole( 'button', { name: 'Upload Font' } ).click();
			const fileChooser = await fileChooserPromise;
			await fileChooser.setFiles( [
				'./test/e2e/assets/Ephesis-modified-name.ttf',
			] );

			// Check font was installed.
			await expect(
				page
					.getByLabel( 'Upload' )
					.getByText( 'Fonts were installed successfully.' )
			).toBeVisible();

			// Verify font appears in Library tab.
			await page.getByRole( 'tab', { name: 'Library' } ).click();
			const fontButton = page.getByRole( 'button', {
				name: fontNamePattern,
			} );
			await expect( fontButton ).toBeVisible();

			// Navigate to post editor and apply the font.
			await admin.createNewPost();
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.keyboard.type( 'Testing special chars font' );

			// Open typography settings and apply the custom font.
			await page
				.getByRole( 'button', { name: 'Typography options' } )
				.click();
			await page
				.getByRole( 'menuitemcheckbox', { name: 'Show Font' } )
				.click();
			await page.getByRole( 'combobox', { name: 'Font' } ).click();
			await page.getByRole( 'option', { name: fontNamePattern } ).click();

			// Verify font-family CSS is applied in the editor canvas.
			await expect(
				editor.canvas.locator(
					'p:has-text("Testing special chars font")'
				)
			).toHaveCSS( 'font-family', /Ephesis/ );

			// Publish the post and verify font is applied on frontend.
			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			// Verify font-family CSS is applied in the frontend.
			await expect(
				page.locator( 'p:has-text("Testing special chars font")' )
			).toHaveCSS( 'font-family', /Ephesis/ );

			// Verify the font is actually loaded using the FontFaceSet API.
			const isFontLoaded = await page.evaluate( () => {
				for ( const face of document.fonts ) {
					if ( face.family.includes( 'Ephesis' ) ) {
						return true;
					}
				}
				return false;
			} );
			expect( isFontLoaded ).toBe( true );

			// Delete the font.
			await admin.visitAdminPage(
				'admin.php',
				'page=font-library-wp-admin'
			);

			await page.getByRole( 'button', { name: fontNamePattern } ).click();
			await page.getByRole( 'button', { name: 'Delete' } ).click();
			await expect(
				page.getByText( /Are you sure you want to delete.*Ephesis/ )
			).toBeVisible();
			await page.getByRole( 'button', { name: 'Delete' } ).click();
			await expect(
				page
					.getByLabel( 'Library' )
					.getByText( 'Font family uninstalled successfully.' )
			).toBeVisible();
		} );
	} );
} );
