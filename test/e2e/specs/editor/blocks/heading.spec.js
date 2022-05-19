/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Heading', () => {
	const COLOR_ITEM_SELECTOR =
		'.block-editor-panel-color-gradient-settings__dropdown';
	const CUSTOM_COLOR_BUTTON_X_SELECTOR =
		'role=combobox[name=Custom color picker.]';
	const CUSTOM_COLOR_DETAILS_BUTTON_SELECTOR =
		'role=button[name=Show detailed inputs]';
	const COLOR_INPUT_FIELD_SELECTOR =
		'.components-color-picker .components-input-control__input';

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by prefixing number sign and a space', async ( {
		page,
		editor,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '### 3' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can be created by prefixing existing content with number signs and a space', async ( {
		page,
		editor,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '4' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( '#### ' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should not work with the list input rule', async ( {
		page,
		editor,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '## 1. H' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should work with the format input rules', async ( {
		page,
		editor,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '## `code`' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should create a paragraph block above when pressing enter at the start', async ( {
		page,
		editor,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '## a' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Enter' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should create a paragraph block below when pressing enter at the end', async ( {
		page,
		editor,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '## a' );
		await page.keyboard.press( 'Enter' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	// This text is skipped because the color picker output a RGB color code
	// in the heading markup instead of a HEX color code.
	test.skip( 'should correctly apply custom colors', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '### Heading' );

		await editor.openDocumentSettingsSidebar();

		// Click the text color picker.
		await page.locator( COLOR_ITEM_SELECTOR ).first().click();

		const customTextColorButton = await page.locator(
			CUSTOM_COLOR_BUTTON_X_SELECTOR
		);

		// Set the new text color.
		await customTextColorButton.click();
		await page.locator( CUSTOM_COLOR_DETAILS_BUTTON_SELECTOR ).click();
		await page.locator( COLOR_INPUT_FIELD_SELECTOR ).click();

		await pageUtils.pressKeyWithModifier( 'primary', 'A' );
		await page.keyboard.type( '0782f6' );

		// Click back on the color picker.
		await page.locator( COLOR_ITEM_SELECTOR ).first().click();

		await page.locator( 'h3[data-type="core/heading"]' ).click();
		await page.waitForXPath( '//button//span[contains(text(), "0782f6")]' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should correctly apply named colors', async ( { page, editor } ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '## Heading' );

		// Click the text color picker.
		await page.locator( COLOR_ITEM_SELECTOR ).first().click();

		await page
			.locator( '[aria-label="Color\\: Luminous vivid orange"]' )
			.click();
		await page.locator( 'h2[data-type="core/heading"]' ).click();
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
