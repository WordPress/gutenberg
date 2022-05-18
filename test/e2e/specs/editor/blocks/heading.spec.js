/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Heading', () => {
	const COLOR_ITEM_SELECTOR =
		'.block-editor-panel-color-gradient-settings__dropdown';
	const CUSTOM_COLOR_BUTTON_X_SELECTOR = `.components-color-palette__custom-color`;
	const CUSTOM_COLOR_DETAILS_BUTTON_SELECTOR =
		'.components-color-picker button[aria-label="Show detailed inputs"]';
	const COLOR_INPUT_FIELD_SELECTOR =
		'.components-color-picker .components-input-control__input';

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by prefixing number sign and a space', async ( {
		page,
		editor,
	} ) => {
		await editor.clickBlockAppender();
		await page.keyboard.type( '### 3' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can be created by prefixing existing content with number signs and a space', async ( {
		page,
		editor,
	} ) => {
		await editor.clickBlockAppender();
		await page.keyboard.type( '4' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( '#### ' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should not work with the list input rule', async ( {
		page,
		editor,
	} ) => {
		await editor.clickBlockAppender();
		await page.keyboard.type( '## 1. H' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should work with the format input rules', async ( {
		page,
		editor,
	} ) => {
		await editor.clickBlockAppender();
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
		await editor.clickBlockAppender();
		await page.keyboard.type( '### Heading' );

		await editor.openDocumentSettingsSidebar();

		// Click the text color picker.
		await page.locator( COLOR_ITEM_SELECTOR ).first().click();

		const customTextColorButton = await page.locator(
			CUSTOM_COLOR_BUTTON_X_SELECTOR
		);

		// Set the new text color.
		await customTextColorButton.click();
		await page.click( CUSTOM_COLOR_DETAILS_BUTTON_SELECTOR );
		await page.locator( COLOR_INPUT_FIELD_SELECTOR );
		await page.click( COLOR_INPUT_FIELD_SELECTOR );

		await pageUtils.pressKeyWithModifier( 'primary', 'A' );
		await page.keyboard.type( '0782f6' );

		// Click back on the color picker.
		await page.locator( COLOR_ITEM_SELECTOR ).first().click();

		await page.click( 'h3[data-type="core/heading"]' );
		await page.waitForXPath( '//button//span[contains(text(), "0782f6")]' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should correctly apply named colors', async ( { page, editor } ) => {
		await editor.clickBlockAppender();
		await page.keyboard.type( '## Heading' );

		// Click the text color picker.
		await page.locator( COLOR_ITEM_SELECTOR ).first().click();

		await page
			.locator( '[aria-label="Color\\: Luminous vivid orange"]' )
			.click();
		await page.click( 'h2[data-type="core/heading"]' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
