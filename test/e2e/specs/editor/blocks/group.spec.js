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
		await page.type( 'role=searchbox[name="Search for blocks and patterns"i]', 'Group' );

		await page.click( 'role=listbox[name="Blocks"i] >> role=option[name="Group"i]' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can be created using the slash inserter', async ( {
		editor,
		page,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '/group' );
		await expect( page.locator( 'role=option[name="Group"i][selected]' ) ).toBeVisible();
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
