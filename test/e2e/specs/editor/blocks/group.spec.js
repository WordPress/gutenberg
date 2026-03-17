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
			'role=button[name="Block Inserter"i]'
		);

		await inserterButton.click();

		await page.type( 'role=searchbox[name="Search"i]', 'Group' );

		await page.click(
			'role=listbox[name="Blocks"i] >> role=option[name="Group"i]'
		);

		// Select the default, selected Group layout from the variation picker.
		await editor.canvas
			.locator(
				'role=button[name="Group: Gather blocks in a container."i]'
			)
			.click();

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can be created using the slash inserter', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/group' );
		await expect(
			page.locator( 'role=option[name="Group"i][selected]' )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );

		// Select the default, selected Group layout from the variation picker.
		await editor.canvas
			.locator(
				'role=button[name="Group: Gather blocks in a container."i]'
			)
			.click();

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can have other blocks appended to it using the button appender', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/group' } );
		await editor.canvas
			.locator(
				'button[aria-label="Group: Gather blocks in a container."]'
			)
			.click();
		await editor.canvas.locator( 'role=button[name="Add block"i]' ).click();
		await page.click(
			'role=listbox[name="Blocks"i] >> role=option[name="Paragraph"i]'
		);
		await page.keyboard.type( 'Group Block with a Paragraph' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can merge into group with Backspace', async ( { editor, page } ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await editor.transformBlockTo( 'core/group' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		// Confirm last paragraph is outside of group.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		// Merge the last paragraph into the group.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
