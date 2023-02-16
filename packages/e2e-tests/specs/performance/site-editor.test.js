/**
 * External dependencies
 */
import { basename, join } from 'path';
import { writeFileSync } from 'fs';

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
	getTypingEventDurations,
	getLoadingDurations,
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

let id;

describe( 'Site Editor Performance', () => {
	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
		await deleteAllTemplates( 'wp_template' );
		await deleteAllTemplates( 'wp_template_part' );

		const html = readFile(
			join( __dirname, '../../assets/large-post.html' )
		);

		await createNewPost( { postType: 'page' } );
		await page.keyboard.type( 'Site Editor Performance Tests' );

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

		id = await page.evaluate( () =>
			new URL( document.location ).searchParams.get( 'post' )
		);
	} );

	afterAll( async () => {
		const resultsFilename = basename( __filename, '.js' ) + '.results.json';
		writeFileSync(
			join( __dirname, resultsFilename ),
			JSON.stringify( results, null, 2 )
		);

		await deleteAllTemplates( 'wp_template' );
		await deleteAllTemplates( 'wp_template_part' );
		await activateTheme( 'twentytwentyone' );
	} );

	beforeEach( async () => {
		await visitSiteEditor( {
			postId: id,
			postType: 'page',
		} );

		// Wait for the canvas to become actionable.
		await canvas().waitForSelector(
			'[data-rich-text-placeholder="Write site tagline…"]'
		);
	} );

	describe( 'Loading', () => {
		// Number of measurements to take.
		const samples = 3;
		// Number of throwaway measurements to perform before recording samples.
		// Having at least one helps ensure that caching quirks don't manifest
		// in the results.
		const throwaway = 1;
		const iterations = Array.from(
			{ length: samples + throwaway },
			( _, i ) => i + 1
		);

		it.each( iterations )(
			`iteration %i of ${ iterations.length }`,
			async ( i ) => {
				if ( i > 1 ) {
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
	} );

	describe( 'Typing', () => {
		it( 'trace 200 characters typing sequence', async () => {
			// Measure typing performance inside the post content.
			await enterEditMode();

			// Insert a new paragraph right after the first one.
			const targetParagraph = await canvas().waitForXPath(
				'//p[contains(text(), "Lorem ipsum dolor sit amet")]'
			);
			// The second click is needed to get the cursor inside the target
			// paragraph.
			await targetParagraph.click();
			await targetParagraph.click();
			await insertBlock( 'Paragraph' );

			// Start tracing.
			const traceFile = __dirname + '/trace.json';
			await page.tracing.start( {
				path: traceFile,
				screenshots: false,
				categories: [ 'devtools.timeline' ],
			} );

			// Type "x" 200 times.
			await page.keyboard.type( new Array( 200 ).fill( 'x' ).join( '' ) );

			// Stop tracing and save results.
			await page.tracing.stop();
			const traceResults = JSON.parse( readFile( traceFile ) );
			const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
				getTypingEventDurations( traceResults );
			for ( let i = 0; i < keyDownEvents.length; i++ ) {
				results.type.push(
					keyDownEvents[ i ] + keyPressEvents[ i ] + keyUpEvents[ i ]
				);
			}

			// Delete the original trace file.
			deleteFile( traceFile );

			expect( true ).toBe( true );
		} );
	} );
} );
