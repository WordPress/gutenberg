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
			await page.getByRole( 'button', { name: /styles/i } ).click();
			await page
				.getByRole( 'button', { name: /typography styles/i } )
				.click();
			const manageFontsIcon = page.getByRole( 'button', {
				name: /manage fonts/i,
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
			await page.getByRole( 'button', { name: /styles/i } ).click();
			await page
				.getByRole( 'button', { name: /typography styles/i } )
				.click();
			const manageFontsIcon = page.getByRole( 'button', {
				name: /manage fonts/i,
			} );
			await expect( manageFontsIcon ).toBeVisible();
		} );

		test( 'should open the "Manage Fonts" modal when clicking the "Manage Fonts" icon', async ( {
			page,
		} ) => {
			await page.getByRole( 'button', { name: /styles/i } ).click();
			await page
				.getByRole( 'button', { name: /typography styles/i } )
				.click();
			await page
				.getByRole( 'button', {
					name: /manage fonts/i,
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
			await page.getByRole( 'button', { name: /styles/i } ).click();
			await page
				.getByRole( 'button', { name: /typography styles/i } )
				.click();
			await page
				.getByRole( 'button', {
					name: /manage fonts/i,
				} )
				.click();
			await page.getByRole( 'button', { name: /system font/i } ).click();
			await expect(
				page.getByRole( 'heading', { name: /system font/i } )
			).toBeVisible();
			await expect(
				page.getByRole( 'checkbox', { name: /system font normal/i } )
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
			await page.getByRole( 'button', { name: /styles/i } ).click();
			await page
				.getByRole( 'button', { name: /typography styles/i } )
				.click();
			await page
				.getByRole( 'button', {
					name: /manage fonts/i,
				} )
				.click();
		} );

		test( 'should display the "Upload" tab and upload a local font', async ( {
			page,
		} ) => {
			await expect(
				page.getByRole( 'tab', { name: /upload/i } )
			).toBeVisible( { timeout: 40000 } );

			// Upload a local font
			if (
				await page
					.getByRole( 'button', { name: /commissioner/i } )
					.isVisible( { timeout: 40000 } )
			) {
				await page
					.getByRole( 'button', { name: /commissioner/i } )
					.click();
				await page.getByRole( 'button', { name: /delete/i } ).click();
				await page.getByRole( 'button', { name: /delete/i } ).click();
			}
			await page.getByRole( 'tab', { name: /upload/i } ).click();
			const fileChooserPromise = page.waitForEvent( 'filechooser' );
			await page.getByRole( 'button', { name: /upload font/i } ).click();
			const fileChooser = await fileChooserPromise;
			await fileChooser.setFiles(
				'./test/e2e/assets/Commissioner-Regular.ttf'
			);

			// Check font was installed
			await expect(
				page
					.getByLabel( 'Upload' )
					.getByText( 'Fonts were installed successfully.' )
			).toBeVisible( { timeout: 40000 } );
			await page.getByRole( 'tab', { name: /library/i } ).click();
			await expect(
				page.getByRole( 'button', { name: /commissioner/i } )
			).toBeVisible();
		} );

		test( 'should display the default collections tab', async ( {
			page,
		} ) => {
			await expect(
				page.getByRole( 'tab', { name: /install fonts/i } )
			).toBeVisible( { timeout: 40000 } );
		} );

		test( 'should display the "Delete" button and delete the font', async ( {
			page,
		} ) => {
			await page
				.getByRole( 'button', { name: /commissioner/i } )
				.click( { timeout: 40000 } );

			await expect(
				page.getByRole( 'button', { name: /delete/i } )
			).toBeVisible( { timeout: 40000 } );

			// Delete the font
			await page.getByRole( 'button', { name: /delete/i } ).click();
			await page.getByRole( 'button', { name: /delete/i } ).click();
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
			await page.getByRole( 'button', { name: /styles/i } ).click();
			await page
				.getByRole( 'button', { name: /typography styles/i } )
				.click();
			await page
				.getByRole( 'button', {
					name: /manage fonts/i,
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
				page.getByRole( 'tab', { name: /upload/i } )
			).toBeHidden( { timeout: 40000 } );
		} );

		test( 'should not display the default collections tab', async ( {
			page,
		} ) => {
			await expect(
				page.getByRole( 'tab', { name: /install fonts/i } )
			).toBeHidden( { timeout: 40000 } );
		} );

		test( 'should not display the "Delete" button in the footer', async ( {
			page,
			requestUtils,
		} ) => {
			// Upload a local font
			await requestUtils.deactivatePlugin(
				'gutenberg-test-font-library-permissions'
			);
			await page
				.getByRole( 'tab', { name: /upload/i } )
				.click( { timeout: 40000 } );
			const fileChooserPromise = page.waitForEvent( 'filechooser' );
			await page.getByRole( 'button', { name: /upload font/i } ).click();
			const fileChooser = await fileChooserPromise;
			await fileChooser.setFiles(
				'./test/e2e/assets/Commissioner-Regular.ttf'
			);
			await requestUtils.activatePlugin(
				'gutenberg-test-font-library-permissions'
			);

			await page.getByRole( 'tab', { name: /library/i } ).click();
			await page.getByRole( 'button', { name: /commissioner/i } ).click();

			await expect(
				page.getByRole( 'button', { name: /delete/i } )
			).toBeHidden();
		} );
	} );
} );
