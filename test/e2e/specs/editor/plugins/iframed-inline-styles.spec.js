/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'iframed inline styles', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-iframed-inline-styles'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-iframed-inline-styles'
		);
	} );

	test( 'should load inline styles in iframe', async ( {
		admin,
		editor,
		page,
	} ) => {
		let hasWarning;
		page.on( 'console', ( msg ) => {
			if ( msg.type() === 'warning' ) {
				hasWarning = true;
			}
		} );

		await admin.createNewPost( { postType: 'page' } );
		await editor.insertBlock( { name: 'test/iframed-inline-styles' } );

		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Iframed Inline Styles',
		} );
		await expect( block ).toBeVisible();

		// Inline styles of properly enqueued stylesheet should load.
		await expect( block ).toHaveCSS( 'padding', '20px' );

		// Inline styles of stylesheet loaded with the compatibility layer should load.
		await expect( block ).toHaveCSS( 'border-width', '2px' );
		expect( hasWarning ).toBe( true );
	} );
} );
