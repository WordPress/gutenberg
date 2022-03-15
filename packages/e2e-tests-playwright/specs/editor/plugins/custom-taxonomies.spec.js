/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Custom Taxonomies labels are used', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-custom-taxonomies' );
	} );

	test.beforeEach( async ( { pageUtils } ) => {
		await pageUtils.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-custom-taxonomies'
		);
	} );

	test( 'Ensures the custom taxonomy labels are respected', async ( {
		page,
		pageUtils,
	} ) => {
		// Open the Setting sidebar.
		await pageUtils.openDocumentSettingsSidebar();

		const openButton = await pageUtils.findSidebarPanelWithTitle( 'Model' );
		await expect( openButton ).toBeVisible();

		// Open the panel if it is not already opened.
		await pageUtils.openSidebarPanelWithTitle( 'Model' );

		// Check the "Add New Model" label.
		const labelNew = await page.locator(
			'label.components-form-token-field__label:has-text("Add New Model")'
		);
		await expect( labelNew ).toBeVisible();

		// Fill with one entry.
		await page.type(
			'input.components-form-token-field__input',
			'Model 1'
		);
		await page.keyboard.press( 'Enter' );

		// Check the "Remove Model" button.
		const buttonRemove = await page.locator(
			'button.components-form-token-field__remove-token[aria-label="Remove Model"]'
		);

		await expect( buttonRemove ).toBeVisible();
	} );
} );
