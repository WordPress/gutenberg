/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	getAllBlockInserterItemTitles,
	insertBlock,
	openAllBlockInserterCategories,
	openGlobalBlockInserter,
} from '@wordpress/e2e-test-utils';

describe( 'Allowed Blocks Setting on InnerBlocks ', () => {
	const paragraphSelector = '.block-editor-rich-text__editable.wp-block-paragraph';
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
		await page.waitForSelector( childParagraphSelector );
		await page.click( childParagraphSelector );
		await openGlobalBlockInserter();
		await openAllBlockInserterCategories();
		expect(
			( await getAllBlockInserterItemTitles() ).length
		).toBeGreaterThan( 20 );
	} );

	it( 'allows the blocks if the allowed blocks setting was set', async () => {
		const parentBlockSelector = '[data-type="test/allowed-blocks-set"]';
		const childParagraphSelector = `${ parentBlockSelector } ${ paragraphSelector }`;
		await insertBlock( 'Allowed Blocks Set' );
		await page.waitForSelector( childParagraphSelector );
		await page.click( childParagraphSelector );
		await openGlobalBlockInserter();
		await openAllBlockInserterCategories();
		expect(
			await getAllBlockInserterItemTitles()
		).toEqual( [
			'Button',
			'Gallery',
			'List',
			'Media & Text',
			'Quote',
		] );
	} );
} );
