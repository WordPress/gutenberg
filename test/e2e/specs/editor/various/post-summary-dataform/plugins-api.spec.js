const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS } = require( './utils' );

/*
 * Mirrors the 'Post Status Info' test of
 * `test/e2e/specs/editor/plugins/plugins-api.spec.js` with the DataForm
 * inspector experiment enabled; delete that test there when the experiment
 * graduates. The other tests of that classic file don't drive the summary and
 * stay where they are.
 */
test.describe( 'Plugins API (DataForm inspector)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-plugins-api'
		);
	} );

	test.beforeEach( async ( { admin, requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( EXPERIMENTS );
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-plugins-api'
		);
	} );

	test.describe( 'Post Status Info', () => {
		test( 'Should render post status info inside Document Setting sidebar', async ( {
			editor,
			page,
		} ) => {
			await editor.openDocumentSettingsSidebar();

			await expect(
				page
					.getByRole( 'region', { name: 'Editor settings' } )
					.locator( '.my-post-status-info-plugin' )
			).toHaveText( 'My post status info' );
		} );
	} );
} );
