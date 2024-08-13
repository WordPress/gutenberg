/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Editor - Multi-entity save flow', () => {
	let originalSiteTitle, originalBlogDescription;

	test.beforeEach( async ( { requestUtils } ) => {
		const siteSettings = await requestUtils.getSiteSettings();

		originalSiteTitle = siteSettings.title;
		originalBlogDescription = siteSettings.description;
	} );

	test.afterEach( async ( { requestUtils, editor } ) => {
		await requestUtils.updateSiteSettings( {
			title: originalSiteTitle,
			description: originalBlogDescription,
		} );

		// Restore the Publish sidebar.
		await editor.setPreferences( 'core', {
			isPublishSidebarEnabled: true,
		} );
	} );

	test( 'Save flow should work as expected', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Test Post...' );
		await page.keyboard.press( 'Enter' );

		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		const publishButton = topBar.getByRole( 'button', { name: 'Publish' } );
		const saveButton = topBar.getByRole( 'button', {
			name: 'Save',
			exact: true,
		} );

		// Should not trigger multi-entity save button with only post edited.
		await expect( publishButton ).toBeEnabled();

		const openPublishPanel = page.getByRole( 'button', {
			name: 'Open publish panel',
		} );
		const openSavePanel = page.getByRole( 'button', {
			name: 'Open save panel',
		} );
		const publishPanel = page.getByRole( 'region', {
			name: 'Editor publish',
		} );

		// Should only have publish panel a11y button active with only post edited.
		await expect( openPublishPanel ).toBeVisible();
		await expect( openSavePanel ).toBeHidden();
		await expect( publishPanel ).not.toContainText(
			'Are you ready to publish?'
		);
		await expect( publishPanel ).not.toContainText(
			'Are you ready to save?'
		);

		// Add a title block and edit it.
		await editor.insertBlock( {
			name: 'core/site-title',
		} );
		const siteTitleField = editor.canvas.getByRole( 'textbox', {
			name: 'Site title text',
		} );
		await siteTitleField.fill( `${ originalSiteTitle }...` );

		// Should trigger multi-entity save button once template part edited.
		await expect( saveButton ).toBeVisible();

		// Should only have save panel a11y button active after child entities edited.
		await expect( openPublishPanel ).toBeHidden();
		await expect( openSavePanel ).toBeVisible();
		await expect( publishPanel ).not.toContainText(
			'Are you ready to publish?'
		);
		await expect( publishPanel ).not.toContainText(
			'Are you ready to save?'
		);

		// Opening panel has boxes checked by default.
		await saveButton.click();
		await expect( publishPanel ).toContainText( 'Are you ready to save?' );
		const allCheckboxes = await publishPanel
			.getByRole( 'checkbox' )
			.count();
		await expect(
			publishPanel.getByRole( 'checkbox', { checked: true } )
		).toHaveCount( allCheckboxes );

		// Should not show other panels (or their a11y buttons) while save panel opened.
		await expect( openPublishPanel ).toBeHidden();
		await expect( openSavePanel ).toBeHidden();
		await expect( publishPanel ).not.toContainText(
			'Are you ready to publish?'
		);

		// Publish panel should open after saving.
		await publishPanel.getByRole( 'button', { name: 'Save' } ).click();
		await expect( publishPanel ).toContainText(
			'Are you ready to publish?'
		);

		// No other panels (or their a11y buttons) should be present with publish panel open.
		await expect( openPublishPanel ).toBeHidden();
		await expect( openSavePanel ).toBeHidden();
		await expect( publishPanel ).not.toContainText(
			'Are you ready to save?'
		);

		// Close publish panel.
		await publishPanel.getByRole( 'button', { name: 'Cancel' } ).click();

		// Verify saving is disabled.
		await expect(
			topBar.getByRole( 'button', { name: 'Saved' } )
		).toBeDisabled();
		await expect( openSavePanel ).toBeHidden();

		await editor.publishPost();

		// Update the post.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Updated post title' );

		// Verify update button is enabled.
		await expect( saveButton ).toBeEnabled();

		// Verify multi-entity saving not enabled.
		await expect( publishPanel ).toBeHidden();

		await siteTitleField.fill( `${ originalSiteTitle }!` );

		// Multi-entity saving should be enabled.
		await expect( openSavePanel ).toBeEnabled();
	} );

	test( 'Site blocks should save individually', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.setPreferences( 'core', {
			isPublishSidebarEnabled: false,
		} );

		// Add site blocks.
		await editor.insertBlock( {
			name: 'core/site-title',
		} );
		await editor.insertBlock( {
			name: 'core/site-tagline',
		} );

		const siteTitleField = editor.canvas.getByRole( 'textbox', {
			name: 'Site title text',
		} );

		// Ensure title is retrieved before typing.
		await expect( siteTitleField ).toHaveText( originalSiteTitle );

		await siteTitleField.fill( `${ originalSiteTitle }...` );
		await editor.canvas
			.getByRole( 'document', {
				name: 'Block: Site Tagline',
			} )
			.fill( 'Just another WordPress site' );

		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		const publishPanel = page.getByRole( 'region', {
			name: 'Editor publish',
		} );

		await topBar
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();
		await expect( publishPanel.getByRole( 'checkbox' ) ).toHaveCount( 3 );

		// Skip site title saving.
		await publishPanel
			.getByRole( 'checkbox', {
				name: 'Title',
			} )
			.setChecked( false );

		await publishPanel.getByRole( 'button', { name: 'Save' } ).click();

		// Wait for the snackbar notice that the post has been published.
		await page
			.getByRole( 'button', { name: 'Dismiss this notice' } )
			.filter( { hasText: 'published' } )
			.waitFor();

		await topBar.getByRole( 'button', { name: 'Save' } ).click();

		await expect( publishPanel.getByRole( 'checkbox' ) ).toHaveCount( 1 );
	} );
} );
