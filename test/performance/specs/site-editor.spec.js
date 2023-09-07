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
	getLoadingDurations,
	loadBlocksFromHtml,
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

	test.afterAll( async ( { requestUtils }, testInfo ) => {
		await testInfo.attach( 'results', {
			body: JSON.stringify( results, null, 2 ),
			contentType: 'application/json',
		} );

		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin, page } ) => {
		// Start a new page.
		await admin.createNewPost( { postType: 'page' } );

		// Disable auto-save to avoid impacting the metrics.
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/editor' ).updateEditorSettings( {
				autosaveInterval: 100000000000,
				localAutosaveInterval: 100000000000,
			} );
		} );
	} );

	test( 'Loading', async ( { browser, page, admin } ) => {
		// Load the large post fixture.
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
		testPageId = new URL( page.url() ).searchParams.get( 'post' );

		// Open the test page in Site Editor.
		await admin.visitSiteEditor( {
			postId: testPageId,
			postType: 'page',
		} );

		// Get the URL that we will be testing against.
		const draftURL = page.url();

		// Start the measurements.
		const samples = 10;
		const throwaway = 1;
		const rounds = samples + throwaway;
		for ( let i = 0; i < rounds; i++ ) {
			// Open a fresh page in a new context to prevent caching.
			const testPage = await browser.newPage();

			// Go to the test page URL.
			await testPage.goto( draftURL );

			// Wait for the first block.
			await testPage
				.frameLocator( 'iframe[name="editor-canvas"]' )
				.locator( '.wp-block' )
				.first()
				.waitFor( { timeout: 120_000 } );

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

	test( 'Typing', async ( { browser, page, admin } ) => {
		// Load the large post fixture.
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
		testPageId = new URL( page.url() ).searchParams.get( 'post' );

		// Open the test page in Site Editor.
		await admin.visitSiteEditor( {
			postId: testPageId,
			postType: 'page',
		} );

		const canvas = page.frameLocator( 'iframe[name="editor-canvas"]' );

		// Enter edit mode.
		await canvas.locator( 'body' ).click( { timeout: 120_000 } );
		const postContent = canvas.getByRole( 'document', {
			name: /Block:( Post)? Content/,
		} );
		// Second (content) click is needed to enter the legacy edit mode.
		await postContent.click();

		// Append an empty paragraph to the end of the post content.
		// Since `editor.insertBlock( { name: 'core/paragraph' } )` is not
		// working in Site Editor, we need to _manually_ insert a new paragraph.
		await canvas
			.getByText( 'Quamquam tu hanc copiosiorem etiam soles dicere.' )
			.last()
			.selectText(); // Enter edit mode and select the text.
		await page.keyboard.press( 'ArrowRight' ); // Move the cursor to the end.
		await page.keyboard.press( 'Enter' ); // Create a new list item.
		await page.keyboard.press( 'Enter' ); // Exit the list and create a new paragraph.

		const emptyBlock = canvas.getByRole( 'document', {
			name: /Empty block/,
		} );

		await expect( emptyBlock ).toBeFocused();

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
		const testString = 'x'.repeat( rounds );

		// Type the testing sequence into the empty paragraph.
		await emptyBlock.type( testString, {
			delay: BROWSER_IDLE_WAIT,
			// The extended timeout is needed because the typing is very slow
			// and the `delay` value itself does not extend it.
			timeout: testString.length * BROWSER_IDLE_WAIT * 2, // 2x the total time to be safe.
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

		// Ensure that it's the last canvas element that contains the test string.
		await expect(
			canvas.locator( '[contenteditable="true"]' ).last()
		).toHaveText( testString );
	} );
} );
