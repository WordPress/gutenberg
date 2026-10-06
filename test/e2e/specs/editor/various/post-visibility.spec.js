const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post visibility', () => {
	[ 'large', 'small' ].forEach( ( viewport ) => {
		test( `can be changed when the viewport is ${ viewport }`, async ( {
			page,
			admin,
			pageUtils,
			editor,
		} ) => {
			await pageUtils.setBrowserViewport( viewport );

			await admin.createNewPost();

			await editor.openDocumentSettingsSidebar();

			await page
				.getByRole( 'button', { name: 'Change status:' } )
				.click();
			await page.getByRole( 'radio', { name: 'Private' } ).click();

			const currentStatus = await page.evaluate( () => {
				return window.wp.data
					.select( 'core/editor' )
					.getEditedPostAttribute( 'status' );
			} );

			expect( currentStatus ).toBe( 'private' );
		} );
	} );

	test( 'visibility remains private even if the publish date is in the future', async ( {
		page,
		admin,
		editor,
	} ) => {
		await admin.createNewPost();

		// Enter a title for this post.
		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.type( 'Title' );

		await editor.openDocumentSettingsSidebar();

		// Set a publish date for the next month.
		await page
			.getByRole( 'button', { name: 'Change date: Immediately' } )
			.click();

		await page.getByRole( 'button', { name: 'View next month' } ).click();
		await page
			.getByRole( 'application', { name: 'Calendar', exact: true } )
			.getByText( '15' )
			.click();
		await page
			.locator( '.block-editor-publish-date-time-picker' )
			.getByRole( 'button', {
				name: 'Close',
			} )
			.click();
		await page.getByRole( 'button', { name: 'Change status:' } ).click();
		await page.getByRole( 'radio', { name: 'Private' } ).click();
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', {
				name: 'Save',
				exact: true,
			} )
			.click();

		const currentStatus = await page.evaluate( () => {
			return window.wp.data
				.select( 'core/editor' )
				.getEditedPostAttribute( 'status' );
		} );

		expect( currentStatus ).toBe( 'private' );
	} );

	test( 'can set, edit, and remove a password', async ( {
		page,
		admin,
		editor,
	} ) => {
		await admin.createNewPost();
		await editor.canvas
			.locator( 'role=textbox[name="Add title"i]' )
			.type( 'Password Protected Post' );

		await editor.openDocumentSettingsSidebar();

		const changeStatusButton = page.getByRole( 'button', {
			name: /^Change status:/,
		} );
		await changeStatusButton.click();

		await page.getByRole( 'button', { name: 'Set password' } ).click();

		const modal = page.getByRole( 'dialog', { name: 'Set password' } );
		await expect( modal ).toBeVisible();

		await modal
			.getByRole( 'textbox', { name: 'Password' } )
			.fill( 'secret123' );
		await modal.getByRole( 'button', { name: 'Save password' } ).click();

		await expect( modal ).toBeHidden();

		await changeStatusButton.click();
		await expect(
			page.getByRole( 'button', { name: 'Edit password' } )
		).toBeVisible();
		await page.keyboard.press( 'Escape' );

		await editor.saveDraft();
		await page.reload();
		await editor.openDocumentSettingsSidebar();

		await changeStatusButton.click();
		await expect(
			page.getByRole( 'button', { name: 'Edit password' } )
		).toBeVisible();

		await page.getByRole( 'button', { name: 'Edit password' } ).click();
		const editModal = page.getByRole( 'dialog', { name: 'Edit password' } );
		await expect( editModal ).toBeVisible();
		await expect(
			editModal.getByRole( 'textbox', { name: 'Password' } )
		).toHaveValue( 'secret123' );

		await editModal
			.getByRole( 'button', { name: 'Remove password' } )
			.click();
		await expect( editModal ).toBeHidden();

		await changeStatusButton.click();
		await expect(
			page.getByRole( 'button', { name: 'Set password' } )
		).toBeVisible();
	} );

	test( 'validates password length and restores focus on cancel and esc', async ( {
		page,
		admin,
		editor,
	} ) => {
		await admin.createNewPost();
		await editor.openDocumentSettingsSidebar();

		const changeStatusButton = page.getByRole( 'button', {
			name: /^Change status:/,
		} );
		await changeStatusButton.click();

		await page.getByRole( 'button', { name: 'Set password' } ).click();
		const modal = page.getByRole( 'dialog', { name: 'Set password' } );
		await expect( modal ).toBeVisible();

		// Test Cancel focus restoration
		await modal.getByRole( 'button', { name: 'Cancel' } ).click();
		await expect( modal ).toBeHidden();
		await expect( changeStatusButton ).toBeFocused();

		// Open again and test Esc focus restoration
		await changeStatusButton.click();
		await page.getByRole( 'button', { name: 'Set password' } ).click();
		await expect( modal ).toBeVisible();
		await page.keyboard.press( 'Escape' );
		await expect( modal ).toBeHidden();
		await expect( changeStatusButton ).toBeFocused();

		// Open again and test 256 char validation
		await changeStatusButton.click();
		await page.getByRole( 'button', { name: 'Set password' } ).click();
		await expect( modal ).toBeVisible();

		await modal
			.getByRole( 'textbox', { name: 'Password' } )
			.fill( 'a'.repeat( 256 ) );
		await modal.getByRole( 'button', { name: 'Save password' } ).click();

		await expect(
			modal.getByText( "Password can't exceed 255 characters." )
		).toBeVisible();
		await expect( modal ).toBeVisible();

		await modal.getByRole( 'button', { name: 'Cancel' } ).click();
		await expect( modal ).toBeHidden();
		await expect( changeStatusButton ).toBeFocused();

		await changeStatusButton.click();
		await expect(
			page.getByRole( 'button', { name: 'Set password' } )
		).toBeVisible();
	} );
} );
