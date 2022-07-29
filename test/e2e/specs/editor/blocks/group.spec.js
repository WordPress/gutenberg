/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Group', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created using the block inserter', async ( {
		editor,
		page,
	} ) => {
		// Search for the group block and insert it.
		const inserterButton = page.locator(
			'role=button[name="Toggle block inserter"i]'
		);

		await inserterButton.click();

		const searchField = page.locator( '.components-search-control__input' );
		await searchField.type( 'Group' );

		await page.locator( '.editor-block-list-item-group' ).click();

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can be created using the slash inserter', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '/group' );
		await page.waitForSelector(
			`//*[contains(@class, "components-autocomplete__result") and contains(@class, "is-selected") and contains(text(), 'Group')]`
		);
		await page.keyboard.press( 'Enter' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can have other blocks appended to it using the button appender', async ( {
		editor,
		page,
	} ) => {
		// Search for the group block and insert it.
		const inserterButton = page.locator(
			'role=button[name="Toggle block inserter"i]'
		);

		await inserterButton.click();

		const searchField = page.locator( '.components-search-control__input' );
		await searchField.type( 'Group' );

		await page.locator( '.editor-block-list-item-group' ).click();
		await page.locator( '.block-editor-button-block-appender' ).click();
		await page.locator( '.editor-block-list-item-paragraph' ).click();
		await page.keyboard.type( 'Group Block with a Paragraph' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
