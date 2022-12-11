/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Buttons', () => {
	const COLOR_INPUT_FIELD_SELECTOR =
		'.components-color-picker .components-input-control__input';

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'has focus on button content', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/buttons' } );
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
		await page.click( 'role=button[name="Add default block"i]' );
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
		await pageUtils.pressKeyWithModifier( 'primary', 'k' );
		await expect(
			page.locator( 'role=combobox[name="URL"i]' )
		).toBeFocused();
		await page.keyboard.press( 'Escape' );
		await expect(
			page.locator( 'role=textbox[name="Button text"i]' )
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
		await pageUtils.pressKeyWithModifier( 'primary', 'k' );
		await expect(
			page.locator( 'role=combobox[name="URL"i]' )
		).toBeFocused();
		await page.keyboard.type( 'https://example.com' );
		await page.keyboard.press( 'Enter' );
		await expect(
			page.locator( 'role=link[name=/^example\\.com/]' )
		).toBeFocused();
		await page.keyboard.press( 'Escape' );

		// Focus should move from the link control to the button block's text.
		await expect(
			page.locator( 'role=textbox[name="Button text"i]' )
		).toBeFocused();

		// The link control should still be visible when a URL is set.
		await expect(
			page.locator( 'role=link[name=/^example\\.com/]' )
		).toBeVisible();
	} );

	test( 'can jump to the link editor using the keyboard shortcut', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/buttons' } );
		await page.keyboard.type( 'WordPress' );
		await pageUtils.pressKeyWithModifier( 'primary', 'k' );
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

		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Text"i]'
		);
		await page.click( 'role=button[name="Color: White"i]' );
		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Background"i]'
		);
		await page.click( 'role=button[name="Color: Vivid red"i]' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:buttons -->
<div class=\"wp-block-buttons\"><!-- wp:button {\"backgroundColor\":\"vivid-red\",\"textColor\":\"base\"} -->
<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-base-color has-vivid-red-background-color has-text-color has-background wp-element-button\">Content</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		);
	} );

	test( 'can apply custom colors', async ( { editor, page, pageUtils } ) => {
		await editor.insertBlock( { name: 'core/buttons' } );
		await page.keyboard.type( 'Content' );
		await editor.openDocumentSettingsSidebar();

		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Text"i]'
		);
		await page.click( 'role=button[name="Custom color picker."i]' );
		await page.waitForSelector( COLOR_INPUT_FIELD_SELECTOR );
		await page.click( COLOR_INPUT_FIELD_SELECTOR );
		await pageUtils.pressKeyWithModifier( 'primary', 'a' );
		await page.keyboard.type( 'ff0000' );

		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Background"i]'
		);
		await page.click( 'role=button[name="Custom color picker."i]' );
		await page.waitForSelector( COLOR_INPUT_FIELD_SELECTOR );
		await page.click( COLOR_INPUT_FIELD_SELECTOR );
		await pageUtils.pressKeyWithModifier( 'primary', 'a' );
		await page.keyboard.type( '00ff00' );

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

		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Background"i]'
		);
		await page.click( 'role=tab[name="Gradient"i]' );
		await page.click(
			'role=button[name="Gradient: Vivid cyan blue to vivid purple"i]'
		);

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:buttons -->
<div class=\"wp-block-buttons\"><!-- wp:button {\"gradient\":\"vivid-cyan-blue-to-vivid-purple\"} -->
<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-vivid-cyan-blue-to-vivid-purple-gradient-background has-background wp-element-button\">Content</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		);
	} );

	test( 'can apply custom gradient background color', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/buttons' } );
		await page.keyboard.type( 'Content' );
		await editor.openDocumentSettingsSidebar();

		await page.click(
			'role=region[name="Editor settings"i] >> role=button[name="Background"i]'
		);
		await page.click( 'role=tab[name="Gradient"i]' );
		await page.click(
			'role=button[name=/^Gradient control point at position 0% with color code/]'
		);
		await page.waitForSelector( COLOR_INPUT_FIELD_SELECTOR );
		await page.click( COLOR_INPUT_FIELD_SELECTOR );
		await pageUtils.pressKeyWithModifier( 'primary', 'a' );
		await page.keyboard.type( 'ff0000' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:buttons -->
<div class=\"wp-block-buttons\"><!-- wp:button {\"style\":{\"color\":{\"gradient\":\"linear-gradient(135deg,rgb(255,0,0) 0%,rgb(155,81,224) 100%)\"}}} -->
<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-background wp-element-button\" style=\"background:linear-gradient(135deg,rgb(255,0,0) 0%,rgb(155,81,224) 100%)\">Content</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`
		);
	} );
} );
