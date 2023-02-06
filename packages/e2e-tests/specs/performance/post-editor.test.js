/**
 * External dependencies
 */
import { basename, join } from 'path';
import { writeFileSync } from 'fs';

/**
 * WordPress dependencies
 */
import {
	createNewPost,
	saveDraft,
	insertBlock,
	openGlobalBlockInserter,
	closeGlobalBlockInserter,
	openListView,
	closeListView,
	canvas,
} from '@wordpress/e2e-test-utils';

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
} from './utils';

const performance = require( 'perf_hooks' ).performance;
jest.setTimeout( 1000000 );

async function loadHtmlIntoTheBlockEditor( html ) {
	await page.evaluate( ( _html ) => {
		const { parse } = window.wp.blocks;
		const { dispatch } = window.wp.data;
		const blocks = parse( _html );

		blocks.forEach( ( block ) => {
			if ( block.name === 'core/image' ) {
				delete block.attributes.id;
				delete block.attributes.url;
			}
		} );

		dispatch( 'core/block-editor' ).resetBlocks( blocks );
	}, html );
}

async function load1000Paragraphs() {
	await page.evaluate( () => {
		const { createBlock } = window.wp.blocks;
		const { dispatch } = window.wp.data;
		const blocks = Array.from( { length: 1000 } ).map( () =>
			createBlock( 'core/paragraph' )
		);
		dispatch( 'core/block-editor' ).resetBlocks( blocks );
	} );
}

