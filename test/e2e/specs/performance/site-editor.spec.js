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
	saveResultsFile,
	getTraceFilePath,
	getTypingEventDurations,
	getLoadingDurations,
	loadBlocksFromHtml,
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
	inserterOpen: [],
	inserterHover: [],
	inserterSearch: [],
	listViewOpen: [],
};

let testPageId;

test.describe( 'Site Editor Performance', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		saveResultsFile( __filename, results );

		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	// This can't be done in the beforeAll hook because the page object is not
	// available there, as it's created on a per-test basis.
	test( 'Create the test page', async ( { page, admin } ) => {
		// Start a new page.
		await admin.createNewPost( { postType: 'page' } );

		// Turn the large post HTML into blocks and insert.
		await loadBlocksFromHtml(
			page,
			path.join( __dirname, '../../assets/large-post.html' )
		);

		// Save the page draft.
		await page
			.getByRole( 'button', { name: 'Save draft' } )
			.click( { timeout: 60_000 } );
		await expect(
			page.getByRole( 'button', { name: 'Saved' } )
		).toBeDisabled();

		// Get the ID of the saved page.
		testPageId = await page.evaluate( () =>
			new URL( document.location ).searchParams.get( 'post' )
		);
	} );

	// Number of loading measurements to take.
	const loadingSamples = 3;
	// Number of throwaway measurements to perform before recording samples.
	// Having at least one helps ensure that caching quirks don't manifest
	// in the results.
	const loadingSamplesThrowaway = 1;
	const loadingIterations = loadingSamples + loadingSamplesThrowaway;

	for ( let i = 1; i <= loadingIterations; i++ ) {
		test( `Loading (${ i } of ${ loadingIterations })`, async ( {
			page,
			admin,
			editor,
		} ) => {
			// Open the test page in Site Editor.
			await admin.visitSiteEditor( {
				postId: testPageId,
				postType: 'page',
			} );

			// Wait for the first block.
			await editor.canvas
				.locator( '.wp-block' )
				.first()
				.waitFor( { timeout: 60_000 } );

			// Save results.
			if ( i > loadingSamplesThrowaway ) {
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
	}

	test( 'Typing', async ( { browser, page, admin, editor } ) => {
		// Open the test page in Site Editor.
		await admin.visitSiteEditor( {
			postId: testPageId,
			postType: 'page',
		} );

		// Wait for the first paragraph to be ready.
		const firstParagraph = editor.canvas
			.getByText( 'Lorem ipsum dolor sit amet' )
			.first();
		await firstParagraph.waitFor( { timeout: 60_000 } );

		// Enter edit mode.
		await editor.canvas.click( 'body' );

		// Insert a new paragraph right under the first one.
		await firstParagraph.focus();
		await editor.insertBlock( { name: 'core/paragraph' } );

		// Start tracing.
		const traceFilePath = getTraceFilePath();
		await browser.startTracing( page, {
			path: traceFilePath,
			screenshots: false,
			categories: [ 'devtools.timeline' ],
		} );

		// Type "x" 200 times.
		const typingSequence = new Array( 200 ).fill( 'x' ).join( '' );
		await page.keyboard.type( typingSequence );

		// Stop tracing and save results.
		await browser.stopTracing();
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
	} );
} );
