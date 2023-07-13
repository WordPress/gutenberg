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
		const samples = 5;
		// Number of throwaway measurements to perform before recording samples.
		// Having at least one helps ensure that caching quirks don't manifest in
		// the results.
		const throwaway = 1;

		let i = throwaway + samples;
		while ( i-- ) {
			const testPage = await browser.newPage();

			await testPage.goto( draftURL );
			await testPage
				.frameLocator( 'iframe[name="editor-canvas"]' )
				.locator( '.wp-block' )
				.first()
				.waitFor( {
					timeout: 120_000,
				} );

			if ( i < samples ) {
				const {
					serverResponse,
					firstPaint,
					domContentLoaded,
					loaded,
					firstContentfulPaint,
					firstBlock,
				} = await getLoadingDurations( testPage );

				results.serverResponse.push( serverResponse );
				results.firstPaint.push( firstPaint );
				results.domContentLoaded.push( domContentLoaded );
				results.loaded.push( loaded );
				results.firstContentfulPaint.push( firstContentfulPaint );
				results.firstBlock.push( firstBlock );
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

		let i = 20;
		while ( i-- ) {
			// Wait for the browser to be idle before starting the monitoring.
			// The timeout should be big enough to allow all async tasks tor run.
			// And also to allow Rich Text to mark the change as persistent.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( 2000 );
			await page.keyboard.type( 'x' );
		}

		await browser.stopTracing();
		const traceResults = JSON.parse( readFile( traceFilePath ) );
		const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
			getTypingEventDurations( traceResults );
		if (
			keyDownEvents.length === keyPressEvents.length &&
			keyPressEvents.length === keyUpEvents.length
		) {
			// The first character typed triggers a longer time (isTyping change)
			// It can impact the stability of the metric, so we exclude it.
			for ( let j = 1; j < keyDownEvents.length; j++ ) {
				results.type.push(
					keyDownEvents[ j ] + keyPressEvents[ j ] + keyUpEvents[ j ]
				);
			}
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

		// Ignore firsted typed character because it's different
		// It probably deserves a dedicated metric.
		// (isTyping triggers so it's slower)
		await page.keyboard.type( 'x' );

		await browser.startTracing( page, {
			path: traceFilePath,
			screenshots: false,
			categories: [ 'devtools.timeline' ],
		} );

		let i = 10;
		while ( i-- ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( 500 );
			await page.keyboard.type( 'x' );
		}
		// eslint-disable-next-line no-restricted-syntax
		await page.waitForTimeout( 500 );
		await browser.stopTracing();
		const traceResults = JSON.parse( readFile( traceFilePath ) );
		const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
			getTypingEventDurations( traceResults );
		if (
			keyDownEvents.length === keyPressEvents.length &&
			keyPressEvents.length === keyUpEvents.length
		) {
			// The first character typed triggers a longer time (isTyping change)
			// It can impact the stability of the metric, so we exclude it.
			for ( let j = 1; j < keyDownEvents.length; j++ ) {
				results.typeContainer.push(
					keyDownEvents[ j ] + keyPressEvents[ j ] + keyUpEvents[ j ]
				);
			}
		}
	} );

	test( 'Selecting blocks', async ( { browser, page } ) => {
		await load1000Paragraphs( page );
		const paragraphs = page
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.locator( '.wp-block' );

		await paragraphs.first().click();

		for ( let j = 1; j <= 10; j++ ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( 1000 );
			await browser.startTracing( page, {
				path: traceFilePath,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			await paragraphs.nth( j ).click();

			await browser.stopTracing();
			const traceResults = JSON.parse( readFile( traceFilePath ) );
			const allDurations = getSelectionEventDurations( traceResults );
			results.focus.push(
				allDurations.reduce( ( acc, eventDurations ) => {
					return acc + sum( eventDurations );
				}, 0 )
			);
		}
	} );

	test( 'Opening persistent list view', async ( { browser, page } ) => {
		await load1000Paragraphs( page );
		const listViewToggle = page.getByRole( 'button', {
			name: 'Document Overview',
		} );

		for ( let j = 0; j < 10; j++ ) {
			await browser.startTracing( page, {
				path: traceFilePath,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			// Open List View
			await listViewToggle.click();

			await browser.stopTracing();
			const traceResults = JSON.parse( readFile( traceFilePath ) );
			const [ mouseClickEvents ] = getClickEventDurations( traceResults );
			for ( let k = 0; k < mouseClickEvents.length; k++ ) {
				results.listViewOpen.push( mouseClickEvents[ k ] );
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

		for ( let j = 0; j < 10; j++ ) {
			await browser.startTracing( page, {
				path: traceFilePath,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			// Open Inserter.
			await globalInserterToggle.click();

			await browser.stopTracing();
			const traceResults = JSON.parse( readFile( traceFilePath ) );
			const [ mouseClickEvents ] = getClickEventDurations( traceResults );
			for ( let k = 0; k < mouseClickEvents.length; k++ ) {
				results.inserterOpen.push( mouseClickEvents[ k ] );
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

		for ( let j = 0; j < 10; j++ ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( 500 );
			await browser.startTracing( page, {
				path: traceFilePath,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );
			await page.keyboard.type( 'p' );
			await browser.stopTracing();
			const traceResults = JSON.parse( readFile( traceFilePath ) );
			const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
				getTypingEventDurations( traceResults );
			if (
				keyDownEvents.length === keyPressEvents.length &&
				keyPressEvents.length === keyUpEvents.length
			) {
				results.inserterSearch.push(
					sum( keyDownEvents ) +
						sum( keyPressEvents ) +
						sum( keyUpEvents )
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

		// Hover Items.
		await paragraphBlockItem.hover();
		await headingBlockItem.hover();

		for ( let j = 0; j < 10; j++ ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( 200 );
			await browser.startTracing( page, {
				path: traceFilePath,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			// Hover Items.
			await paragraphBlockItem.hover();
			await headingBlockItem.hover();

			await browser.stopTracing();
			const traceResults = JSON.parse( readFile( traceFilePath ) );
			const [ mouseOverEvents, mouseOutEvents ] =
				getHoverEventDurations( traceResults );
			for ( let k = 0; k < mouseOverEvents.length; k++ ) {
				results.inserterHover.push(
					mouseOverEvents[ k ] + mouseOutEvents[ k ]
				);
			}
		}

		// Close Inserter.
		await globalInserterToggle.click();
	} );
} );
