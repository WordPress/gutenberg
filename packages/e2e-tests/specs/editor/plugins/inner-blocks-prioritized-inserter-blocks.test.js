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

	it( 'uses the priority ordering if prioritzed blocks setting is set', async () => {
		const parentBlockSelector =
			'[data-type="test/prioritized-inserter-blocks-set"]';
		await insertBlock( 'Prioritized Inserter Blocks Set' );
		await closeGlobalBlockInserter();

		await page.waitForSelector( parentBlockSelector );

		await page.click(
			`${ parentBlockSelector } .block-list-appender .block-editor-inserter__toggle`
		);

		await page.waitForSelector( QUICK_INSERTER_RESULTS_SELECTOR );

		// Should still be only 6 results regardless of the priority ordering.
		const inserterItems = await getAllBlockInserterItemTitles();

		expect( inserterItems.slice( 0, 3 ) ).toEqual( [
			'Audio',
			'Spacer',
			'Code',
		] );
	} );
} );
