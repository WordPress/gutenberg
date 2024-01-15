/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'iframed enqueue block assets', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.activatePlugin(
				'gutenberg-test-iframed-enqueue-block-assets'
			),
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deactivatePlugin(
				'gutenberg-test-iframed-enqueue-block-assets'
			),
		] );
	} );

	test( 'should load styles added through enqueue_block_assets', async ( {
		editor,
	} ) => {
		const canvasBody = editor.canvas.locator( 'body' );

		await expect( canvasBody ).toHaveCSS(
			'background-color',
			'rgb(33, 117, 155)'
		);
		await expect( canvasBody ).toHaveCSS( 'padding', '20px' );
		await expect( canvasBody ).toHaveAttribute(
			'data-iframed-enqueue-block-assets-l10n',
			'Iframed Enqueue Block Assets!'
		);
	} );
} );
