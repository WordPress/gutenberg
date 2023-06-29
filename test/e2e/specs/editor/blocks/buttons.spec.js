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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
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
			page.locator( 'role=combobox[name="Link"i]' )
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
			page.locator( 'role=combobox[name="Link"i]' )
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

		const urlInput = page.locator( 'role=combobox[name="Link"i]' );

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
			'role=region[name="Editor settings"i] >> role=button[name="Color Text styles"i]'
		);
		await page.click( 'role=button[name="Color: Cyan bluish gray"i]' );
		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Color Background styles"i]'
		);
		await page.click( 'role=button[name="Color: Vivid red"i]' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:buttons -->
<div class=\"wp-block-buttons\"><!-- wp:button {\"backgroundColor\":\"vivid-red\",\"textColor\":\"cyan-bluish-gray\"} -->
<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-cyan-bluish-gray-color has-vivid-red-background-color has-text-color has-background wp-element-button\">Content</a></div>
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
			'role=region[name="Editor settings"i] >> role=button[name="Color Text styles"i]'
		);
		await page.click( 'role=button[name="Custom color picker."i]' );
		await page.fill( 'role=textbox[name="Hex color"i]', 'ff0000' );

		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Color Background styles"i]'
		);
		await page.click( 'role=button[name="Custom color picker."i]' );
		await page.fill( 'role=textbox[name="Hex color"i]', '00ff00' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:buttons -->
<div class=\"wp-block-buttons\"><!-- wp:button {\"style\":{\"color\":{\"text\":\"#ff0000\",\"background\":\"#00ff00\"}}} -->
<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-text-color has-background wp-element-button\" style=\"color:#ff0000;background-color:#00ff00\">Content</a></div>
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
			'role=region[name="Editor settings"i] >> role=button[name="Color Background styles"i]'
		);
		await page.click( 'role=tab[name="Gradient"i]' );
		await page.click( 'role=button[name="Gradient: Purple to yellow"i]' );

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
			'role=region[name="Editor settings"i] >> role=button[name="Color Background styles"i]'
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
} );
