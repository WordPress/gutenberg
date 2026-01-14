/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block editor with dark background theme', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'darktheme' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.describe( 'Block editor iframe body', () => {
		test( 'Should have the is-dark-theme CSS class', async ( {
			editor,
		} ) => {
			const canvasBody = editor.canvas.locator( 'body' );

			await expect( canvasBody ).toHaveClass( /is-dark-theme/ );
		} );
	} );
} );

test.describe( 'Block editor with light background theme', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyfour' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.describe( 'Block editor iframe body', () => {
		test( 'Should not have the is-dark-theme CSS class', async ( {
			editor,
		} ) => {
			const canvasBody = editor.canvas.locator( 'body' );

			await expect( canvasBody ).not.toHaveClass( /is-dark-theme/ );
		} );
	} );
} );
