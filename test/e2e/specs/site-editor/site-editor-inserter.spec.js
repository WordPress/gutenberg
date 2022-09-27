/**
 * WordPress dependencies
 */
const { test } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block list view', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor();
	} );

	test( 'inserter toggle button should toggle global inserter', async ( {
		page,
	} ) => {
		await page
			.locator( 'role=button[name="Toggle block inserter"i]' )
			.click();
		await page
			.locator( '.edit-site-editor__inserter-panel' )
			.waitFor( { state: 'visible' } );
		await page
			.locator( 'role=button[name="Toggle block inserter"i]' )
			.click();
		await page
			.locator( '.edit-site-editor__inserter-panel' )
			.waitFor( { state: 'hidden' } );
	} );
} );
