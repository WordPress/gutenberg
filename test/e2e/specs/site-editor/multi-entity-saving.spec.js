/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site Editor - Multi-entity save flow', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.deleteAllTemplates( 'wp_template' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deleteAllTemplates( 'wp_template' ),
		] );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
		} );
		await editor.canvas.locator( 'body' ).click();
	} );

	test( 'save flow should work as expected', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Testing',
			},
		} );

		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save' } )
		).toBeEnabled();
		await expect(
			page
				.getByRole( 'region', { name: 'Save panel' } )
				.getByRole( 'button', { name: 'Open save panel' } )
		).toBeVisible();

		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );
		const saveButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save' } );
		await expect( saveButton ).toBeDisabled();

		// Check focus returns to Saved button.
		await expect( saveButton ).toBeFocused();
	} );

	test( 'save flow should allow re-saving after changing the same block attribute', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Testing',
			},
		} );

		const fontSizePicker = page
			.getByRole( 'region', { name: 'Editor Settings' } )
			.getByRole( 'group', { name: 'Font size' } );

		// Change font size.
		await fontSizePicker.getByRole( 'radio', { name: 'Small' } ).click();

		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );

		// Change font size again.
		await fontSizePicker.getByRole( 'radio', { name: 'Medium' } ).click();

		// The save button has been re-enabled.
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save' } )
		).toBeEnabled();
	} );
} );
