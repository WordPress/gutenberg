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
} );
