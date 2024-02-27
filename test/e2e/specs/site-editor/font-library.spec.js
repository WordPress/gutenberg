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
		// Timeouts are increased in the following tests to account for the time it takes to load the font library tabs.

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
		} );

		test( 'should display the "Upload" tab and upload a local font', async ( {
			page,
			request,
		} ) => {
			await expect(
				page.getByRole( 'tab', { name: 'Upload' } )
			).toBeVisible( { timeout: 40000 } );

			// Ensure font does not exist before uploading
			const installedFonts = await request.get(
				`/wp-json/wp/v2/font-families`
			);
			console.log( installedFonts );
			const commissionerFont = await request.get(
				`/wp-json/wp/v2/font-families?slug=commissioner&_embed=true`
			);
			if ( commissionerFont.length > 0 ) {
				await request.delete(
					`/wp-json/wp/v2/font-families/${ commissionerFont[ 0 ].id }?force=true`
				);
			}

			// Upload a local font
			await page.getByRole( 'tab', { name: 'Upload' } ).click();
			const fileChooserPromise = page.waitForEvent( 'filechooser' );
			await page.getByRole( 'button', { name: 'Upload Font' } ).click();
			const fileChooser = await fileChooserPromise;
			await fileChooser.setFiles(
				'./test/e2e/assets/Commissioner-Regular.ttf'
			);

			// Check font was installed successfully
			await expect(
				page
					.getByLabel( 'Upload' )
					.getByText( 'Fonts were installed successfully.' )
			).toBeVisible( { timeout: 40000 } );
			await page.getByRole( 'tab', { name: 'Library' } ).click();
			await expect(
				page.getByRole( 'button', { name: 'Commissioner' } )
			).toBeVisible();
		} );

		test( 'should display the default collections tab', async ( {
			page,
		} ) => {
			await expect(
				page.getByRole( 'tab', { name: 'Install Fonts' } )
			).toBeVisible( { timeout: 40000 } );
		} );

		test( 'should display the "Delete" button and delete the font', async ( {
			page,
		} ) => {
			await page
				.getByRole( 'button', { name: 'Commissioner' } )
				.click( { timeout: 40000 } );

			await expect(
				page.getByRole( 'button', { name: 'Delete' } )
			).toBeVisible( { timeout: 40000 } );

			// Delete the font
			await page.getByRole( 'button', { name: 'Delete' } ).click();
			await page.getByRole( 'button', { name: 'Delete' } ).click();
		} );
	} );

	test.describe( 'When user does not have permission to edit font families', () => {
		// Timeouts are increased in the following tests to account for the time it takes to load the font library tabs.

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
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-font-library-permissions'
			);
		} );

		test( 'should not display the "Upload" tab', async ( { page } ) => {
			await expect(
				page.getByRole( 'tab', { name: 'Upload' } )
			).toBeHidden( { timeout: 40000 } );
		} );

		test( 'should not display the default collections tab', async ( {
			page,
		} ) => {
			await expect(
				page.getByRole( 'tab', { name: 'Install Fonts' } )
			).toBeHidden( { timeout: 40000 } );
		} );

		test( 'should not display the "Delete" button in the footer', async ( {
			page,
			requestUtils,
		} ) => {
			// Upload a local font, so we can test the delete button
			await requestUtils.deactivatePlugin(
				'gutenberg-test-font-library-permissions'
			);
			await page
				.getByRole( 'tab', { name: 'Upload' } )
				.click( { timeout: 40000 } );
			const fileChooserPromise = page.waitForEvent( 'filechooser' );
			await page.getByRole( 'button', { name: 'Upload Font' } ).click();
			const fileChooser = await fileChooserPromise;
			await fileChooser.setFiles(
				'./test/e2e/assets/Commissioner-Regular.ttf'
			);
			await requestUtils.activatePlugin(
				'gutenberg-test-font-library-permissions'
			);

			await page.getByRole( 'tab', { name: 'Library' } ).click();
			await page.getByRole( 'button', { name: 'Commissioner' } ).click();

			await expect(
				page.getByRole( 'button', { name: 'Delete' } )
			).toBeHidden();
		} );
	} );
} );
