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
		const canvasHtml = editor.canvas.locator( 'html' );
		const canvasBody = editor.canvas.locator( 'body' );

		await expect( canvasBody ).toHaveCSS(
			'background-color',
			'rgb(33, 117, 155)'
		);
		await expect( canvasBody ).toHaveCSS( 'padding', '20px' );
		await expect( canvasHtml ).toHaveAttribute(
			'data-iframed-enqueue-block-assets-l10n',
			'Iframed Enqueue Block Assets!'
		);
	} );

	test( 'should run script modules added through enqueue_block_assets', async ( {
		editor,
	} ) => {
		await expect( editor.canvas.locator( 'html' ) ).toHaveAttribute(
			'data-iframed-enqueue-block-assets-module',
			'Iframed Enqueue Block Assets Module!'
		);
	} );

	test( 'should run script modules added through enqueue_block_assets in the site editor', async ( {
		admin,
		editor,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await expect( editor.canvas.locator( 'html' ) ).toHaveAttribute(
			'data-iframed-enqueue-block-assets-module',
			'Iframed Enqueue Block Assets Module!'
		);
	} );
} );
