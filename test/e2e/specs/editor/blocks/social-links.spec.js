const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Social Icons', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'edits a Social Icon link and text from the inspector', async ( {
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
		await editor.canvas.locator( '[data-type="core/social-link"]' ).click();
		await editor.openDocumentSettingsSidebar();

		// The link comes first, then the text, as for a navigation link.
		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await expect(
			settings.getByRole( 'heading', { name: 'Settings' } )
		).toBeVisible();
		const linkInput = settings.getByRole( 'textbox', { name: 'Link' } );
		await expect( linkInput ).toHaveValue( 'https://wordpress.org/' );
		await expect(
			settings.getByRole( 'textbox' ).first()
		).toHaveAccessibleName( 'Link' );
		const textInput = settings.getByRole( 'textbox', { name: 'Text' } );
		await expect( textInput ).toHaveAttribute( 'placeholder', 'WordPress' );
		await expect(
			settings.getByRole( 'link', { name: 'View' } )
		).toHaveAttribute( 'href', 'https://wordpress.org/' );

		// Clicking the icon on the canvas opened its link popover; clicking a
		// field closes it the way a person would.
		await linkInput.click();
		await linkInput.fill( 'https://wordpress.org/news/' );
		await textInput.click();
		await textInput.fill( 'WP' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/social-links',
				innerBlocks: [
					{
						name: 'core/social-link',
						attributes: {
							service: 'wordpress',
							url: 'https://wordpress.org/news/',
							label: 'WP',
						},
					},
				],
			},
		] );
	} );
} );
