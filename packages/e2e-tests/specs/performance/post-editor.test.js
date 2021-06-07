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
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	readFile,
	deleteFile,
	getClickEventDurations,
	getHoverEventDurations,
	getTypingEventDurations,
	getSelectionEventDurations,
	getLoadingDurations,
} from './utils';

jest.setTimeout( 1000000 );

describe( 'Post Editor Performance', () => {
	it( 'Loading, typing and selecting blocks', async () => {
		const results = {
			serverResponse: [],
			firstPaint: [],
			domContentLoaded: [],
			loaded: [],
			firstContentfulPaint: [],
			firstBlock: [],
			type: [],
			focus: [],
			inserterOpen: [],
			inserterHover: [],
		};

		const html = readFile(
			join( __dirname, '../../assets/large-post.html' )
		);

		await createNewPost();
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
		await saveDraft();

		let i = 5;

		// Measuring loading time
		while ( i-- ) {
			await page.reload();
			await page.waitForSelector( '.wp-block' );
			const {
				serverResponse,
				firstPaint,
				domContentLoaded,
				loaded,
				firstContentfulPaint,
				firstBlock,
			} = await getLoadingDurations();

			results.serverResponse.push( serverResponse );
			results.firstPaint.push( firstPaint );
			results.domContentLoaded.push( domContentLoaded );
			results.loaded.push( loaded );
			results.firstContentfulPaint.push( firstContentfulPaint );
			results.firstBlock.push( firstBlock );
		}

		// Measure time to open inserter
		await page.waitForSelector( '.edit-post-layout' );
		const traceFile = __dirname + '/trace.json';
		let traceResults;
		for ( let j = 0; j < 10; j++ ) {
			await page.tracing.start( {
				path: traceFile,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );
			await openGlobalBlockInserter();
			await page.tracing.stop();

			traceResults = JSON.parse( readFile( traceFile ) );
			const [ mouseClickEvents ] = getClickEventDurations( traceResults );
			for ( let k = 0; k < mouseClickEvents.length; k++ ) {
				results.inserterOpen.push( mouseClickEvents[ k ] );
			}
			await closeGlobalBlockInserter();
		}

		// Measure inserter hover performance
		const paragraphBlockItem =
			'.block-editor-inserter__menu .editor-block-list-item-paragraph';
		const headingBlockItem =
			'.block-editor-inserter__menu .editor-block-list-item-heading';
		await openGlobalBlockInserter();
		await page.waitForSelector( paragraphBlockItem );
		await page.hover( paragraphBlockItem );
		await page.hover( headingBlockItem );
		for ( let j = 0; j < 20; j++ ) {
			await page.tracing.start( {
				path: traceFile,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );
			await page.hover( paragraphBlockItem );
			await page.hover( headingBlockItem );
			await page.tracing.stop();

			traceResults = JSON.parse( readFile( traceFile ) );
			const [ mouseOverEvents, mouseOutEvents ] = getHoverEventDurations(
				traceResults
			);
			for ( let k = 0; k < mouseOverEvents.length; k++ ) {
				results.inserterHover.push(
					mouseOverEvents[ k ] + mouseOutEvents[ k ]
				);
			}
		}
		await closeGlobalBlockInserter();

		// Measuring typing performance
		await insertBlock( 'Paragraph' );
		i = 200;
		await page.tracing.start( {
			path: traceFile,
			screenshots: false,
			categories: [ 'devtools.timeline' ],
		} );
		while ( i-- ) {
			await page.keyboard.type( 'x' );
		}

		await page.tracing.stop();
		traceResults = JSON.parse( readFile( traceFile ) );
		const [
			keyDownEvents,
			keyPressEvents,
			keyUpEvents,
		] = getTypingEventDurations( traceResults );

		if (
			keyDownEvents.length === keyPressEvents.length &&
			keyPressEvents.length === keyUpEvents.length
		) {
			for ( let j = 0; j < keyDownEvents.length; j++ ) {
				results.type.push(
					keyDownEvents[ j ] + keyPressEvents[ j ] + keyUpEvents[ j ]
				);
			}
		}

		// Measuring block selection performance
		await createNewPost();
		await page.evaluate( () => {
			const { createBlock } = window.wp.blocks;
			const { dispatch } = window.wp.data;
			const blocks = window.lodash
				.times( 1000 )
				.map( () => createBlock( 'core/paragraph' ) );
			dispatch( 'core/block-editor' ).resetBlocks( blocks );
		} );

		const paragraphs = await page.$$( '.wp-block' );

		await page.tracing.start( {
			path: traceFile,
			screenshots: false,
			categories: [ 'devtools.timeline' ],
		} );
		for ( let j = 0; j < 10; j++ ) {
			await paragraphs[ j ].click();
		}

		await page.tracing.stop();

		traceResults = JSON.parse( readFile( traceFile ) );
		const [ focusEvents ] = getSelectionEventDurations( traceResults );
		results.focus = focusEvents;

		const resultsFilename = basename( __filename, '.js' ) + '.results.json';

		writeFileSync(
			join( __dirname, resultsFilename ),
			JSON.stringify( results, null, 2 )
		);

		deleteFile( traceFile );

		expect( true ).toBe( true );
	} );
} );
