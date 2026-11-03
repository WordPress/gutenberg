const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Social Icons', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'manages focus when the canvas popover closes', async ( {
		editor,
		page,
	} ) => {
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
		await editor.openDocumentSettingsSidebar();
		const icon = editor.canvas.getByRole( 'button', { name: 'WordPress' } );
		const urlInput = page.getByRole( 'combobox', {
			name: 'Enter social link',
		} );

		await test.step( 'returns focus to the icon when closed with Escape', async () => {
			await icon.click();
			await expect( urlInput ).toBeFocused();

			await page.keyboard.press( 'Escape' );

			await expect( urlInput ).toBeHidden();
			await expect( icon ).toBeFocused();
		} );

		await test.step( 'keeps focus in the inspector when closed by clicking a field there', async () => {
			await icon.click();
			await expect( urlInput ).toBeFocused();

			const textInput = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'textbox', { name: 'Text' } );
			await textInput.click();

			await expect( urlInput ).toBeHidden();
			await expect( textInput ).toBeFocused();
		} );
	} );
} );
