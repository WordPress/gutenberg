/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'iframed multiple block stylesheets', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-iframed-multiple-stylesheets'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost( { postType: 'page' } );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-iframed-multiple-stylesheets'
		);
	} );

	test( 'should load multiple block stylesheets in iframe', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'test/iframed-multiple-stylesheets',
		} );
		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Iframed Multiple Stylesheets',
		} );

		await expect( block ).toBeVisible();

		// Style loaded from the main stylesheet.
		await expect( block ).toHaveCSS( 'border-style', 'dashed' );
		// Style loaded from the additional stylesheet.
		await expect( block ).toHaveCSS( 'border-color', 'rgb(255, 0, 0)' );
		// Style loaded from the a stylesheet using path instead of handle.
		await expect( block ).toHaveCSS( 'border-color', 'rgb(255, 0, 0)' );
	} );
} );
