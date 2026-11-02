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
				{
					name: 'core/social-link',
					attributes: {
						service: 'github',
						url: 'https://github.com/',
					},
				},
			],
		} );
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'tab', { name: 'List View' } ).click();

		// Selecting an icon from its parent's List View opens its Content tab.
		await page
			.getByRole( 'tabpanel', { name: 'List View' } )
			.getByRole( 'treegrid', { name: 'Block navigation structure' } )
			.getByRole( 'link', { name: 'WordPress' } )
			.click();

		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await expect(
			settings.getByRole( 'tab', { name: 'Content' } )
		).toHaveAttribute( 'aria-selected', 'true' );
		const textInput = settings.getByRole( 'textbox', { name: 'Text' } );
		await expect( textInput ).toHaveAttribute( 'placeholder', 'WordPress' );
		const urlInput = settings.getByRole( 'combobox', { name: 'Link to' } );
		await expect( urlInput ).toHaveValue( 'https://wordpress.org/' );
		await expect(
			settings.getByRole( 'link', { name: 'View' } )
		).toHaveAttribute( 'href', 'https://wordpress.org/' );

		// An invalid link shows an error once the field is left, but is kept.
		await urlInput.fill( 'df' );
		await page.keyboard.press( 'Tab' );
		await expect(
			settings.getByText( 'Please enter a valid URL.' )
		).toBeVisible();
		await expect(
			settings.getByRole( 'link', { name: 'View' } )
		).toBeHidden();
		await expect
			.poll(
				async () =>
					( await editor.getBlocks() )[ 0 ].innerBlocks[ 0 ]
						.attributes.url
			)
			.toBe( 'df' );

		// An email address is valid, and View opens it as the front end does.
		await urlInput.fill( 'me@example.com' );
		await page.keyboard.press( 'Tab' );
		await expect(
			settings.getByText( 'Please enter a valid URL.' )
		).toBeHidden();
		await expect(
			settings.getByRole( 'link', { name: 'View' } )
		).toHaveAttribute( 'href', 'mailto:me@example.com' );

		// A link without a protocol opens over HTTPS, as on the front end.
		await urlInput.fill( 'wordpress.org/news' );
		await page.keyboard.press( 'Tab' );
		await expect(
			settings.getByText( 'Please enter a valid URL.' )
		).toBeHidden();
		await expect(
			settings.getByRole( 'link', { name: 'View' } )
		).toHaveAttribute( 'href', 'https://wordpress.org/news' );

		await textInput.fill( 'WP' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/social-links',
				innerBlocks: [
					{
						name: 'core/social-link',
						attributes: {
							service: 'wordpress',
							url: 'wordpress.org/news',
							label: 'WP',
						},
					},
					{
						name: 'core/social-link',
						attributes: {
							service: 'github',
							url: 'https://github.com/',
						},
					},
				],
			},
		] );
	} );

	test( 'leaves a Social Icon without a link when the link is reset', async ( {
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
		await page.getByRole( 'tab', { name: 'List View' } ).click();
		await page
			.getByRole( 'tabpanel', { name: 'List View' } )
			.getByRole( 'treegrid', { name: 'Block navigation structure' } )
			.getByRole( 'link', { name: 'WordPress' } )
			.click();

		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settings
			.getByRole( 'button', { name: 'Settings options' } )
			.click();
		await page
			.getByRole( 'menuitem', {
				name: 'Link to, reset to default',
			} )
			.click();

		await expect(
			settings.getByRole( 'link', { name: 'View' } )
		).toBeHidden();
		const [ socialLink ] = ( await editor.getBlocks() )[ 0 ].innerBlocks;
		expect( socialLink.attributes.url ).toBeUndefined();
		expect( await editor.getEditedPostContent() ).not.toContain( '"url"' );
	} );

	test( 'shows an error for an invalid link in the canvas popover', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/social-links',
			innerBlocks: [
				{
					name: 'core/social-link',
					attributes: { service: 'wordpress' },
				},
			],
		} );
		await editor.canvas
			.getByRole( 'button', { name: 'WordPress' } )
			.click();

		const urlInput = page.getByRole( 'combobox', {
			name: 'Enter social link',
		} );
		await expect( urlInput ).toBeFocused();

		// An invalid link keeps the popover open with an error, but is kept.
		await page.keyboard.type( 'df' );
		await page.keyboard.press( 'Enter' );
		await expect(
			page.getByText( 'Please enter a valid URL.' )
		).toBeVisible();
		await expect( urlInput ).toBeVisible();
		await expect
			.poll(
				async () =>
					( await editor.getBlocks() )[ 0 ].innerBlocks[ 0 ]
						.attributes.url
			)
			.toBe( 'df' );

		// A valid link closes it.
		await urlInput.fill( 'wordpress.org' );
		await page.keyboard.press( 'Enter' );
		await expect( urlInput ).toBeHidden();
		await expect
			.poll(
				async () =>
					( await editor.getBlocks() )[ 0 ].innerBlocks[ 0 ]
						.attributes.url
			)
			.toBe( 'wordpress.org' );
	} );
} );
