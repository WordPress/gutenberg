/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'undo', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'does not empty header', async ( { admin, page, editor } ) => {
		await admin.visitSiteEditor( { canvas: 'edit' } );

		// Check if there's a valid child block with a type (not appender).
		await expect(
			editor.canvas.locator(
				'[data-type="core/template-part"] [data-type]'
			)
		).not.toHaveCount( 0 );

		// insert a block
		await editor.insertBlock( { name: 'core/paragraph' } );

		// undo
		await page
			.getByRole( 'button', {
				name: 'Undo',
			} )
			.click();

		// Check if there's a valid child block with a type (not appender).
		await expect(
			editor.canvas.locator(
				'[data-type="core/template-part"] [data-type]'
			)
		).not.toHaveCount( 0 );
	} );
} );
