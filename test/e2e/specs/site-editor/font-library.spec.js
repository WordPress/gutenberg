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

	test.describe( 'When switching Theme Style variations', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyfour' );
		} );

		test.beforeEach( async ( { admin, editor } ) => {
			await admin.visitSiteEditor();
			await editor.canvas.locator( 'body' ).click();
		} );

		test( 'clicking on a font in the global styles sidebar should activate the font in the overlay when switching Theme Style variation', async ( {
			page,
		} ) => {
			await page.getByRole( 'button', { name: /styles/i } ).click();

			// Click "Browse styles"
			await page.getByRole( 'button', { name: 'Browse styles' } ).click();

			// Activate "Ember" Theme Variation.
			await page.getByRole( 'button', { name: 'Ember' } ).click();

			// Click "Back" button
			await page.getByRole( 'button', { name: 'Back' } ).click();

			await page
				.getByRole( 'button', { name: 'Typography styles' } )
				.click();

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

			await page
				.getByRole( 'button', { name: 'Typography styles' } )
				.click();

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
