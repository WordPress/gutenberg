/**
 * External dependencies
 */
import path from 'path';

/**
 * WordPress dependencies
 */
import {
	activateTheme,
	canvas,
	createNewPost,
	visitSiteEditor,
	saveDraft,
	insertBlock,
	deleteAllTemplates,
	enterEditMode,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	readFile,
	deleteFile,
	saveResultsFile,
	getTraceFilePath,
	getTypingEventDurations,
	getLoadingDurations,
	sequence,
} from './utils';

jest.setTimeout( 1000000 );

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
	inserterOpen: [],
	inserterHover: [],
	inserterSearch: [],
	listViewOpen: [],
};

let postId;

describe( 'Site Editor Performance', () => {
	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
		await deleteAllTemplates( 'wp_template' );
		await deleteAllTemplates( 'wp_template_part' );

		const html = readFile(
			path.join( __dirname, '../../assets/large-post.html' )
		);

		await createNewPost( { postType: 'page' } );

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

		postId = await page.evaluate( () =>
			new URL( document.location ).searchParams.get( 'post' )
		);
	} );

	afterAll( async () => {
		saveResultsFile( __filename, results );
		await deleteAllTemplates( 'wp_template' );
		await deleteAllTemplates( 'wp_template_part' );
	} );

	// Number of loading measurements to take.
	const loadingSamples = 3;
	// Number of throwaway measurements to perform before recording samples.
	// Having at least one helps ensure that caching quirks don't manifest
	// in the results.
	const loadingSamplesThrowaway = 1;
	const loadingIterations = sequence(
		1,
		loadingSamples + loadingSamplesThrowaway
	);
	it.each( loadingIterations )(
		`Loading (%i of ${ loadingIterations.length })`,
		async ( i ) => {
			// Open the test page in Site Editor.
			await visitSiteEditor( {
				postId,
				postType: 'page',
			} );

			// Wait for the first block.
			await canvas().waitForSelector( '.wp-block' );

			// Save results.
			if ( i > loadingSamplesThrowaway ) {
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

			expect( true ).toBe( true );
		}
	);

	it( 'Typing', async () => {
		// Open the test page in Site Editor.
		await visitSiteEditor( {
			postId,
			postType: 'page',
		} );

		// Wait for the first block to be ready.
		await canvas().waitForSelector( '.wp-block' );

		// Get inside the post content.
		await enterEditMode();

		// Select the post content block wrapper.
		await canvas().click( '.wp-block-post-content' );

		// Select the first paragraph in the post content block.
		const firstParagraph = await canvas().waitForXPath(
			'//p[contains(text(), "Lorem ipsum dolor sit amet")]'
		);
		await firstParagraph.click();

		await insertBlock( 'Paragraph' );

		// Start tracing.
		const traceFilePath = getTraceFilePath();
		await page.tracing.start( {
			path: traceFilePath,
			screenshots: false,
			categories: [ 'devtools.timeline' ],
		} );

		// Type "x" 200 times.
		await page.keyboard.type( new Array( 200 ).fill( 'x' ).join( '' ) );

		// Stop tracing and save results.
		await page.tracing.stop();
		const traceResults = JSON.parse( readFile( traceFilePath ) );
		const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
			getTypingEventDurations( traceResults );
		for ( let i = 0; i < keyDownEvents.length; i++ ) {
			results.type.push(
				keyDownEvents[ i ] + keyPressEvents[ i ] + keyUpEvents[ i ]
			);
		}

		// Delete the original trace file.
		deleteFile( traceFilePath );

		expect( true ).toBe( true );
	} );
} );
