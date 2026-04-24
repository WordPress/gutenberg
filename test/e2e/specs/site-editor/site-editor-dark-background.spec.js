/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor with dark background theme', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'darktheme' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.describe( 'Site editor iframe body', () => {
		test( 'Should have the is-dark-theme CSS class', async ( {
			editor,
		} ) => {
			const canvasBody = editor.canvas.locator( 'body' );

			await expect( canvasBody ).toHaveClass( /is-dark-theme/ );
		} );
	} );
} );

test.describe( 'Site editor with light background theme and theme variations', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyfour' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.describe( 'Site editor iframe body', () => {
		test( 'Should not have the is-dark-theme CSS class', async ( {
			editor,
		} ) => {
			const canvasBody = editor.canvas.locator( 'body' );

			await expect( canvasBody ).not.toHaveClass( /is-dark-theme/ );
		} );

		test( 'Should add and remove the is-dark-theme CSS class with dark and light theme variation', async ( {
			page,
			editor,
		} ) => {
			// Click "Styles"
			await page.getByRole( 'button', { name: 'Styles' } ).click();

			// Click "Browse styles"
			await page.getByRole( 'button', { name: 'Browse styles' } ).click();

			const canvasBody = editor.canvas.locator( 'body' );

			// Activate "Maelstrom" Theme Variation.
			await page.getByRole( 'button', { name: 'Maelstrom' } ).click();

			await expect( canvasBody ).toHaveClass( /is-dark-theme/ );

			// Activate "Ember" Theme Variation.
			await page.getByRole( 'button', { name: 'Ember' } ).click();

			await expect( canvasBody ).not.toHaveClass( /is-dark-theme/ );
		} );
	} );
} );
