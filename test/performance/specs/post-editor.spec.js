/* eslint-disable playwright/no-conditional-in-test, playwright/expect-expect */

/**
 * WordPress dependencies
 */
import { test, Metrics } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { PerfUtils } from '../fixtures';
import { sum } from '../utils.js';

// See https://github.com/WordPress/gutenberg/issues/51383#issuecomment-1613460429
const BROWSER_IDLE_WAIT = 1000;

const results = {
	serverResponse: [],
	firstPaint: [],
	domContentLoaded: [],
	loaded: [],
	firstContentfulPaint: [],
	firstBlock: [],
	type: [],
	typeContainer: [],
	focus: [],
	listViewOpen: [],
	inserterOpen: [],
	inserterHover: [],
	inserterSearch: [],
};

test.describe( 'Post Editor Performance', () => {
	test.use( {
		perfUtils: async ( { page }, use ) => {
			await use( new PerfUtils( { page } ) );
		},
		metrics: async ( { page }, use ) => {
			await use( new Metrics( { page } ) );
		},
	} );

	test.afterAll( async ( {}, testInfo ) => {
		await testInfo.attach( 'results', {
			body: JSON.stringify( results, null, 2 ),
			contentType: 'application/json',
		} );
	} );

	test.describe( 'Loading', () => {
		let draftURL = null;

		test( 'Setup the test post', async ( { admin, perfUtils } ) => {
			await admin.createNewPost();
			await perfUtils.loadBlocksForLargePost();
			draftURL = await perfUtils.saveDraft();
		} );

		const samples = 10;
		const throwaway = 1;
		const iterations = samples + throwaway;
		for ( let i = 1; i <= iterations; i++ ) {
			test( `Run the test (${ i } of ${ iterations })`, async ( {
				page,
				perfUtils,
				metrics,
			} ) => {
				// Open the test draft.
				await page.goto( draftURL );
				const canvas = await perfUtils.getCanvas();

				// Wait for the first block.
				await canvas.locator( '.wp-block' ).first().waitFor( {
					timeout: 120_000,
				} );

				// Get the durations.
				const loadingDurations = await metrics.getLoadingDurations();

				// Save the results.
				if ( i > throwaway ) {
					Object.entries( loadingDurations ).forEach(
						( [ metric, duration ] ) => {
							if ( metric === 'timeSinceResponseEnd' ) {
								results.firstBlock.push( duration );
							} else {
								results[ metric ].push( duration );
							}
						}
					);
				}
			} );
		}
	} );

	test.describe( 'Typing', () => {
		let draftURL = null;

		test( 'Setup the test post', async ( { admin, perfUtils, editor } ) => {
			await admin.createNewPost();
			await perfUtils.loadBlocksForLargePost();
			await editor.insertBlock( { name: 'core/paragraph' } );
			draftURL = await perfUtils.saveDraft();
		} );

		test( 'Run the test', async ( { page, perfUtils, metrics } ) => {
			await page.goto( draftURL );
			await perfUtils.disableAutosave();
			const canvas = await perfUtils.getCanvas();

			const paragraph = canvas.getByRole( 'document', {
				name: /Empty block/i,
			} );

			// The first character typed triggers a longer time (isTyping change).
			// It can impact the stability of the metric, so we exclude it. It
			// probably deserves a dedicated metric itself, though.
			const samples = 10;
			const throwaway = 1;
			const iterations = samples + throwaway;

			// Start tracing.
			await metrics.startTracing();

			// Type the testing sequence into the empty paragraph.
			await paragraph.type( 'x'.repeat( iterations ), {
				delay: BROWSER_IDLE_WAIT,
				// The extended timeout is needed because the typing is very slow
				// and the `delay` value itself does not extend it.
				timeout: iterations * BROWSER_IDLE_WAIT * 2, // 2x the total time to be safe.
			} );

			// Stop tracing.
			await metrics.stopTracing();

			// Get the durations.
			const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
				metrics.getTypingEventDurations();

			// Save the results.
			for ( let i = throwaway; i < iterations; i++ ) {
				results.type.push(
					keyDownEvents[ i ] + keyPressEvents[ i ] + keyUpEvents[ i ]
				);
			}
		} );
	} );

	test.describe( 'Typing within containers', () => {
		let draftURL = null;

		test( 'Set up the test post', async ( { admin, perfUtils } ) => {
			await admin.createNewPost();
			await perfUtils.loadBlocksForSmallPostWithContainers();
			draftURL = await perfUtils.saveDraft();
		} );

		test( 'Run the test', async ( { page, perfUtils, metrics } ) => {
			await page.goto( draftURL );
			await perfUtils.disableAutosave();
			const canvas = await perfUtils.getCanvas();

			// Select the block where we type in.
			const firstParagraph = canvas
				.getByRole( 'document', {
					name: /Paragraph block|Block: Paragraph/,
				} )
				.first();
			await firstParagraph.click();

			// The first character typed triggers a longer time (isTyping change).
			// It can impact the stability of the metric, so we exclude it. It
			// probably deserves a dedicated metric itself, though.
			const samples = 10;
			const throwaway = 1;
			const iterations = samples + throwaway;

			// Start tracing.
			await metrics.startTracing();

			// Start typing in the middle of the text.
			await firstParagraph.type( 'x'.repeat( iterations ), {
				delay: BROWSER_IDLE_WAIT,
				// The extended timeout is needed because the typing is very slow
				// and the `delay` value itself does not extend it.
				timeout: iterations * BROWSER_IDLE_WAIT * 2, // 2x the total time to be safe.
			} );

			// Stop tracing.
			await metrics.stopTracing();

			// Get the durations.
			const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
				metrics.getTypingEventDurations();

			// Save the results.
			for ( let i = throwaway; i < iterations; i++ ) {
				results.typeContainer.push(
					keyDownEvents[ i ] + keyPressEvents[ i ] + keyUpEvents[ i ]
				);
			}
		} );
	} );

	test.describe( 'Selecting blocks', () => {
		let draftURL = null;

		test( 'Set up the test post', async ( { admin, perfUtils } ) => {
			await admin.createNewPost();
			await perfUtils.load1000Paragraphs();
			draftURL = await perfUtils.saveDraft();
		} );

		test( 'Run the test', async ( { page, perfUtils, metrics } ) => {
			await page.goto( draftURL );
			await perfUtils.disableAutosave();
			const canvas = await perfUtils.getCanvas();

			const paragraphs = canvas.getByRole( 'document', {
				name: /Empty block/i,
			} );

			const samples = 10;
			const throwaway = 1;
			const iterations = samples + throwaway;
			for ( let i = 1; i <= iterations; i++ ) {
				// Wait for the browser to be idle before starting the monitoring.
				// eslint-disable-next-line no-restricted-syntax
				await page.waitForTimeout( BROWSER_IDLE_WAIT );

				// Start tracing.
				await metrics.startTracing();

				// Click the next paragraph.
				await paragraphs.nth( i ).click();

				// Stop tracing.
				await metrics.stopTracing();

				// Get the durations.
				const allDurations = metrics.getSelectionEventDurations();

				// Save the results.
				if ( i > throwaway ) {
					results.focus.push(
						allDurations.reduce( ( acc, eventDurations ) => {
							return acc + sum( eventDurations );
						}, 0 )
					);
				}
			}
		} );
	} );

	test.describe( 'Opening persistent List View', () => {
		let draftURL = null;

		test( 'Set up the test page', async ( { admin, perfUtils } ) => {
			await admin.createNewPost();
			await perfUtils.load1000Paragraphs();
			draftURL = await perfUtils.saveDraft();
		} );

		test( 'Run the test', async ( { page, perfUtils, metrics } ) => {
			await page.goto( draftURL );
			await perfUtils.disableAutosave();

			const listViewToggle = page.getByRole( 'button', {
				name: 'Document Overview',
			} );

			const samples = 10;
			const throwaway = 1;
			const iterations = samples + throwaway;
			for ( let i = 1; i <= iterations; i++ ) {
				// Wait for the browser to be idle before starting the monitoring.
				// eslint-disable-next-line no-restricted-syntax
				await page.waitForTimeout( BROWSER_IDLE_WAIT );

				// Start tracing.
				await metrics.startTracing();

				// Open List View.
				await listViewToggle.click();
				await perfUtils.expectExpandedState( listViewToggle, 'true' );

				// Stop tracing.
				await metrics.stopTracing();

				// Get the durations.
				const [ mouseClickEvents ] = metrics.getClickEventDurations();

				// Save the results.
				if ( i > throwaway ) {
					results.listViewOpen.push( mouseClickEvents[ 0 ] );
				}

				// Close List View
				await listViewToggle.click();
				await perfUtils.expectExpandedState( listViewToggle, 'false' );
			}
		} );
	} );

	test.describe( 'Opening Inserter', () => {
		let draftURL = null;

		test( 'Set up the test page', async ( { admin, perfUtils } ) => {
			await admin.createNewPost();
			await perfUtils.load1000Paragraphs();
			draftURL = await perfUtils.saveDraft();
		} );

		test( 'Run the test', async ( { page, perfUtils, metrics } ) => {
			// Go to the test page.
			await page.goto( draftURL );
			await perfUtils.disableAutosave();
			const globalInserterToggle = page.getByRole( 'button', {
				name: 'Toggle block inserter',
			} );

			const samples = 10;
			const throwaway = 1;
			const iterations = samples + throwaway;
			for ( let i = 1; i <= iterations; i++ ) {
				// Wait for the browser to be idle before starting the monitoring.
				// eslint-disable-next-line no-restricted-syntax
				await page.waitForTimeout( BROWSER_IDLE_WAIT );

				// Start tracing.
				await metrics.startTracing();

				// Open Inserter.
				await globalInserterToggle.click();
				await perfUtils.expectExpandedState(
					globalInserterToggle,
					'true'
				);

				// Stop tracing.
				await metrics.stopTracing();

				// Get the durations.
				const [ mouseClickEvents ] = metrics.getClickEventDurations();

				// Save the results.
				if ( i > throwaway ) {
					results.inserterOpen.push( mouseClickEvents[ 0 ] );
				}

				// Close Inserter.
				await globalInserterToggle.click();
				await perfUtils.expectExpandedState(
					globalInserterToggle,
					'false'
				);
			}
		} );
	} );

	test.describe( 'Searching Inserter', () => {
		let draftURL = null;

		test( 'Set up the test page', async ( { admin, perfUtils } ) => {
			await admin.createNewPost();
			await perfUtils.load1000Paragraphs();
			draftURL = await perfUtils.saveDraft();
		} );

		test( 'Run the test', async ( { page, perfUtils, metrics } ) => {
			// Go to the test page.
			await page.goto( draftURL );
			await perfUtils.disableAutosave();
			const globalInserterToggle = page.getByRole( 'button', {
				name: 'Toggle block inserter',
			} );

			// Open Inserter.
			await globalInserterToggle.click();
			await perfUtils.expectExpandedState( globalInserterToggle, 'true' );

			const samples = 10;
			const throwaway = 1;
			const iterations = samples + throwaway;
			for ( let i = 1; i <= iterations; i++ ) {
				// Wait for the browser to be idle before starting the monitoring.
				// eslint-disable-next-line no-restricted-syntax
				await page.waitForTimeout( BROWSER_IDLE_WAIT );

				// Start tracing.
				await metrics.startTracing();

				// Type to trigger search.
				await page.keyboard.type( 'p' );

				// Stop tracing.
				await metrics.stopTracing();

				// Get the durations.
				const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
					metrics.getTypingEventDurations();

				// Save the results.
				if ( i > throwaway ) {
					results.inserterSearch.push(
						keyDownEvents[ 0 ] +
							keyPressEvents[ 0 ] +
							keyUpEvents[ 0 ]
					);
				}

				await page.keyboard.press( 'Backspace' );
			}
		} );
	} );

	test.describe( 'Hovering Inserter items', () => {
		let draftURL = null;

		test( 'Set up the test page', async ( { admin, perfUtils } ) => {
			await admin.createNewPost();
			await perfUtils.load1000Paragraphs();
			draftURL = await perfUtils.saveDraft();
		} );

		test( 'Run the test', async ( { page, perfUtils, metrics } ) => {
			// Go to the test page.
			await page.goto( draftURL );
			await perfUtils.disableAutosave();

			const globalInserterToggle = page.getByRole( 'button', {
				name: 'Toggle block inserter',
			} );
			const paragraphBlockItem = page.locator(
				'.block-editor-inserter__menu .editor-block-list-item-paragraph'
			);
			const headingBlockItem = page.locator(
				'.block-editor-inserter__menu .editor-block-list-item-heading'
			);

			// Open Inserter.
			await globalInserterToggle.click();
			await perfUtils.expectExpandedState( globalInserterToggle, 'true' );

			const samples = 10;
			const throwaway = 1;
			const iterations = samples + throwaway;
			for ( let i = 1; i <= iterations; i++ ) {
				// Wait for the browser to be idle before starting the monitoring.
				// eslint-disable-next-line no-restricted-syntax
				await page.waitForTimeout( BROWSER_IDLE_WAIT );

				// Start tracing.
				await metrics.startTracing();

				// Hover Inserter items.
				await paragraphBlockItem.hover();
				await headingBlockItem.hover();

				// Stop tracing.
				await metrics.stopTracing();

				// Get the durations.
				const [ mouseOverEvents, mouseOutEvents ] =
					metrics.getHoverEventDurations();

				// Save the results.
				if ( i > throwaway ) {
					for ( let k = 0; k < mouseOverEvents.length; k++ ) {
						results.inserterHover.push(
							mouseOverEvents[ k ] + mouseOutEvents[ k ]
						);
					}
				}
			}
		} );
	} );
} );

/* eslint-enable playwright/no-conditional-in-test, playwright/expect-expect */
