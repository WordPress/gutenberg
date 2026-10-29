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
		const linkButton = settings.getByRole( 'button', { name: /^Link/ } );
		await expect( linkButton ).toHaveText( /wordpress\.org/ );
		await expect(
			settings.getByRole( 'link', { name: 'View' } )
		).toHaveAttribute( 'href', 'https://wordpress.org/' );

		// The link is typed, not searched for.
		await linkButton.click();
		const urlInput = page.getByRole( 'combobox', {
			name: 'Paste or type URL',
		} );
		await expect( urlInput ).toBeFocused();
		await page.keyboard.type( 'wordpress.org/news' );
		await expect(
			page.getByRole( 'listbox', { name: 'Search results' } )
		).toBeHidden();
		await page.keyboard.press( 'Enter' );

		await expect( linkButton ).toHaveText( /wordpress\.org\/news/ );
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
							url: 'https://wordpress.org/news',
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
				name: 'Link, reset to default',
			} )
			.click();

		await expect(
			settings.getByRole( 'link', { name: 'View' } )
		).toBeHidden();
		const [ socialLink ] = ( await editor.getBlocks() )[ 0 ].innerBlocks;
		expect( socialLink.attributes.url ).toBeUndefined();
		expect( await editor.getEditedPostContent() ).not.toContain( '"url"' );
	} );
} );
