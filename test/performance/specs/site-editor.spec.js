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
	saveResultsFile,
	getTraceFilePath,
	getTypingEventDurations,
	getLoadingDurations,
	loadBlocksFromHtml,
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

	test( 'Loading', async ( { browser, page, admin } ) => {
		// Start a new page.
		await admin.createNewPost( { postType: 'page' } );

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

		// Get the ID of the saved page.
		testPageId = await page.evaluate( () =>
			new URL( document.location ).searchParams.get( 'post' )
		);

		// Open the test page in Site Editor.
		await admin.visitSiteEditor( {
			postId: testPageId,
			postType: 'page',
		} );

		// Get the URL that we will be testing against.
		const targetUrl = page.url();

		// Start the measurements.
		let i = 3;
		while ( i-- ) {
			// Open a fresh page in a new context to prevent caching.
			const testPage = await browser.newPage();

			// Go to the test page URL.
			await testPage.goto( targetUrl );

			// Wait for the canvas to appear.
			await testPage
				.locator( '.edit-site-canvas-spinner' )
				.waitFor( { state: 'hidden', timeout: 60_000 } );

			// Wait for the first block.
			await testPage
				.frameLocator( 'iframe[name="editor-canvas"]' )
				.locator( '.wp-block' )
				.first()
				.waitFor( { timeout: 60_000 } );

			// Save results.
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

			await testPage.close();
		}
	} );

	test( 'Typing', async ( { browser, page, pageUtils, admin } ) => {
		// Start a new page.
		await admin.createNewPost( { postType: 'page' } );

		// Turn the large post HTML into blocks and insert.
		await loadBlocksFromHtml(
			page,
			path.join( process.env.ASSETS_PATH, 'large-post.html' )
		);

		// Save the draft.
		await page
			.getByRole( 'button', { name: 'Save draft' } )
			// Loading the large post HTML can take some time so we need a higher
			// timeout value here.
			.click( { timeout: 60_000 } );
		await expect(
			page.getByRole( 'button', { name: 'Saved' } )
		).toBeDisabled();

		// Get the ID of the saved page.
		testPageId = await page.evaluate( () =>
			new URL( document.location ).searchParams.get( 'post' )
		);

		// Open the test page in Site Editor.
		await admin.visitSiteEditor( {
			postId: testPageId,
			postType: 'page',
		} );

		// Wait for the first paragraph to be ready.
		const canvas = page.frameLocator( 'iframe[name="editor-canvas"]' );
		const firstParagraph = canvas
			.getByText( 'Lorem ipsum dolor sit amet' )
			.first();
		await firstParagraph.waitFor( { timeout: 60_000 } );

		// Enter edit mode.
		await canvas.locator( 'body' ).click();

		// Insert a new paragraph right under the first one.
		await canvas
			.getByRole( 'document', { name: 'Block: Post Content' } )
			.click();
		await firstParagraph.click();
		await pageUtils.pressKeys( 'primary+a' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Enter' );

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
