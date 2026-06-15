/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Plugins API Error Boundary', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-plugins-error-boundary'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-plugins-error-boundary'
		);
	} );

	test( 'Should create notice using plugin error boundary callback', async ( {
		admin,
		page,
	} ) => {
		let hasError = false;
		page.on( 'console', ( msg ) => {
			if ( msg.type() === 'error' && msg.text().includes( 'Whoops!' ) ) {
				hasError = true;
			}
		} );

		await admin.createNewPost();

		expect( hasError ).toBe( true );
		await expect(
			page.locator( '.is-error .components-notice__content' )
		).toContainText(
			'The "my-error-plugin" plugin has encountered an error and cannot be rendered.'
		);
	} );
} );
