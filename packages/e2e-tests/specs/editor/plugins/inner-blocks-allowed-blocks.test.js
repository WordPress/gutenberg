/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	getAllBlockInserterItemTitles,
	insertBlock,
	openGlobalBlockInserter,
	closeGlobalBlockInserter,
	clickBlockToolbarButton,
} from '@wordpress/e2e-test-utils';

describe( 'Allowed Blocks Setting on InnerBlocks', () => {
	const paragraphSelector =
		'.block-editor-rich-text__editable[data-type="core/paragraph"]';
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-innerblocks-allowed-blocks' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-innerblocks-allowed-blocks' );
	} );

	it( 'allows all blocks if the allowed blocks setting was not set', async () => {
		const parentBlockSelector = '[data-type="test/allowed-blocks-unset"]';
		const childParagraphSelector = `${ parentBlockSelector } ${ paragraphSelector }`;
		await insertBlock( 'Allowed Blocks Unset' );
		await closeGlobalBlockInserter();
		await page.waitForSelector( childParagraphSelector );
		await page.click( childParagraphSelector );
		await openGlobalBlockInserter();
		await expect(
			( await getAllBlockInserterItemTitles() ).length
		).toBeGreaterThan( 20 );
	} );

	it( 'allows the blocks if the allowed blocks setting was set', async () => {
		const parentBlockSelector = '[data-type="test/allowed-blocks-set"]';
		const childParagraphSelector = `${ parentBlockSelector } ${ paragraphSelector }`;
		await insertBlock( 'Allowed Blocks Set' );
		await closeGlobalBlockInserter();
		await page.waitForSelector( childParagraphSelector );
		await page.click( childParagraphSelector );
		await openGlobalBlockInserter();
		expect( await getAllBlockInserterItemTitles() ).toEqual( [
			'Button',
			'Gallery',
			'List',
			'Media & Text',
			'Quote',
		] );
	} );

	it( 'correctly applies dynamic allowed blocks restrictions', async () => {
		await insertBlock( 'Allowed Blocks Dynamic' );
		await closeGlobalBlockInserter();
		const parentBlockSelector = '[data-type="test/allowed-blocks-dynamic"]';
		const blockAppender = '.block-list-appender button';
		const appenderSelector = `${ parentBlockSelector } ${ blockAppender }`;
		await page.waitForSelector( appenderSelector );
		await page.click( appenderSelector );
		expect( await getAllBlockInserterItemTitles() ).toEqual( [
			'Image',
			'List',
		] );
		const insertButton = (
			await page.$x( `//button//span[contains(text(), 'List')]` )
		 )[ 0 ];
		await insertButton.click();
		await insertBlock( 'Image' );
		await closeGlobalBlockInserter();
		await page.waitForSelector( '.product[data-number-of-children="2"]' );
		await clickBlockToolbarButton( 'Select Allowed Blocks Dynamic' );
		// This focus shouldn't be neessary but there's a bug in trunk right now
		// Where if you open the inserter, don't do anything and click the "appender" on the canvas
		// the appender is not opened right away.
		// It needs to be investigated on its own.
		await page.focus( appenderSelector );
		await page.click( appenderSelector );
		expect( await getAllBlockInserterItemTitles() ).toEqual( [
			'Gallery',
			'Video',
		] );
	} );
} );
