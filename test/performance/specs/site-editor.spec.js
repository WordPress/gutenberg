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
	disableAutosave,
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

	test.describe( 'Loading', () => {
		let draftURL = null;

		test( 'Setup the test page', async ( { page, admin } ) => {
			// Load the large post fixture.
			await admin.createNewPost( { postType: 'page' } );
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
			const testPageId = new URL( page.url() ).searchParams.get( 'post' );

			// Open the test page in Site Editor.
			await admin.visitSiteEditor( {
				postId: testPageId,
				postType: 'page',
			} );

			// Get the URL that we will be testing against.
			draftURL = page.url();
		} );

		const samples = 10;
		const throwaway = 1;
		const rounds = samples + throwaway;
		for ( let i = 0; i < rounds; i++ ) {
			test( `Get the durations (${ i + 1 } of ${ rounds })`, async ( {
				page,
				editor,
			} ) => {
				// Go to the test page.
				await page.goto( draftURL );

				// Wait for the editor canvas.
				await page
					.frameLocator( '[name=editor-canvas]' )
					.locator( 'body' )
					.waitFor();

				// Wait for the first block to be ready.
				await editor.canvas.locator( '.wp-block' ).first().waitFor( {
					timeout: 120_000,
				} );

				// Get the durations.
				if ( i >= throwaway ) {
					const loadingDurations = await getLoadingDurations( page );
					Object.entries( loadingDurations ).forEach(
						( [ metric, duration ] ) => {
							results[ metric ].push( duration );
						}
					);
				}
			} );
		}
	} );

	test( 'Typing', async ( { browser, page, admin, editor } ) => {
		// Load the large post fixture.
		await admin.createNewPost( { postType: 'page' } );
		await disableAutosave( page );
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
		const testPageId = new URL( page.url() ).searchParams.get( 'post' );

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
		await editor.canvas.locator( 'body' ).click();
		// Second click is needed for the legacy edit mode.
		await editor.canvas
			.getByRole( 'document', { name: /Block:( Post)? Content/ } )
			.click();

		// Append an empty paragraph.
		// Since `editor.insertBlock( { name: 'core/paragraph' } )` is not
		// working in page edit mode, we need to _manually_ insert a new
		// paragraph.
		await editor.canvas
			.getByText( 'Quamquam tu hanc copiosiorem etiam soles dicere.' )
			.last()
			.click(); // Enters edit mode for the last post's element, which is a list item.

		await page.keyboard.press( 'Enter' ); // Creates a new list item.
		await page.keyboard.press( 'Enter' ); // Exits the list and creates a new paragraph.

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
} );
