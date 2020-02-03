/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	getAllBlockInserterItemTitles,
	getEditedPostContent,
	insertBlock,
	openAllBlockInserterCategories,
} from '@wordpress/e2e-test-utils';

const INSERTER_RESULTS_SELECTOR = '.block-editor-inserter__results';
const QUOTE_INSERT_BUTTON_SELECTOR = '//button[.="Quote"]';
const APPENDER_SELECTOR = '.my-custom-awesome-appender';
const DYNAMIC_APPENDER_SELECTOR = 'my-dynamic-blocks-appender';

describe( 'RenderAppender prop of InnerBlocks ', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-innerblocks-render-appender' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-innerblocks-render-appender' );
	} );

	it( 'Users can customize the appender and can still insert blocks using exposed components', async () => {
		// Insert the InnerBlocks renderAppender block.
		await insertBlock( 'InnerBlocks renderAppender' );
		// Wait for the custom block appender to appear.
		await page.waitForSelector( APPENDER_SELECTOR );
		// Verify if the custom block appender text is the expected one.
		expect(
			await page.evaluate(
				( el ) => el.innerText,
				await page.$( `${ APPENDER_SELECTOR } > span` )
			)
		).toEqual( 'My custom awesome appender' );

		// Open the inserter of our custom block appender and expand all the categories.
		await page.click(
			`${ APPENDER_SELECTOR } .block-editor-button-block-appender`
		);
		await openAllBlockInserterCategories();

		// Verify if the blocks the custom inserter is rendering are the expected ones.
		expect( await getAllBlockInserterItemTitles() ).toEqual( [
			'Quote',
			'Video',
		] );

		// Find the quote block insert button option within the inserter popover.
		const inserterPopover = await page.$( INSERTER_RESULTS_SELECTOR );
		const quoteButton = (
			await inserterPopover.$x( QUOTE_INSERT_BUTTON_SELECTOR )
		 )[ 0 ];

		// Insert a quote block.
		await quoteButton.click();
		// Verify if the post content is the expected one e.g: the quote was inserted.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'Users can dynamically customize the appender', async () => {
		// Insert the InnerBlocks renderAppender dynamic block.
		await insertBlock( 'InnerBlocks renderAppender dynamic' );

		// Wait for the custom dynamic block appender to appear.
		await page.waitForSelector( '.' + DYNAMIC_APPENDER_SELECTOR );

		// Verify if the custom block appender text is the expected one.
		await page.waitForXPath(
			`//*[contains(@class, "${ DYNAMIC_APPENDER_SELECTOR }")]/span[contains(@class, "empty-blocks-appender")][contains(text(), "Empty Blocks Appender")]`
		);

		// Open the inserter of our custom block appender and expand all the categories.
		const blockAppenderButtonSelector = `.${ DYNAMIC_APPENDER_SELECTOR } .block-editor-button-block-appender`;
		await page.click( blockAppenderButtonSelector );
		await openAllBlockInserterCategories();

		// Verify if the blocks the custom inserter is rendering are the expected ones.
		expect( await getAllBlockInserterItemTitles() ).toEqual( [
			'Quote',
			'Video',
		] );

		// Find the quote block insert button option within the inserter popover.
		const inserterPopover = await page.$( INSERTER_RESULTS_SELECTOR );
		const quoteButton = (
			await inserterPopover.$x( QUOTE_INSERT_BUTTON_SELECTOR )
		 )[ 0 ];

		// Insert a quote block.
		await quoteButton.click();

		// Verify if the custom block appender text changed as expected.
		await page.waitForXPath(
			`//*[contains(@class, "${ DYNAMIC_APPENDER_SELECTOR }")]/span[contains(@class, "single-blocks-appender")][contains(text(), "Single Blocks Appender")]`
		);

		// Verify that the custom appender button is still being rendered.
		expect( await page.$( blockAppenderButtonSelector ) ).toBeTruthy();

		// Insert a video block.
		await insertBlock( 'Video' );

		// Verify if the custom block appender text changed as expected.
		await page.waitForXPath(
			`//*[contains(@class, "${ DYNAMIC_APPENDER_SELECTOR }")]/span[contains(@class, "multiple-blocks-appender")][contains(text(), "Multiple Blocks Appender")]`
		);

		// Verify that the custom appender button is now not being rendered.
		expect( await page.$( blockAppenderButtonSelector ) ).toBeFalsy();

		// Verify that final block markup is the expected one.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
