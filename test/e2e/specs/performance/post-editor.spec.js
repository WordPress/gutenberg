/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * External dependencies
 */
import path from 'path';

/**
 * Internal dependencies
 */
import {
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
} from './utils';

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

	test( 'Loading', async ( { page, editor } ) => {
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

		let i = 5;
		while ( i-- ) {
			await page.reload();
			await editor.canvas.locator( '.wp-block' ).first().waitFor( {
				timeout: 120_000,
			} );
			const {
				serverResponse,
				firstPaint,
				domContentLoaded,
				loaded,
				firstContentfulPaint,
				firstBlock,
			} = await getLoadingDurations( page );

			results.serverResponse.push( serverResponse );
			results.firstPaint.push( firstPaint );
			results.domContentLoaded.push( domContentLoaded );
			results.loaded.push( loaded );
			results.firstContentfulPaint.push( firstContentfulPaint );
			results.firstBlock.push( firstBlock );
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
		// Ignore firsted typed character because it's different
		// It probably deserves a dedicated metric.
		// (isTyping triggers so it's slower)
		await page.keyboard.type( 'x' );

		let i = 10;
		await browser.startTracing( page, {
			path: traceFilePath,
			screenshots: false,
			categories: [ 'devtools.timeline' ],
		} );

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

	test( 'Selecting blocks', async ( { browser, page, editor } ) => {
		await load1000Paragraphs( page );

		const paragraphs = editor.canvas.locator( '.wp-block' );

		await browser.startTracing( page, {
			path: traceFilePath,
			screenshots: false,
			categories: [ 'devtools.timeline' ],
		} );

		await paragraphs.first().click();
		for ( let j = 1; j <= 10; j++ ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( 1000 );
			await paragraphs.nth( j ).click();
		}

		await browser.stopTracing();
		const traceResults = JSON.parse( readFile( traceFilePath ) );
		const [ focusEvents ] = getSelectionEventDurations( traceResults );
		results.focus = focusEvents;
	} );

	test( 'Opening persistent list view', async ( {
		browser,
		page,
		pageUtils,
	} ) => {
		await load1000Paragraphs( page );

		for ( let j = 0; j < 10; j++ ) {
			await browser.startTracing( page, {
				path: traceFilePath,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );
			await openListView( pageUtils );
			await browser.stopTracing();
			const traceResults = JSON.parse( readFile( traceFilePath ) );
			const [ mouseClickEvents ] = getClickEventDurations( traceResults );
			for ( let k = 0; k < mouseClickEvents.length; k++ ) {
				results.listViewOpen.push( mouseClickEvents[ k ] );
			}
		}
	} );

	test( 'Opening the inserter', async ( { browser, page } ) => {
		await load1000Paragraphs( page );
		for ( let j = 0; j < 10; j++ ) {
			await browser.startTracing( page, {
				path: traceFilePath,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );
			await openGlobalBlockInserter( page );
			await browser.stopTracing();
			const traceResults = JSON.parse( readFile( traceFilePath ) );
			const [ mouseClickEvents ] = getClickEventDurations( traceResults );
			for ( let k = 0; k < mouseClickEvents.length; k++ ) {
				results.inserterOpen.push( mouseClickEvents[ k ] );
			}
		}
	} );

	test( 'Searching the inserter', async ( { browser, page } ) => {
		await load1000Paragraphs( page );
		await openGlobalBlockInserter( page );
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
	} );

	test( 'Hovering Inserter Items', async ( { browser, page } ) => {
		await load1000Paragraphs( page );
		const paragraphBlockItem =
			'.block-editor-inserter__menu .editor-block-list-item-paragraph';
		const headingBlockItem =
			'.block-editor-inserter__menu .editor-block-list-item-heading';
		await openGlobalBlockInserter( page );
		await page.hover( paragraphBlockItem );
		await page.hover( headingBlockItem );
		for ( let j = 0; j < 10; j++ ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( 200 );
			await browser.startTracing( page, {
				path: traceFilePath,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );
			await page.hover( paragraphBlockItem );
			await page.hover( headingBlockItem );
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
	} );
} );

async function openGlobalBlockInserter( page ) {
	await page
		.getByRole( 'button', {
			name: 'Toggle block inserter',
		} )
		.click();
}

async function openListView( pageUtils ) {
	await pageUtils.pressKeys( 'access+o' );
}
