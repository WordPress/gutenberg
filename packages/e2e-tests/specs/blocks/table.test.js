/**
 * External dependencies
 */
import { capitalize } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	clickButton,
	clickBlockToolbarButton,
	createNewPost,
	getEditedPostContent,
	insertBlock,
	pressKeyTimes,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

const createButtonLabel = 'Create Table';

/**
 * Utility function for changing the selected cell alignment.
 *
 * @param {string} align The alignment (one of 'left', 'center', or 'right').
 */
async function changeCellAlignment( align ) {
	await clickBlockToolbarButton( 'Change column alignment' );
	await clickButton( `Align Column ${ capitalize( align ) }` );
}

describe( 'Table', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'displays a form for choosing the row and column count of the table', async () => {
		await insertBlock( 'Table' );

		// Check for existence of the column count field.
		const columnCountLabel = await page.$x( "//div[@data-type='core/table']//label[text()='Column Count']" );
		expect( columnCountLabel ).toHaveLength( 1 );

		// Modify the column count.
		await columnCountLabel[ 0 ].click();
		const currentColumnCount = await page.evaluate( () => document.activeElement.value );
		expect( currentColumnCount ).toBe( '2' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '5' );

		// Check for existence of the row count field.
		const rowCountLabel = await page.$x( "//div[@data-type='core/table']//label[text()='Row Count']" );
		expect( rowCountLabel ).toHaveLength( 1 );

		// Modify the row count.
		await rowCountLabel[ 0 ].click();
		const currentRowCount = await page.evaluate( () => document.activeElement.value );
		expect( currentRowCount ).toBe( '2' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '10' );

		// Create the table.
		await clickButton( createButtonLabel );

		// Expect the post content to have a correctly sized table.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'allows text to by typed into cells', async () => {
		await insertBlock( 'Table' );

		// Create the table.
		await clickButton( createButtonLabel );

		// Click the first cell and add some text.
		await page.click( '.wp-block-table__cell-content' );
		await page.keyboard.type( 'This' );

		// Tab to the next cell and add some text.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'is' );

		// Tab to the next cell and add some text.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( 'table' );

		// Tab to the next cell and add some text.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'block' );

		// Expect the post to have the correct written content inside the table.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'allows header and footer rows to be switched on and off', async () => {
		await insertBlock( 'Table' );

		const headerSwitchSelector = "//label[text()='Header section']";
		const footerSwitchSelector = "//label[text()='Footer section']";

		// Expect the header and footer switches not to be present before the table has been created.
		let headerSwitch = await page.$x( headerSwitchSelector );
		let footerSwitch = await page.$x( footerSwitchSelector );
		expect( headerSwitch ).toHaveLength( 0 );
		expect( footerSwitch ).toHaveLength( 0 );

		// Create the table.
		await clickButton( createButtonLabel );

		// Expect the header and footer switches to be present now that the table has been created.
		headerSwitch = await page.$x( headerSwitchSelector );
		footerSwitch = await page.$x( footerSwitchSelector );
		expect( headerSwitch ).toHaveLength( 1 );
		expect( footerSwitch ).toHaveLength( 1 );

		// Toggle on the switches and add some content.
		await headerSwitch[ 0 ].click();
		await footerSwitch[ 0 ].click();

		await page.click( 'thead .wp-block-table__cell-content' );
		await page.keyboard.type( 'header' );

		await page.click( 'tbody .wp-block-table__cell-content' );
		await page.keyboard.type( 'body' );

		await page.click( 'tfoot .wp-block-table__cell-content' );
		await page.keyboard.type( 'footer' );

		// Expect the table to have a header, body and footer with written content.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		// Toggle off the switches
		await headerSwitch[ 0 ].click();
		await footerSwitch[ 0 ].click();

		// Expect the table to have only a body with written content.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'allows adding and deleting columns across the table header, body and footer', async () => {
		await insertBlock( 'Table' );

		// Create the table.
		await clickButton( createButtonLabel );

		// Toggle on the switches and add some content.
		const headerSwitch = await page.$x( "//label[text()='Header section']" );
		const footerSwitch = await page.$x( "//label[text()='Footer section']" );
		await headerSwitch[ 0 ].click();
		await footerSwitch[ 0 ].click();

		await page.click( '.wp-block-table__cell-content' );

		// Add a column.
		await clickBlockToolbarButton( 'Edit table' );
		await clickButton( 'Add Column After' );

		// Expect the table to have 3 columns across the header, body and footer.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.click( '.wp-block-table__cell-content' );

		// Delete a column.
		await clickBlockToolbarButton( 'Edit table' );
		await clickButton( 'Delete Column' );

		// Expect the table to have 2 columns across the header, body and footer.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'allows columns to be aligned', async () => {
		await insertBlock( 'Table' );

		const [ columnCountLabel ] = await page.$x( "//div[@data-type='core/table']//label[text()='Column Count']" );
		await columnCountLabel.click();
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '4' );

		// Create the table.
		await clickButton( createButtonLabel );

		// Click the first cell and add some text. Don't align.
		const cells = await page.$$( '.wp-block-table__cell-content' );
		await cells[ 0 ].click();
		await page.keyboard.type( 'None' );

		// Click to the next cell and add some text. Align left.
		await cells[ 1 ].click();
		await page.keyboard.type( 'To the left' );
		await changeCellAlignment( 'left' );

		// Click the next cell and add some text. Align center.
		await cells[ 2 ].click();
		await page.keyboard.type( 'Centered' );
		await changeCellAlignment( 'center' );

		// Tab to the next cell and add some text. Align right.
		await cells[ 3 ].click();
		await page.keyboard.type( 'Right aligned' );
		await changeCellAlignment( 'right' );

		// Expect the post to have the correct alignment classes inside the table.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	// Testing for regressions of https://github.com/WordPress/gutenberg/issues/14904.
	it( 'allows cells to be selected when the cell area outside of the RichText is clicked', async () => {
		await insertBlock( 'Table' );

		// Create the table.
		await clickButton( createButtonLabel );

		// Enable fixed width as it exascerbates the amount of empty space around the RichText.
		const [ fixedWidthSwitch ] = await page.$x( "//label[text()='Fixed width table cells']" );
		await fixedWidthSwitch.click();

		// Add multiple new lines to the first cell to make it taller.
		await page.click( '.wp-block-table__cell-content' );
		await page.keyboard.type( '\n\n\n\n' );

		// Get the bounding client rect for the second cell.
		const { x: secondCellX, y: secondCellY } = await page.evaluate( () => {
			const secondCell = document.querySelectorAll( '.wp-block-table td' )[ 1 ];
			// Page.evaluate can only return a serializable value to the
			// parent process, so destructure and restructure the result
			// into an object.
			const { x, y } = secondCell.getBoundingClientRect();
			return { x, y };
		} );

		// Click in the top left corner of the second cell and type some text.
		await page.mouse.click( secondCellX, secondCellY );
		await page.keyboard.type( 'Second cell.' );

		// Expect that the snapshot shows the text in the second cell.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'allows keyboard navigation between table cells using arrow keys', async () => {
		await insertBlock( 'Table' );

		// Modify the row and column count and create the table.
		await pressKeyTimes( 'Tab', 5 );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '4' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '4' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Space' );

		// Tab into the first cell.
		await page.keyboard.press( 'Tab' );

		// Navigate and type spreadsheet-style cell locations.
		// First use normal arrow keys in the middle of the table.
		await pressKeyTimes( 'ArrowRight', 2 );
		await page.keyboard.type( 'C1' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( 'C2' );
		await pressKeyTimes( 'ArrowLeft', 3 );
		await page.keyboard.type( 'B2' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( 'B1' );

		// Next use Cmd/Ctrl with arrow keys to navigate to the corners of the table.
		await pressKeyWithModifier( 'primary', 'ArrowRight' );
		await page.keyboard.type( 'D1' );
		await pressKeyWithModifier( 'primary', 'ArrowDown' );
		await page.keyboard.type( 'D4' );
		await pressKeyTimes( 'ArrowLeft', 2 );
		await pressKeyWithModifier( 'primary', 'ArrowLeft' );
		await page.keyboard.type( 'A4' );
		await pressKeyWithModifier( 'primary', 'ArrowUp' );
		await page.keyboard.type( 'A1' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'allows keyboard navigation between table cells using the HOME and END keys', async () => {
		await insertBlock( 'Table' );

		// Modify the row and column count and create the table.
		await pressKeyTimes( 'Tab', 5 );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '4' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '4' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Space' );

		// Tab into the first cell.
		await page.keyboard.press( 'Tab' );

		// Navigate and type spreadsheet-style cell locations.
		// Navigate to the start and end of the second row.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Home' );
		await page.keyboard.type( 'A2' );
		await page.keyboard.press( 'End' );
		await page.keyboard.type( 'D2' );

		// Move the caret to the start of the cell.
		await pressKeyTimes( 'ArrowLeft', 2 );

		// Navigate to the first and last cells in the table.
		await pressKeyWithModifier( 'primary', 'Home' );
		await page.keyboard.type( 'A1' );
		await pressKeyWithModifier( 'primary', 'End' );
		await page.keyboard.type( 'D4' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
