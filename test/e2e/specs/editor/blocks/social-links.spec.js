const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Social Icons', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/social-links',
			innerBlocks: [
				{
					name: 'core/social-link',
					attributes: {
						service: 'wordpress',
						url: 'https://wordpress.org/',
					},
				},
			],
		} );
	} );

	test( 'keeps focus in the inspector when the canvas popover closes', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.getByRole( 'button', { name: 'WordPress' } )
			.click();
		await expect(
			page.getByRole( 'combobox', { name: 'Enter social link' } )
		).toBeVisible();

		// Clicking a field in the inspector closes the popover, but keeps focus.
		const textInput = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'textbox', { name: 'Text' } );
		await textInput.click();

		await expect(
			page.getByRole( 'combobox', { name: 'Enter social link' } )
		).toBeHidden();
		await expect( textInput ).toBeFocused();
	} );

	test( 'returns focus to the icon when the canvas popover is closed with Escape', async ( {
		editor,
		page,
	} ) => {
		const icon = editor.canvas.getByRole( 'button', { name: 'WordPress' } );
		await icon.click();
		const urlInput = page.getByRole( 'combobox', {
			name: 'Enter social link',
		} );
		await expect( urlInput ).toBeFocused();

		await page.keyboard.press( 'Escape' );

		await expect( urlInput ).toBeHidden();
		await expect( icon ).toBeFocused();
	} );
} );
