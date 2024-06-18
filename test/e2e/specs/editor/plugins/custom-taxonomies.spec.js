/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Custom Taxonomies labels are used', () => {
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
		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		const modelPanel = editorSettings.getByRole( 'button', {
			name: 'Model',
		} );

		// Open the panel if needed.
		if (
			( await modelPanel.getAttribute( 'aria-expanded' ) ) === 'false'
		) {
			await modelPanel.click();
		}

		// Check the add new button.
		await editorSettings
			.getByRole( 'combobox', { name: 'Add New Model' } )
			.fill( 'Model 1' );
		await page.keyboard.press( 'Enter' );

		await expect(
			editorSettings.getByRole( 'button', { name: 'Remove Mode' } )
		).toBeVisible();
	} );
} );
