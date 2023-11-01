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
	canvas,
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

	describe( 'Quick inserter', () => {
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

			await expect( await getAllBlockInserterItemTitles() ).toHaveLength(
				6
			);
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

			// Should still be only 6 results regardless of the priority ordering.
			expect( inserterItems ).toHaveLength( 6 );

			expect( inserterItems.slice( 0, 3 ) ).toEqual( [
				'Audio',
				'Spacer',
				'Code',
			] );
		} );

		it( 'obeys allowed blocks over prioritzed blocks setting if conflicted', async () => {
			const parentBlockSelector =
				'[data-type="test/prioritized-inserter-blocks-set-with-conflicting-allowed-blocks"]';
			await insertBlock(
				'Prioritized Inserter Blocks Set With Conflicting Allowed Blocks'
			);
			await closeGlobalBlockInserter();

			await page.waitForSelector( parentBlockSelector );

			await page.click(
				`${ parentBlockSelector } .block-list-appender .block-editor-inserter__toggle`
			);

			await page.waitForSelector( QUICK_INSERTER_RESULTS_SELECTOR );

			const inserterItems = await getAllBlockInserterItemTitles();

			expect( inserterItems.slice( 0, 3 ) ).toEqual( [
				'Spacer',
				'Code',
				'Paragraph',
			] );
			expect( inserterItems ).toEqual(
				expect.not.arrayContaining( [ 'Audio' ] )
			);
		} );
	} );
	describe( 'Slash inserter', () => {
		it( 'uses the priority ordering if prioritzed blocks setting is set', async () => {
			await insertBlock( 'Prioritized Inserter Blocks Set' );
			await canvas().click( '[data-type="core/image"]' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( '/' );
			// Wait for the results to display.
			await page.waitForSelector( '.components-autocomplete__result' );
			const inserterItemTitles = await page.evaluate( () => {
				return Array.from(
					document.querySelectorAll(
						'.components-autocomplete__result'
					)
				).map( ( { innerText } ) => innerText );
			} );
			expect( inserterItemTitles ).toHaveLength( 9 ); // Default suggested blocks number.
			expect( inserterItemTitles.slice( 0, 3 ) ).toEqual( [
				'Audio',
				'Spacer',
				'Code',
			] );
		} );
	} );
} );
