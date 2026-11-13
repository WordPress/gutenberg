const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Social Icons', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'keeps an unlinked icon fully opaque while it has keyboard focus', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/social-links',
			innerBlocks: [
				{
					name: 'core/social-link',
					attributes: {
						service: 'github',
						url: 'https://github.com/',
					},
				},
				{
					name: 'core/social-link',
					attributes: { service: 'instagram' },
				},
			],
		} );
		const linkedIcon = editor.canvas.locator( '.wp-social-link-github' );
		const unlinkedIcon = editor.canvas.locator(
			'.wp-social-link-instagram'
		);
		const linkedButton = linkedIcon.getByRole( 'button' );
		const unlinkedButton = unlinkedIcon.getByRole( 'button' );

		await linkedButton.focus();
		await expect( unlinkedIcon ).toHaveCSS( 'opacity', '0.5' );
		await page.keyboard.press( 'ArrowRight' );
		await expect( unlinkedButton ).toBeFocused();
		await expect( unlinkedIcon ).toHaveCSS( 'opacity', '1' );

		await page.keyboard.press( 'ArrowLeft' );
		await expect( linkedButton ).toBeFocused();
		await expect( linkedIcon ).toHaveCSS( 'opacity', '1' );
		await expect( unlinkedIcon ).toHaveCSS( 'opacity', '0.5' );
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

		// An email address that already has `mailto:` opens as typed.
		await urlInput.fill( 'mailto:me@example.com' );
		await page.keyboard.press( 'Tab' );
		await expect(
			settings.getByRole( 'link', { name: 'View' } )
		).toHaveAttribute( 'href', 'mailto:me@example.com' );

		// A host and port isn't a protocol, so it opens over HTTPS, as on the
		// front end.
		await urlInput.fill( 'localhost:8080/news' );
		await page.keyboard.press( 'Tab' );
		await expect(
			settings.getByRole( 'link', { name: 'View' } )
		).toHaveAttribute( 'href', 'https://localhost:8080/news' );

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
