/**
 * WordPress dependencies
 */
import { createNewPost, insertBlock, getEditedPostContent } from '@wordpress/e2e-test-utils';

const buttonSelector = "//div[@data-type='core/table']//button[text()='Create Table']";

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

		// // Check for existence of the row count field.
		const rowCountLabel = await page.$x( "//div[@data-type='core/table']//label[text()='Row Count']" );
		expect( rowCountLabel ).toHaveLength( 1 );

		// // Modify the row count.
		await rowCountLabel[ 0 ].click();
		const currentRowCount = await page.evaluate( () => document.activeElement.value );
		expect( currentRowCount ).toBe( '2' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '10' );

		// // Create the table.
		const createButton = await page.$x( buttonSelector );
		await createButton[ 0 ].click();

		// // Expect the post content to have a correctly sized table.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'allows text to by typed into cells', async () => {
		await insertBlock( 'Table' );

		// Create the table.
		const createButton = await page.$x( buttonSelector );
		await createButton[ 0 ].click();

		// Click the first cell and add some text.
		await page.click( '.wp-block-table__cell-content' );
		await page.keyboard.type( 'This' );

		// Tab to the next cell and add some text.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'is' );

		// Tab to the next cell and add some text.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'table' );

		// Tab to the next cell and add some text.
		await page.keyboard.press( 'Tab' );
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
		const createButton = await page.$x( buttonSelector );
		await createButton[ 0 ].click();

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
} );