describe( 'Post Editor Performance', () => {
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
	const traceFile = __dirname + '/trace.json';
	let traceResults;

	afterAll( async () => {
		const resultsFilename = basename( __filename, '.js' ) + '.results.json';
		writeFileSync(
			join( __dirname, resultsFilename ),
			JSON.stringify( results, null, 2 )
		);
		deleteFile( traceFile );
	} );

	beforeEach( async () => {
		await createNewPost();
		// Disable auto-save to avoid impacting the metrics.
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/editor' ).updateEditorSettings( {
				autosaveInterval: 100000000000,
				localAutosaveInterval: 100000000000,
			} );
		} );
	} );

	it( 'Loading', async () => {
		await loadHtmlIntoTheBlockEditor(
			readFile( join( __dirname, '../../assets/large-post.html' ) )
		);
		await saveDraft();
		let i = 5;
		while ( i-- ) {
			await page.reload();
			await page.waitForSelector( '.edit-post-layout', {
				timeout: 120000,
			} );
			await canvas().waitForSelector( '.wp-block', { timeout: 120000 } );
			// const {
			// 	serverResponse,
			// 	firstPaint,
			// 	domContentLoaded,
			// 	loaded,
			// 	firstContentfulPaint,
			// 	firstBlock,
			// } = await getLoadingDurations();
			//
			// results.serverResponse.push( serverResponse );
			// results.firstPaint.push( firstPaint );
			// results.domContentLoaded.push( domContentLoaded );
			// results.loaded.push( loaded );
			// results.firstContentfulPaint.push( firstContentfulPaint );
			// results.firstBlock.push( firstBlock );
			results.serverResponse.push( [ 1 ] );
			results.firstPaint.push( [ 1 ] );
			results.domContentLoaded.push( [ 1 ] );
			results.loaded.push( [ 1 ] );
			results.firstContentfulPaint.push( [ 1 ] );
			results.firstBlock.push( [ 1 ] );
		}
	} );

	it( 'Typing', async () => {
		await loadHtmlIntoTheBlockEditor(
			readFile( join( __dirname, '../../assets/large-post.html' ) )
		);
		await insertBlock( 'Paragraph' );
		let i = 20;
		// await page.tracing.start( {
		// 	path: traceFile,
		// 	screenshots: false,
		// 	categories: [ 'devtools.timeline' ],
		// } );
		const tic = performance.now();
		while ( i-- ) {
			// Wait for the browser to be idle before starting the monitoring.
			// The timeout should be big enough to allow all async tasks tor run.
			// And also to allow Rich Text to mark the change as persistent.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( 2000 );
			await page.keyboard.type( 'x' );
		}
		const toc = performance.now();
		// await page.tracing.stop();
		// traceResults = JSON.parse( readFile( traceFile ) );
		// const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
		// 	getTypingEventDurations( traceResults );
		// if (
		// 	keyDownEvents.length === keyPressEvents.length &&
		// 	keyPressEvents.length === keyUpEvents.length
		// ) {
		// 	// The first character typed triggers a longer time (isTyping change)
		// 	// It can impact the stability of the metric, so we exclude it.
		// 	for ( let j = 1; j < keyDownEvents.length; j++ ) {
		// 		results.type.push(
		// 			keyDownEvents[ j ] + keyPressEvents[ j ] + keyUpEvents[ j ]
		// 		);
		// 	}
		// }
		results.type.push( ( toc - tic ) / 20 );
	} );

	it( 'Typing within containers', async () => {
		await loadHtmlIntoTheBlockEditor(
			readFile(
				join(
					__dirname,
					'../../assets/small-post-with-containers.html'
				)
			)
		);
		// Select the block where we type in
		await canvas().waitForSelector( 'p[aria-label="Paragraph block"]' );
		await canvas().click( 'p[aria-label="Paragraph block"]' );
		// Ignore firsted typed character because it's different
		// It probably deserves a dedicated metric.
		// (isTyping triggers so it's slower)
		await page.keyboard.type( 'x' );

		let i = 10;
		// await page.tracing.start( {
		// 	path: traceFile,
		// 	screenshots: false,
		// 	categories: [ 'devtools.timeline' ],
		// } );

		const tic = performance.now();
		while ( i-- ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( 500 );
			await page.keyboard.type( 'x' );
		}
		// eslint-disable-next-line no-restricted-syntax
		await page.waitForTimeout( 500 );
		const toc = performance.now();
		// await page.tracing.stop();
		// traceResults = JSON.parse( readFile( traceFile ) );
		// const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
		// 	getTypingEventDurations( traceResults );
		// if (
		// 	keyDownEvents.length === keyPressEvents.length &&
		// 	keyPressEvents.length === keyUpEvents.length
		// ) {
		// 	// The first character typed triggers a longer time (isTyping change)
		// 	// It can impact the stability of the metric, so we exclude it.
		// 	for ( let j = 1; j < keyDownEvents.length; j++ ) {
		// 		results.typeContainer.push(
		// 			keyDownEvents[ j ] + keyPressEvents[ j ] + keyUpEvents[ j ]
		// 		);
		// 	}
		// }
		results.typeContainer.push( ( toc - tic ) / 10 );
	} );

	it( 'Selecting blocks', async () => {
		await load1000Paragraphs();
		const paragraphs = await canvas().$$( '.wp-block' );
		// await page.tracing.start( {
		// 	path: traceFile,
		// 	screenshots: false,
		// 	categories: [ 'devtools.timeline' ],
		// } );
		const tic = performance.now();
		await paragraphs[ 0 ].click();
		for ( let j = 1; j <= 10; j++ ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( 1000 );
			await paragraphs[ j ].click();
		}
		const toc = performance.now();
		// await page.tracing.stop();
		// traceResults = JSON.parse( readFile( traceFile ) );
		// const [ focusEvents ] = getSelectionEventDurations( traceResults );
		// results.focus = focusEvents;
		results.focus = [ ( toc - tic ) / 10 ];
	} );

	it( 'Opening persistent list view', async () => {
		await load1000Paragraphs();
		for ( let j = 0; j < 10; j++ ) {
			// await page.tracing.start( {
			// 	path: traceFile,
			// 	screenshots: false,
			// 	categories: [ 'devtools.timeline' ],
			// } );
			const tic = performance.now();
			await openListView();
			const toc = performance.now();
			// await page.tracing.stop();
			// traceResults = JSON.parse( readFile( traceFile ) );
			// const [ mouseClickEvents ] = getClickEventDurations( traceResults );
			// for ( let k = 0; k < mouseClickEvents.length; k++ ) {
			// 	results.listViewOpen.push( mouseClickEvents[ k ] );
			// }
			await closeListView();
			results.listViewOpen.push( toc - tic );
		}
	} );

	it( 'Opening the inserter', async () => {
		await load1000Paragraphs();
		for ( let j = 0; j < 10; j++ ) {
			// await page.tracing.start( {
			// 	path: traceFile,
			// 	screenshots: false,
			// 	categories: [ 'devtools.timeline' ],
			// } );
			const tic = performance.now();
			await openGlobalBlockInserter();
			const toc = performance.now();
			// await page.tracing.stop();
			// traceResults = JSON.parse( readFile( traceFile ) );
			// const [ mouseClickEvents ] = getClickEventDurations( traceResults );
			// for ( let k = 0; k < mouseClickEvents.length; k++ ) {
			// 	results.inserterOpen.push( mouseClickEvents[ k ] );
			// }
			await closeGlobalBlockInserter();
			results.inserterOpen.push( toc - tic );
		}
	} );

	it( 'Searching the inserter', async () => {
		function sum( arr ) {
			return arr.reduce( ( a, b ) => a + b, 0 );
		}
		await load1000Paragraphs();
		await openGlobalBlockInserter();
		for ( let j = 0; j < 10; j++ ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( 500 );
			// await page.tracing.start( {
			// 	path: traceFile,
			// 	screenshots: false,
			// 	categories: [ 'devtools.timeline' ],
			// } );
			const tic = performance.now();
			await page.keyboard.type( 'p' );
			const toc = performance.now();
			// await page.tracing.stop();
			// traceResults = JSON.parse( readFile( traceFile ) );
			// const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
			// 	getTypingEventDurations( traceResults );
			// if (
			// 	keyDownEvents.length === keyPressEvents.length &&
			// 	keyPressEvents.length === keyUpEvents.length
			// ) {
			// 	results.inserterSearch.push(
			// 		sum( keyDownEvents ) +
			// 			sum( keyPressEvents ) +
			// 			sum( keyUpEvents )
			// 	);
			// }
			await page.keyboard.press( 'Backspace' );
			results.inserterSearch.push( toc - tic );
		}
		await closeGlobalBlockInserter();
	} );

	it( 'Hovering Inserter Items', async () => {
		await load1000Paragraphs();
		const paragraphBlockItem =
			'.block-editor-inserter__menu .editor-block-list-item-paragraph';
		const headingBlockItem =
			'.block-editor-inserter__menu .editor-block-list-item-heading';
		await openGlobalBlockInserter();
		await page.waitForSelector( paragraphBlockItem );
		await page.hover( paragraphBlockItem );
		await page.hover( headingBlockItem );
		for ( let j = 0; j < 10; j++ ) {
			// Wait for the browser to be idle before starting the monitoring.
			// eslint-disable-next-line no-restricted-syntax
			await page.waitForTimeout( 200 );
			// await page.tracing.start( {
			// 	path: traceFile,
			// 	screenshots: false,
			// 	categories: [ 'devtools.timeline' ],
			// } );
			const tic = performance.now();
			await page.hover( paragraphBlockItem );
			await page.hover( headingBlockItem );
			// await page.tracing.stop();
			const toc = performance.now();

			// traceResults = JSON.parse( readFile( traceFile ) );
			// const [ mouseOverEvents, mouseOutEvents ] =
			// 	getHoverEventDurations( traceResults );
			// for ( let k = 0; k < mouseOverEvents.length; k++ ) {
			// 	results.inserterHover.push(
			// 		mouseOverEvents[ k ] + mouseOutEvents[ k ]
			// 	);
			// }
			results.inserterHover.push( toc - tic );
		}
		await closeGlobalBlockInserter();
	} );
} );
