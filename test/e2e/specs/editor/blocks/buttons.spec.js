/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Buttons', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'has focus on button content', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/buttons' } );
		await expect(
			editor.canvas.locator( 'role=textbox[name="Button text"i]' )
		).toBeFocused();
		await page.keyboard.type( 'Content' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Content</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		);
	} );

	test( 'has focus on button content (slash inserter)', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/buttons' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Content' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Content</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		);
	} );

	test( 'dismisses link editor when escape is pressed', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Regression: https://github.com/WordPress/gutenberg/pull/19885
		await editor.insertBlock( { name: 'core/buttons' } );
		await expect(
			editor.canvas.locator( 'role=textbox[name="Button text"i]' )
		).toBeFocused();
		await pageUtils.pressKeys( 'primary+k' );
		await expect(
			page.locator( 'role=combobox[name="Search or type URL"i]' )
		).toBeFocused();
		await page.keyboard.press( 'Escape' );
		await expect(
			editor.canvas.locator( 'role=textbox[name="Button text"i]' )
		).toBeFocused();
		await page.keyboard.type( 'WordPress' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">WordPress</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		);
	} );

	test( 'moves focus from the link editor back to the button when escape is pressed after the URL has been submitted', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Regression: https://github.com/WordPress/gutenberg/issues/34307
		await editor.insertBlock( { name: 'core/buttons' } );
		await expect(
			editor.canvas.locator( 'role=textbox[name="Button text"i]' )
		).toBeFocused();
		await pageUtils.pressKeys( 'primary+k' );
		await expect(
			page.locator( 'role=combobox[name="Search or type URL"i]' )
		).toBeFocused();
		await page.keyboard.type( 'https://example.com' );
		await page.keyboard.press( 'Enter' );
		await expect(
			page.locator( 'role=link[name=/^example\\.com/]' )
		).toBeFocused();
		await page.keyboard.press( 'Escape' );

		// Focus should move from the link control to the button block's text.
		await expect(
			editor.canvas.locator( 'role=textbox[name="Button text"i]' )
		).toBeFocused();

		// The link control should still be visible when a URL is set.
		await expect(
			page.locator( 'role=link[name=/^example\\.com/]' )
		).toBeVisible();
	} );

	test( 'appends http protocol to links added which are missing a protocol', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Regression: https://github.com/WordPress/gutenberg/issues/34307
		await editor.insertBlock( { name: 'core/buttons' } );
		await expect(
			editor.canvas.locator( 'role=textbox[name="Button text"i]' )
		).toBeFocused();
		await pageUtils.pressKeys( 'primary+k' );

		const urlInput = page.locator(
			'role=combobox[name="Search or type URL"i]'
		);

		await expect( urlInput ).toBeFocused();
		await page.keyboard.type( 'example.com' );
		await page.keyboard.press( 'Enter' );

		// Move to "Edit" and switch UI back to edit mode
		await pageUtils.pressKeys( 'Tab' );
		await page.keyboard.press( 'Enter' );

		// Check the value of the URL input has had http:// prepended.
		await expect( urlInput ).toHaveValue( 'http://example.com' );
	} );

	test( 'can jump to the link editor using the keyboard shortcut', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/buttons' } );
		await page.keyboard.type( 'WordPress' );
		await pageUtils.pressKeys( 'primary+k' );
		await page.keyboard.type( 'https://www.wordpress.org/' );
		await page.keyboard.press( 'Enter' );
		// Make sure that the dialog is still opened, and that focus is retained
		// within (focusing on the link preview).
		await expect(
			page.locator( 'role=link[name=/^wordpress\\.org/]' )
		).toBeFocused();

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://www.wordpress.org/">WordPress</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		);
	} );

	test( 'can toggle button link settings', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/buttons' } );
		await page.keyboard.type( 'WordPress' );
		await pageUtils.pressKeys( 'primary+k' );
		await page.keyboard.type( 'https://www.wordpress.org/' );
		await page.keyboard.press( 'Enter' );

		// Edit link.
		await page.getByRole( 'button', { name: 'Edit' } ).click();

		// Open Advanced settings panel.
		await page
			.getByRole( 'region', {
				name: 'Editor content',
			} )
			.getByRole( 'button', {
				name: 'Advanced',
			} )
			.click();

		const newTabCheckbox = page.getByLabel( 'Open in new tab' );
		const noFollowCheckbox = page.getByLabel( 'nofollow' );

		// Navigate to and toggle the "Open in new tab" checkbox.
		await newTabCheckbox.click();

		// Toggle should still have focus and be checked.
		await expect( newTabCheckbox ).toBeChecked();
		await expect( newTabCheckbox ).toBeFocused();

		await page
			//TODO: change to a better selector when https://github.com/WordPress/gutenberg/issues/51060 is resolved.
			.locator( '.block-editor-link-control' )
			.getByRole( 'button', { name: 'Save' } )
			.click();

		// The link should have been inserted.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/buttons',
				innerBlocks: [
					{
						name: 'core/button',
						attributes: {
							text: 'WordPress',
							url: 'https://www.wordpress.org/',
							rel: 'noreferrer noopener',
							linkTarget: '_blank',
						},
					},
				],
			},
		] );

		// Edit link again.
		await page.getByRole( 'button', { name: 'Edit' } ).click();

		// Navigate to and toggle the "nofollow" checkbox.
		await noFollowCheckbox.click();

		// expect settings for `Open in new tab` and `No follow`
		await expect( newTabCheckbox ).toBeChecked();
		await expect( noFollowCheckbox ).toBeChecked();

		await page
			//TODO: change to a better selector when https://github.com/WordPress/gutenberg/issues/51060 is resolved.
			.locator( '.block-editor-link-control' )
			.getByRole( 'button', { name: 'Save' } )
			.click();

		// Check the content again.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/buttons',
				innerBlocks: [
					{
						name: 'core/button',
						attributes: {
							text: 'WordPress',
							url: 'https://www.wordpress.org/',
							rel: 'noreferrer noopener nofollow',
							linkTarget: '_blank',
						},
					},
				],
			},
		] );
	} );

	test( 'can resize width', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/buttons' } );
		await page.keyboard.type( 'Content' );
		await editor.openDocumentSettingsSidebar();
		await page.click(
			`role=region[name="Editor settings"i] >> role=tab[name="Settings"i]`
		);
		await page.click(
			'role=group[name="Button width"i] >> role=button[name="25%"i]'
		);

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"width":25} -->
<div class="wp-block-button has-custom-width wp-block-button__width-25"><a class="wp-block-button__link wp-element-button">Content</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		);
	} );

	test( 'can apply named colors', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/buttons' } );
		await page.keyboard.type( 'Content' );
		await editor.openDocumentSettingsSidebar();

		// Switch to the Styles tab.
		await page.click(
			`role=region[name="Editor settings"i] >> role=tab[name="Styles"i]`
		);
		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Text"i]'
		);
		await page.click( 'role=option[name="Color: Cyan bluish gray"i]' );
		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Background"i]'
		);
		await page.click( 'role=option[name="Color: Vivid red"i]' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:buttons -->
<div class=\"wp-block-buttons\"><!-- wp:button {\"backgroundColor\":\"vivid-red\",\"textColor\":\"cyan-bluish-gray\",\"style\":{\"elements\":{\"link\":{\"color\":{\"text\":\"var:preset|color|cyan-bluish-gray\"}}}}} -->
<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-cyan-bluish-gray-color has-vivid-red-background-color has-text-color has-background has-link-color wp-element-button\">Content</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		);
	} );

	test( 'can apply custom colors', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/buttons' } );
		await page.keyboard.type( 'Content' );
		await editor.openDocumentSettingsSidebar();

		// Switch to the Styles tab.
		await page.click(
			`role=region[name="Editor settings"i] >> role=tab[name="Styles"i]`
		);
		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Text"i]'
		);
		await page.click( 'role=button[name="Custom color picker."i]' );
		await page.fill( 'role=textbox[name="Hex color"i]', 'ff0000' );

		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Background"i]'
		);
		await page.click( 'role=button[name="Custom color picker."i]' );
		await page.fill( 'role=textbox[name="Hex color"i]', '00ff00' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:buttons -->
<div class=\"wp-block-buttons\"><!-- wp:button {\"style\":{\"color\":{\"text\":\"#ff0000\",\"background\":\"#00ff00\"},\"elements\":{\"link\":{\"color\":{\"text\":\"#ff0000\"}}}}} -->
<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-text-color has-background has-link-color wp-element-button\" style=\"color:#ff0000;background-color:#00ff00\">Content</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		);
	} );

	test( 'can apply named gradient background color', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/buttons' } );
		await page.keyboard.type( 'Content' );
		await editor.openDocumentSettingsSidebar();

		// Switch to the Styles tab.
		await page.click(
			`role=region[name="Editor settings"i] >> role=tab[name="Styles"i]`
		);
		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Background"i]'
		);
		await page.click( 'role=tab[name="Gradient"i]' );
		await page.click( 'role=option[name="Gradient: Purple to yellow"i]' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:buttons -->
<div class=\"wp-block-buttons\"><!-- wp:button {\"gradient\":\"purple-to-yellow\"} -->
<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-purple-to-yellow-gradient-background has-background wp-element-button\">Content</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		);
	} );

	test( 'can apply custom gradient background color', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/buttons' } );
		await page.keyboard.type( 'Content' );
		await editor.openDocumentSettingsSidebar();

		// Switch to the Styles tab.
		await page.click(
			`role=region[name="Editor settings"i] >> role=tab[name="Styles"i]`
		);
		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Background"i]'
		);
		await page.click( 'role=tab[name="Gradient"i]' );
		await page.click(
			'role=button[name=/^Gradient control point at position 0% with color code/]'
		);
		await page.fill( 'role=textbox[name="Hex color"i]', 'ff0000' );
		await page.keyboard.press( 'Escape' );
		await page.click(
			'role=button[name=/^Gradient control point at position 100% with color code/]'
		);
		await page.fill( 'role=textbox[name="Hex color"i]', '00ff00' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:buttons -->
<div class=\"wp-block-buttons\"><!-- wp:button {\"style\":{\"color\":{\"gradient\":\"linear-gradient(135deg,rgb(255,0,0) 0%,rgb(0,255,0) 100%)\"}}} -->
<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-background wp-element-button\" style=\"background:linear-gradient(135deg,rgb(255,0,0) 0%,rgb(0,255,0) 100%)\">Content</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		);
	} );

	test.describe( 'Block transforms', () => {
		test.describe( 'FROM paragraph', () => {
			test( 'should preserve the content', async ( { editor } ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'initial content',
					},
				} );
				await editor.transformBlockTo( 'core/buttons' );
				const buttonBlock = ( await editor.getBlocks() )[ 0 ]
					.innerBlocks[ 0 ];
				expect( buttonBlock.name ).toBe( 'core/button' );
				expect( buttonBlock.attributes.text ).toBe( 'initial content' );
			} );

			test( 'should preserve the metadata attribute', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'initial content',
						metadata: {
							name: 'Custom name',
						},
					},
				} );

				await editor.transformBlockTo( 'core/buttons' );
				const buttonBlock = ( await editor.getBlocks() )[ 0 ]
					.innerBlocks[ 0 ];
				expect( buttonBlock.name ).toBe( 'core/button' );
				expect( buttonBlock.attributes.metadata ).toMatchObject( {
					name: 'Custom name',
				} );
			} );

			test( 'should preserve the block bindings', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'initial content',
						metadata: {
							bindings: {
								content: {
									source: 'core/post-meta',
									args: {
										key: 'custom_field',
									},
								},
							},
						},
					},
				} );

				await editor.transformBlockTo( 'core/buttons' );
				const buttonBlock = ( await editor.getBlocks() )[ 0 ]
					.innerBlocks[ 0 ];
				expect( buttonBlock.name ).toBe( 'core/button' );
				expect(
					buttonBlock.attributes.metadata.bindings
				).toMatchObject( {
					text: {
						source: 'core/post-meta',
						args: {
							key: 'custom_field',
						},
					},
				} );
			} );
		} );
	} );
} );
