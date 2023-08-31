/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const {
	getTypingEventDurations,
	getClickEventDurations,
	getHoverEventDurations,
	getSelectionEventDurations,
	getLoadingDurations,
	loadBlocksFromHtml,
	load1000Paragraphs,
	sum,
} = require( '../utils' );

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
	test.afterAll( async ( {}, testInfo ) => {
		await testInfo.attach( 'results', {
			body: JSON.stringify( results, null, 2 ),
			contentType: 'application/json',
		} );
	} );

	test.beforeEach( async ( { admin, page } ) => {
		await admin.createNewPost();
		// Disable auto-save to avoid impacting the metrics.
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/editor' ).updateEditorSettings( {
				autosaveInterval: 100000000000,
				localAutosaveInterval: 100000000000,
			} );
		} );
	} );

	test( 'Loading', async ( { browser, page } ) => {
		// Turn the large post HTML into blocks and insert.
		await loadBlocksFromHtml(
			page,
			path.join( process.env.ASSETS_PATH, 'large-post.html' )
		);

		// Save the draft.
		await page
			.getByRole( 'button', { name: 'Save draft' } )
			.click( { timeout: 60_000 } );
		await expect(
			page.getByRole( 'button', { name: 'Saved' } )
		).toBeDisabled();

		// Get the URL that we will be testing against.
		const draftURL = page.url();

		// Start the measurements.
		const samples = 10;
		const throwaway = 1;
		const rounds = throwaway + samples;
		for ( let i = 0; i < rounds; i++ ) {
			// Open a fresh page in a new context to prevent caching.
			const testPage = await browser.newPage();

			// Go to the test page URL.
			await testPage.goto( draftURL );

			// Get canvas (handles both legacy and iframed canvas).
			const canvas = await Promise.any( [
				( async () => {
					const legacyCanvasLocator = page.locator(
						'.wp-block-post-content'
					);
					await legacyCanvasLocator.waitFor();
					return legacyCanvasLocator;
				} )(),
				( async () => {
					const iframedCanvasLocator = page.frameLocator(
						'[name=editor-canvas]'
					);
					await iframedCanvasLocator.locator( 'body' ).waitFor();
					return iframedCanvasLocator;
				} )(),
			] );

			await canvas.locator( '.wp-block' ).first().waitFor( {
				timeout: 120_000,
			} );

			// Save the results.
			if ( i >= throwaway ) {
				const loadingDurations = await getLoadingDurations( testPage );
				Object.entries( loadingDurations ).forEach(
					( [ metric, duration ] ) => {
						results[ metric ].push( duration );
					}
				);
			}

			await testPage.close();
		}
	} );

	test( 'Typing', async ( { browser, page, editor } ) => {
		// Load the large post fixture.
		await loadBlocksFromHtml(
			page,
			path.join( process.env.ASSETS_PATH, 'large-post.html' )
		);

		// Append an empty paragraph.
		await editor.insertBlock( { name: 'core/paragraph' } );

		// Start tracing.
		await browser.startTracing( page, {
			screenshots: false,
			categories: [ 'devtools.timeline' ],
		} );

		// The first character typed triggers a longer time (isTyping change).
		// It can impact the stability of the metric, so we exclude it. It
		// probably deserves a dedicated metric itself, though.
		const samples = 10;
		const throwaway = 1;
		const rounds = samples + throwaway;

		// Type the testing sequence into the empty paragraph.
		await page.keyboard.type( 'x'.repeat( rounds ), {
			delay: BROWSER_IDLE_WAIT,
		} );

		// Stop tracing and save results.
		const traceBuffer = await browser.stopTracing();
		const traceResults = JSON.parse( traceBuffer.toString() );
		const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
			getTypingEventDurations( traceResults );

		for ( let i = throwaway; i < rounds; i++ ) {
			results.type.push(
				keyDownEvents[ i ] + keyPressEvents[ i ] + keyUpEvents[ i ]
			);
		}
	} );

	test( 'Typing within containers', async ( { browser, page, editor } ) => {
		await loadBlocksFromHtml(
			page,
			path.join(
				process.env.ASSETS_PATH,
				'small-post-with-containers.html'
			)
		);

		// Select the block where we type in
		await editor.canvas
			.getByRole( 'document', { name: 'Paragraph block' } )
			.first()
			.click();

		await browser.startTracing( page, {
			screenshots: false,
			categories: [ 'devtools.timeline' ],
		} );

		const samples = 10;
		// The first character typed triggers a longer time (isTyping change).
		// It can impact the stability of the metric, so we exclude it. It
		// probably deserves a dedicated metric itself, though.
		const throwaway = 1;
		const rounds = samples + throwaway;
		await page.keyboard.type( 'x'.repeat( rounds ), {
			delay: BROWSER_IDLE_WAIT,
		} );

		const traceBuffer = await browser.stopTracing();
		const traceResults = JSON.parse( traceBuffer.toString() );
		const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
			getTypingEventDurations( traceResults );

		for ( let i = throwaway; i < rounds; i++ ) {
			results.typeContainer.push(
				keyDownEvents[ i ] + keyPressEvents[ i ] + keyUpEvents[ i ]
			);
		}
	} );

	test( 'Selecting blocks', async ( { browser, page, editor } ) => {
		await load1000Paragraphs( page );
		const paragraphs = editor.canvas.locator( '.wp-block' );

		const samples = 10;
		const throwaway = 1;
		const rounds = samples + throwaway;
		for ( let i = 0; i < rounds; i++ ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( BROWSER_IDLE_WAIT );
			await browser.startTracing( page, {
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			await paragraphs.nth( i ).click();

			const traceBuffer = await browser.stopTracing();

			if ( i >= throwaway ) {
				const traceResults = JSON.parse( traceBuffer.toString() );
				const allDurations = getSelectionEventDurations( traceResults );
				results.focus.push(
					allDurations.reduce( ( acc, eventDurations ) => {
						return acc + sum( eventDurations );
					}, 0 )
				);
			}
		}
	} );

	test( 'Opening persistent list view', async ( { browser, page } ) => {
		await load1000Paragraphs( page );
		const listViewToggle = page.getByRole( 'button', {
			name: 'Document Overview',
		} );

		const samples = 10;
		const throwaway = 1;
		const rounds = samples + throwaway;
		for ( let i = 0; i < rounds; i++ ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( BROWSER_IDLE_WAIT );
			await browser.startTracing( page, {
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			// Open List View
			await listViewToggle.click();

			const traceBuffer = await browser.stopTracing();

			if ( i >= throwaway ) {
				const traceResults = JSON.parse( traceBuffer.toString() );
				const [ mouseClickEvents ] =
					getClickEventDurations( traceResults );
				results.listViewOpen.push( mouseClickEvents[ 0 ] );
			}

			// Close List View
			await listViewToggle.click();
		}
	} );

	test( 'Opening the inserter', async ( { browser, page } ) => {
		await load1000Paragraphs( page );
		const globalInserterToggle = page.getByRole( 'button', {
			name: 'Toggle block inserter',
		} );

		const samples = 10;
		const throwaway = 1;
		const rounds = samples + throwaway;
		for ( let i = 0; i < rounds; i++ ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( BROWSER_IDLE_WAIT );
			await browser.startTracing( page, {
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			// Open Inserter.
			await globalInserterToggle.click();

			const traceBuffer = await browser.stopTracing();

			if ( i >= throwaway ) {
				const traceResults = JSON.parse( traceBuffer.toString() );
				const [ mouseClickEvents ] =
					getClickEventDurations( traceResults );
				results.inserterOpen.push( mouseClickEvents[ 0 ] );
			}

			// Close Inserter.
			await globalInserterToggle.click();
		}
	} );

	test( 'Searching the inserter', async ( { browser, page } ) => {
		await load1000Paragraphs( page );
		const globalInserterToggle = page.getByRole( 'button', {
			name: 'Toggle block inserter',
		} );

		// Open Inserter.
		await globalInserterToggle.click();

		const samples = 10;
		const throwaway = 1;
		const rounds = samples + throwaway;
		for ( let i = 0; i < rounds; i++ ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( BROWSER_IDLE_WAIT );
			await browser.startTracing( page, {
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			await page.keyboard.type( 'p' );

			const traceBuffer = await browser.stopTracing();

			if ( i >= throwaway ) {
				const traceResults = JSON.parse( traceBuffer.toString() );
				const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
					getTypingEventDurations( traceResults );
				results.inserterSearch.push(
					keyDownEvents[ 0 ] + keyPressEvents[ 0 ] + keyUpEvents[ 0 ]
				);
			}

			await page.keyboard.press( 'Backspace' );
		}

		// Close Inserter.
		await globalInserterToggle.click();
	} );

	test( 'Hovering Inserter Items', async ( { browser, page } ) => {
		await load1000Paragraphs( page );
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

		const samples = 10;
		const throwaway = 1;
		const rounds = samples + throwaway;
		for ( let i = 0; i < rounds; i++ ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( BROWSER_IDLE_WAIT );
			await browser.startTracing( page, {
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			// Hover Items.
			await paragraphBlockItem.hover();
			await headingBlockItem.hover();

			const traceBuffer = await browser.stopTracing();

			if ( i >= throwaway ) {
				const traceResults = JSON.parse( traceBuffer.toString() );
				const [ mouseOverEvents, mouseOutEvents ] =
					getHoverEventDurations( traceResults );
				for ( let k = 0; k < mouseOverEvents.length; k++ ) {
					results.inserterHover.push(
						mouseOverEvents[ k ] + mouseOutEvents[ k ]
					);
				}
			}
		}

		// Close Inserter.
		await globalInserterToggle.click();
	} );
} );
