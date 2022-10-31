/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block context', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-custom-taxonomies' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-custom-taxonomies'
		);
	} );

	test( 'Ensures the custom taxonomy labels are respected', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		// Verify Model
		const openButton = page.locator( "role=button[name='Model'i]" );
		expect( openButton ).not.toBeFalsy();

		// Open Model
		await openButton.click();

		// Check the add new button.
		const labelNew = page.locator(
			"role=StaticText[name='ADD NEW MODEL'i]"
		);
		expect( labelNew ).not.toBeFalsy();

		// Fill with one entry.
		await page.type( "role=combobox[name='ADD NEW MODEL'i]", 'Model 1' );
		await page.keyboard.press( 'Enter' );

		// Check the "Remove Model"
		const value = page.locator( "role=button[name='Remove Model'i]" );
		expect( value ).not.toBeFalsy();
	} );
} );
