/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	getAllBlockInserterItemTitles,
	insertBlock,
	closeGlobalBlockInserter,
} from '@wordpress/e2e-test-utils';

const QUICK_INSERTER_RESULTS_SELECTOR =
	'.block-editor-inserter__quick-inserter-results';

describe( 'Prioritized Inserter Blocks Setting on InnerBlocks', () => {
	beforeAll( async () => {
		await activatePlugin(
			'gutenberg-test-innerblocks-prioritized-inserter-blocks'
		);
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin(
			'gutenberg-test-innerblocks-prioritized-inserter-blocks'
		);
	} );

	it( 'uses defaulting ordering if prioritzed blocks setting was not set', async () => {
		const parentBlockSelector =
			'[data-type="test/prioritized-inserter-blocks-unset"]';
		await insertBlock( 'Prioritized Inserter Blocks Unset' );
		await closeGlobalBlockInserter();

		await page.waitForSelector( parentBlockSelector );

		await page.click(
			`${ parentBlockSelector } .block-list-appender .block-editor-inserter__toggle`
		);

		await page.waitForSelector( QUICK_INSERTER_RESULTS_SELECTOR );

		await expect( await getAllBlockInserterItemTitles() ).toHaveLength( 6 );
	} );

	// it( 'allows the blocks if the allowed blocks setting was set', async () => {
	// 	const parentBlockSelector = '[data-type="test/prioritized-inner-block-set"]';
	// 	const childParagraphSelector = `${ parentBlockSelector } ${ imageBlockSelector }`;
	// 	await insertBlock( 'Prioritized Inserter Blocks Set' );
	// 	await closeGlobalBlockInserter();
	// 	await page.waitForSelector( childParagraphSelector );
	// 	await page.click( childParagraphSelector );
	// 	await openGlobalBlockInserter();
	// 	expect( await getAllBlockInserterItemTitles() ).toEqual( [
	// 		'Button',
	// 		'Gallery',
	// 		'List',
	// 		'Media & Text',
	// 		'Quote',
	// 	] );
	// } );

	// it( 'correctly applies dynamic allowed blocks restrictions', async () => {
	// 	await insertBlock( 'Prioritized Inserter Blocks Dynamic' );
	// 	await closeGlobalBlockInserter();
	// 	const parentBlockSelector = '[data-type="test/prioritized-inner-block-dynamic"]';
	// 	const blockAppender = '.block-list-appender button';
	// 	const appenderSelector = `${ parentBlockSelector } ${ blockAppender }`;
	// 	await page.waitForSelector( appenderSelector );
	// 	await page.click( appenderSelector );
	// 	expect( await getAllBlockInserterItemTitles() ).toEqual( [
	// 		'Image',
	// 		'List',
	// 	] );
	// 	const insertButton = (
	// 		await page.$x( `//button//span[contains(text(), 'List')]` )
	// 	 )[ 0 ];
	// 	await insertButton.click();
	// 	// Select the list wrapper so the image is inserable.
	// 	await page.keyboard.press( 'ArrowUp' );
	// 	await insertBlock( 'Image' );
	// 	await closeGlobalBlockInserter();
	// 	await page.waitForSelector( '.product[data-number-of-children="2"]' );
	// 	await clickBlockToolbarButton(
	// 		'Select Prioritized Inserter Blocks Dynamic'
	// 	);
	// 	// This focus shouldn't be neessary but there's a bug in trunk right now
	// 	// Where if you open the inserter, don't do anything and click the "appender" on the canvas
	// 	// the appender is not opened right away.
	// 	// It needs to be investigated on its own.
	// 	await page.focus( appenderSelector );
	// 	await page.click( appenderSelector );
	// 	expect( await getAllBlockInserterItemTitles() ).toEqual( [
	// 		'Gallery',
	// 		'Video',
	// 	] );
	// } );
} );
