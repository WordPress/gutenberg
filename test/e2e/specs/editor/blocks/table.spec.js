/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Table', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'displays a form for choosing the row and column count of the table', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/table' } );

		// Check for existence of the column count field.
		const columnCountInput = page.locator(
			'role=spinbutton[name="Column count"i]'
		);
		await expect( columnCountInput ).toBeVisible();

		// Modify the column count.
		await columnCountInput.click();
		await expect( columnCountInput ).toHaveValue( '2' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '5' );

		// Check for existence of the row count field.
		const rowCountInput = page.locator(
			'role=spinbutton[name="Row count"i]'
		);
		await expect( rowCountInput ).toBeVisible();

		// Modify the row count.
		await rowCountInput.click();
		await expect( rowCountInput ).toHaveValue( '2' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '10' );

		// Create the table.
		await page.click( 'role=button[name="Create Table"i]' );

		// Expect the post content to have a correctly sized table.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'allows text to by typed into cells', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/table' } );

		// Create the table.
		await page.click( 'role=button[name="Create Table"i]' );

		// Click the first cell and add some text.
		await page.click( 'role=textbox[name="Body cell text"i] >> nth=0' );
		await page.keyboard.type( 'This' );

		// Navigate to the next cell and add some text.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'is' );

		// Navigate to the next cell and add some text.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'table' );

		// Navigate to the next cell and add some text.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'block' );

		// Expect the post to have the correct written content inside the table.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'allows header and footer rows to be switched on and off', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/table' } );
		await editor.openDocumentSettingsSidebar();

		const headerSwitch = page.locator(
			'role=checkbox[name="Header section"i]'
		);
		const footerSwitch = page.locator(
			'role=checkbox[name="Footer section"i]'
		);

		// Expect the header and footer switches not to be present before the table has been created.
		await expect( headerSwitch ).toBeHidden();
		await expect( footerSwitch ).toBeHidden();

		// // Create the table.
		await page.click( 'role=button[name="Create Table"i]' );

		// Expect the header and footer switches to be present now that the table has been created.
		await page.click(
			`role=region[name="Editor settings"i] >> role=tab[name="Settings"i]`
		);
		await expect( headerSwitch ).toBeVisible();
		await expect( footerSwitch ).toBeVisible();

		// // Toggle on the switches and add some content.
		await headerSwitch.check();
		await footerSwitch.check();

		await page.click(
			'role=rowgroup >> nth=0 >> role=textbox[name="Header cell text"i] >> nth=0'
		);
		await page.keyboard.type( 'header' );

		await page.click(
			'role=rowgroup >> nth=1 >> role=textbox[name="Body cell text"i] >> nth=0'
		);
		await page.keyboard.type( 'body' );

		await page.click(
			'role=rowgroup >> nth=2 >> role=textbox[name="Footer cell text"i] >> nth=0'
		);
		await page.keyboard.type( 'footer' );

		// Expect the table to have a header, body and footer with written content.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		// Toggle off the switches.
		await headerSwitch.uncheck();
		await footerSwitch.uncheck();

		// Expect the table to have only a body with written content.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'allows adding and deleting columns across the table header, body and footer', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/table' } );
		await editor.openDocumentSettingsSidebar();

		// Create the table.
		await page.click( 'role=button[name="Create Table"i]' );

		// Toggle on the switches and add some content.
		await page.click(
			`role=region[name="Editor settings"i] >> role=tab[name="Settings"i]`
		);
		await page.locator( 'role=checkbox[name="Header section"i]' ).check();
		await page.locator( 'role=checkbox[name="Footer section"i]' ).check();
		await page.click( 'role=textbox[name="Body cell text"i] >> nth=0' );

		// Add a column.
		await editor.clickBlockToolbarButton( 'Edit table' );
		await page.click( 'role=menuitem[name="Insert column after"i]' );

		// Expect the table to have 3 columns across the header, body and footer.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await page.click( 'role=textbox[name="Body cell text"i] >> nth=0' );

		// Delete a column.
		await editor.clickBlockToolbarButton( 'Edit table' );
		await page.click( 'role=menuitem[name="Delete column"i]' );

		// Expect the table to have 2 columns across the header, body and footer.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'allows columns to be aligned', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/table' } );

		await page.click( 'role=spinbutton[name="Column count"i]' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '4' );

		// Create the table.
		await page.click( 'role=button[name="Create Table"i]' );

		// Click the first cell and add some text. Don't align.
		const cells = page.locator( 'role=textbox[name="Body cell text"i]' );
		await cells.nth( 0 ).click();
		await page.keyboard.type( 'None' );

		// Click to the next cell and add some text. Align left.
		await cells.nth( 1 ).click();
		await page.keyboard.type( 'To the left' );
		await editor.clickBlockToolbarButton( 'Change column alignment' );
		await page.click( 'role=menuitemradio[name="Align column left"i]' );

		// Click the next cell and add some text. Align center.
		await cells.nth( 2 ).click();
		await page.keyboard.type( 'Centered' );
		await editor.clickBlockToolbarButton( 'Change column alignment' );
		await page.click( 'role=menuitemradio[name="Align column center"i]' );

		// Tab to the next cell and add some text. Align right.
		await cells.nth( 3 ).click();
		await page.keyboard.type( 'Right aligned' );
		await editor.clickBlockToolbarButton( 'Change column alignment' );
		await page.click( 'role=menuitemradio[name="Align column right"i]' );

		// Expect the post to have the correct alignment classes inside the table.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	// Testing for regressions of https://github.com/WordPress/gutenberg/issues/14904.
	test( 'allows cells to be selected when the cell area outside of the RichText is clicked', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/table' } );
		await editor.openDocumentSettingsSidebar();

		// Create the table.
		await page.click( 'role=button[name="Create Table"i]' );

		// Enable fixed width as it exacerbates the amount of empty space around the RichText.
		await page.click(
			`role=region[name="Editor settings"i] >> role=tab[name="Settings"i]`
		);
		await page
			.locator( 'role=checkbox[name="Fixed width table cells"i]' )
			.check();

		// Add multiple new lines to the first cell to make it taller.
		await page.click( 'role=textbox[name="Body cell text"i] >> nth=0' );
		await page.keyboard.type( '\n\n\n\n' );

		// Get the bounding client rect for the second cell.
		const { x: secondCellX, y: secondCellY } = await page
			.locator( 'role=textbox[name="Body cell text"] >> nth=1' )
			.boundingBox();

		// Click in the top left corner of the second cell and type some text.
		await page.mouse.click( secondCellX, secondCellY );
		await page.keyboard.type( 'Second cell.' );

		// Expect that the snapshot shows the text in the second cell.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'allows a caption to be added', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/table' } );

		// Create the table.
		await page.click( 'role=button[name="Create Table"i]' );

		// Click the first cell and add some text.
		await page.click( 'role=document[name="Block: Table"i] >> figcaption' );
		await page.keyboard.type( 'Caption!' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'up and down arrow navigation', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/table' } );
		// Create the table.
		await page.click( 'role=button[name="Create Table"i]' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '3' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '4' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should not have focus loss after creation', async ( {
		editor,
		page,
	} ) => {
		// Insert table block.
		await editor.insertBlock( { name: 'core/table' } );

		// Create the table.
		await page.click( 'role=button[name="Create Table"i]' );

		// Focus should be in first td.
		await expect(
			page.locator( 'role=textbox[name="Body cell text"i] >> nth=0' )
		).toBeFocused();
	} );
} );
