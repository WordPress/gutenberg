/**
 * WordPress dependencies
 */
import { createNewPost, insertBlock, getEditedPostContent } from '@wordpress/e2e-test-utils';

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
		const createButton = await page.$x( "//div[@data-type='core/table']//button[text()='Create']" );
		await createButton[ 0 ].click();

		// // Expect the post content to have a correctly sized table.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'allows text to by typed into cells', async () => {
		await insertBlock( 'Table' );

		// Create the table.
		const createButton = await page.$x( "//div[@data-type='core/table']//button[text()='Create']" );
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

		// Expect the post content to have a correctly sized table.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
