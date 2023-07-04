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
	readFile,
	deleteFile,
	getTypingEventDurations,
	getClickEventDurations,
	getHoverEventDurations,
	getSelectionEventDurations,
	getLoadingDurations,
	loadBlocksFromHtml,
	load1000Paragraphs,
	saveResultsFile,
	sum,
	getTraceFilePath,
} = require( '../utils' );

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
	const traceFilePath = getTraceFilePath();

	test.afterAll( async () => {
		saveResultsFile( __filename, results );
		deleteFile( traceFilePath );
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
		await loadBlocksFromHtml(
			page,
			path.join( process.env.ASSETS_PATH, 'large-post.html' )
		);

		await page
			.getByRole( 'button', { name: 'Save draft' } )
			.click( { timeout: 60_000 } );
		await expect(
			page.getByRole( 'button', { name: 'Saved' } )
		).toBeDisabled();

		const draftURL = page.url();

		// Number of sample measurements to take.
		const samples = 10;
		// Number of throwaway measurements to perform before recording samples.
		// Having at least one helps ensure that caching quirks don't manifest in
		// the results.
		const throwaway = 1;
		const rounds = throwaway + samples;
		for ( let i = 0; i < rounds; i++ ) {
			const testPage = await browser.newPage();

			await testPage.goto( draftURL );
			await testPage
				.frameLocator( 'iframe[name="editor-canvas"]' )
				.locator( '.wp-block' )
				.first()
				.waitFor( {
					timeout: 120_000,
				} );

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
		await loadBlocksFromHtml(
			page,
			path.join( process.env.ASSETS_PATH, 'large-post.html' )
		);
		await editor.insertBlock( { name: 'core/paragraph' } );

		await browser.startTracing( page, {
			path: traceFilePath,
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

		await browser.stopTracing();

		const traceResults = JSON.parse( readFile( traceFilePath ) );
		const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
			getTypingEventDurations( traceResults );

		for ( let i = throwaway; i < rounds; i++ ) {
			results.type.push(
				keyDownEvents[ i ] + keyPressEvents[ i ] + keyUpEvents[ i ]
			);
		}
	} );

	test( 'Typing within containers', async ( { browser, page } ) => {
		await loadBlocksFromHtml(
			page,
			path.join(
				process.env.ASSETS_PATH,
				'small-post-with-containers.html'
			)
		);

		// Select the block where we type in
		await page
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.getByRole( 'document', { name: 'Paragraph block' } )
			.first()
			.click();

		await browser.startTracing( page, {
			path: traceFilePath,
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

		await browser.stopTracing();

		const traceResults = JSON.parse( readFile( traceFilePath ) );
		const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
			getTypingEventDurations( traceResults );

		for ( let i = throwaway; i < rounds; i++ ) {
			results.typeContainer.push(
				keyDownEvents[ i ] + keyPressEvents[ i ] + keyUpEvents[ i ]
			);
		}
	} );

	test( 'Selecting blocks', async ( { browser, page } ) => {
		await load1000Paragraphs( page );
		const paragraphs = page
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.locator( '.wp-block' );

		const samples = 10;
		const throwaway = 1;
		const rounds = samples + throwaway;
		for ( let i = 0; i < rounds; i++ ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( BROWSER_IDLE_WAIT );
			await browser.startTracing( page, {
				path: traceFilePath,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			await paragraphs.nth( i ).click();

			await browser.stopTracing();

			if ( i >= throwaway ) {
				const traceResults = JSON.parse( readFile( traceFilePath ) );
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
				path: traceFilePath,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			// Open List View
			await listViewToggle.click();

			await browser.stopTracing();

			if ( i >= throwaway ) {
				const traceResults = JSON.parse( readFile( traceFilePath ) );
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
				path: traceFilePath,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			// Open Inserter.
			await globalInserterToggle.click();

			await browser.stopTracing();

			if ( i >= throwaway ) {
				const traceResults = JSON.parse( readFile( traceFilePath ) );
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
				path: traceFilePath,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			await page.keyboard.type( 'p' );

			await browser.stopTracing();

			if ( i >= throwaway ) {
				const traceResults = JSON.parse( readFile( traceFilePath ) );
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
				path: traceFilePath,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			// Hover Items.
			await paragraphBlockItem.hover();
			await headingBlockItem.hover();

			await browser.stopTracing();

			if ( i >= throwaway ) {
				const traceResults = JSON.parse( readFile( traceFilePath ) );
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
