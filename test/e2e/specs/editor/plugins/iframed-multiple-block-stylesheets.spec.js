/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'iframed multiple block stylesheets', () => {
	test.beforeEach( async ( { admin, requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-iframed-multiple-stylesheets'
		);
		await admin.createNewPost( { postType: 'page' } );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-iframed-multiple-stylesheets'
		);
	} );

	test( 'should load multiple block stylesheets in iframe', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'test/iframed-multiple-stylesheets',
		} );

		await page.waitForSelector(
			'.wp-block-test-iframed-multiple-stylesheets'
		);

		// open page from sidebar settings
		await editor.openDocumentSettingsSidebar();

		await page.click( "button[aria-label='Page']" );
		await page.click( 'role=button[name="Template"i]' );
		await page.click( 'role=button[name="New"i]' );
		await page.fill( 'role=textbox[name="NAME"i]', 'Iframed Test' );
		await page.click( 'role=button[name="Create"i]' );

		expect(
			page.locator( '.edit-post-visual-editor__content-area' )
		).toBeVisible();

		const frameitem = page.frameLocator( "iframe[title='Editor canvas']" );

		// Style loaded from the main stylesheet.
		expect(
			frameitem.locator( '.wp-block-test-iframed-multiple-stylesheets' )
		).toHaveCSS( 'border-style', 'dashed' );

		// Style loaded from the additional stylesheet.
		expect(
			frameitem.locator( '.wp-block-test-iframed-multiple-stylesheets' )
		).toHaveCSS( 'border-color', 'rgb(40, 48, 61)' );

		// Style loaded from the a stylesheet using path instead of handle.
		expect(
			frameitem.locator( '.wp-block-test-iframed-multiple-stylesheets' )
		).toHaveCSS( 'background-color', 'rgba(0, 0, 0, 0)' );
	} );
} );
