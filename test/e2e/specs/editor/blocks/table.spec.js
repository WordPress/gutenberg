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
		const columnCountInput = editor.canvas.locator(
			'role=spinbutton[name="Column count"i]'
		);
		await expect( columnCountInput ).toBeVisible();

		// Modify the column count.
		await columnCountInput.click();
		await expect( columnCountInput ).toHaveValue( '2' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '5' );

		// Check for existence of the row count field.
		const rowCountInput = editor.canvas.locator(
			'role=spinbutton[name="Row count"i]'
		);
		await expect( rowCountInput ).toBeVisible();

		// Modify the row count.
		await rowCountInput.click();
		await expect( rowCountInput ).toHaveValue( '2' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '10' );

		// Create the table.
		await editor.canvas
			.locator( 'role=button[name="Create Table"i]' )
			.click();

		// Expect the post content to have a correctly sized table.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'allows text to by typed into cells', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/table' } );

		// Create the table.
		await editor.canvas
			.locator( 'role=button[name="Create Table"i]' )
			.click();

		// Click the first cell and add some text.
		await editor.canvas
			.locator( 'role=textbox[name="Body cell text"i] >> nth=0' )
			.click();
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
		await editor.canvas
			.locator( 'role=button[name="Create Table"i]' )
			.click();

		// Expect the header and footer switches to be present now that the table has been created.
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'tab', { name: 'Settings' } )
			.click();
		await expect( headerSwitch ).toBeVisible();
		await expect( footerSwitch ).toBeVisible();

		// // Toggle on the switches and add some content.
		await headerSwitch.check();
		await footerSwitch.check();

		await editor.canvas
			.locator(
				'role=rowgroup >> nth=0 >> role=textbox[name="Header cell text"i] >> nth=0'
			)
			.click();
		await page.keyboard.type( 'header' );

		await editor.canvas
			.locator(
				'role=rowgroup >> nth=1 >> role=textbox[name="Body cell text"i] >> nth=0'
			)
			.click();
		await page.keyboard.type( 'body' );

		await editor.canvas
			.locator(
				'role=rowgroup >> nth=2 >> role=textbox[name="Footer cell text"i] >> nth=0'
			)
			.click();
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
		await editor.canvas
			.locator( 'role=button[name="Create Table"i]' )
			.click();

		// Toggle on the switches and add some content.
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'tab', { name: 'Settings' } )
			.click();
		await page.locator( 'role=checkbox[name="Header section"i]' ).check();
		await page.locator( 'role=checkbox[name="Footer section"i]' ).check();
		await editor.canvas
			.locator( 'role=textbox[name="Body cell text"i] >> nth=0' )
			.click();

		// Add a column.
		await editor.clickBlockToolbarButton( 'Edit table' );
		await page
			.getByRole( 'menuitem', { name: 'Insert column after' } )
			.click();

		// Expect the table to have 3 columns across the header, body and footer.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await editor.canvas
			.locator( 'role=textbox[name="Body cell text"i] >> nth=0' )
			.click();

		// Delete a column.
		await editor.clickBlockToolbarButton( 'Edit table' );
		await page.getByRole( 'menuitem', { name: 'Delete column' } ).click();

		// Expect the table to have 2 columns across the header, body and footer.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'allows rows and columns to be edited with keyboard shortcuts', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/table',
			attributes: {
				body: [
					{
						cells: [
							{ content: 'A1', tag: 'td' },
							{ content: 'B1', tag: 'td' },
						],
					},
					{
						cells: [
							{ content: 'A2', tag: 'td' },
							{ content: 'B2', tag: 'td' },
						],
					},
				],
			},
		} );

		const cells = editor.canvas.getByRole( 'textbox', {
			name: 'Body cell text',
		} );

		await cells.first().click();

		// Each shortcut moves focus to the new cell, so typing is saved there.
		await pageUtils.pressKeys( 'secondary+d' );
		await page.keyboard.type( 'after' );
		await expect( cells ).toHaveText( [
			'A1',
			'B1',
			'after',
			'',
			'A2',
			'B2',
		] );

		await pageUtils.pressKeys( 'secondary+u' );
		await page.keyboard.type( 'before' );
		await expect( cells ).toHaveText( [
			'A1',
			'B1',
			'before',
			'',
			'after',
			'',
			'A2',
			'B2',
		] );

		// The row below takes the place of the deleted row, and keeps focus.
		await pageUtils.pressKeys( 'secondary+x' );
		await expect( cells.nth( 2 ) ).toBeFocused();
		await expect( cells ).toHaveText( [
			'A1',
			'B1',
			'after',
			'',
			'A2',
			'B2',
		] );

		await pageUtils.pressKeys( 'secondary+r' );
		await page.keyboard.type( 'right' );
		await pageUtils.pressKeys( 'secondary+l' );
		await page.keyboard.type( 'left' );
		await expect( cells ).toHaveText( [
			'A1',
			'',
			'',
			'B1',
			'after',
			'left',
			'right',
			'',
			'A2',
			'',
			'',
			'B2',
		] );

		// The column to the right takes the place of the deleted column.
		await pageUtils.pressKeys( 'secondary+c' );
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' moved' );

		await expect
			.poll( editor.getEditedPostContent )
			.toContain(
				'<tr><td>A1</td><td></td><td>B1</td></tr><tr><td>after</td><td>right moved</td><td></td></tr><tr><td>A2</td><td></td><td>B2</td></tr>'
			);
	} );

	test( 'keeps focus in the block when a shortcut deletes the last row', async ( {
		editor,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/table',
			attributes: {
				body: [ { cells: [ { content: 'Only', tag: 'td' } ] } ],
			},
		} );

		await editor.canvas
			.getByRole( 'textbox', { name: 'Body cell text' } )
			.click();
		await pageUtils.pressKeys( 'secondary+x' );

		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Table' } )
		).toBeFocused();
		await expect(
			editor.canvas.getByRole( 'spinbutton', { name: 'Column count' } )
		).toBeVisible();
	} );

	test( 'shows the keyboard shortcuts in the Edit table menu', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/table',
			attributes: {
				body: [ { cells: [ { content: 'Cell', tag: 'td' } ] } ],
			},
		} );

		await editor.canvas
			.getByRole( 'textbox', { name: 'Body cell text' } )
			.click();
		await editor.clickBlockToolbarButton( 'Edit table' );

		const menu = page.getByRole( 'menu', { name: 'Edit table' } );

		await expect( menu.getByRole( 'menuitem' ) ).toHaveCount( 6 );
		await expect(
			menu.locator( '.components-menu-item__shortcut' )
		).toHaveCount( 6 );
	} );

	test( 'allows columns to be aligned', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/table' } );

		await editor.canvas
			.locator( 'role=spinbutton[name="Column count"i]' )
			.click();
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '4' );

		// Create the table.
		await editor.canvas
			.locator( 'role=button[name="Create Table"i]' )
			.click();

		// Click the first cell and add some text. Don't align.
		const cells = editor.canvas.locator(
			'role=textbox[name="Body cell text"i]'
		);
		await cells.nth( 0 ).click();
		await page.keyboard.type( 'None' );

		// Click to the next cell and add some text. Align left.
		await cells.nth( 1 ).click();
		await page.keyboard.type( 'To the left' );
		await editor.clickBlockToolbarButton( 'Align column content' );
		await page
			.getByRole( 'menuitemradio', { name: 'Align column left' } )
			.click();

		// Click the next cell and add some text. Align center.
		await cells.nth( 2 ).click();
		await page.keyboard.type( 'Centered' );
		await editor.clickBlockToolbarButton( 'Align column content' );
		await page
			.getByRole( 'menuitemradio', { name: 'Align column center' } )
			.click();

		// Tab to the next cell and add some text. Align right.
		await cells.nth( 3 ).click();
		await page.keyboard.type( 'Right aligned' );
		await editor.clickBlockToolbarButton( 'Align column content' );
		await page
			.getByRole( 'menuitemradio', { name: 'Align column right' } )
			.click();

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
		await editor.canvas
			.locator( 'role=button[name="Create Table"i]' )
			.click();

		// Enable fixed width as it exacerbates the amount of empty space around the RichText.
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'tab', { name: 'Settings' } )
			.click();
		await page
			.locator( 'role=checkbox[name="Fixed width table cells"i]' )
			.check();

		// Add multiple new lines to the first cell to make it taller.
		await editor.canvas
			.locator( 'role=textbox[name="Body cell text"i] >> nth=0' )
			.click();
		await page.keyboard.type( '\n\n\n\n' );

		// Get the bounding client rect for the second cell.
		const { x: secondCellX, y: secondCellY } = await editor.canvas
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
		await editor.canvas
			.locator( 'role=button[name="Create Table"i]' )
			.click();

		await editor.clickBlockToolbarButton( 'Add caption' );
		const caption = editor.canvas.locator(
			'role=textbox[name="Table caption text"i]'
		);
		await expect( caption ).toBeFocused();
		await page.keyboard.type( 'Caption!' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'up and down arrow navigation', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/table' } );
		// Create the table.
		await editor.canvas
			.locator( 'role=button[name="Create Table"i]' )
			.click();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '3' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '4' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should not have focus loss after creation', async ( { editor } ) => {
		// Insert table block.
		await editor.insertBlock( { name: 'core/table' } );

		// Create the table.
		await editor.canvas
			.locator( 'role=button[name="Create Table"i]' )
			.click();

		// Focus should be in first td.
		await expect(
			editor.canvas.locator(
				'role=textbox[name="Body cell text"i] >> nth=0'
			)
		).toBeFocused();
	} );
} );
