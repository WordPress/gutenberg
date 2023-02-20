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
		await deleteAllTemplates( 'wp_template' );
		await deleteAllTemplates( 'wp_template_part' );
		await activateTheme( 'twentytwentyone' );
	} );

	beforeEach( async () => {
		await visitSiteEditor( {
			postId: id,
			postType: 'page',
		} );
	} );

	it( 'Loading', async () => {
		const editorURL = await page.url();

		// Number of sample measurements to take.
		const samples = 3;
		// Number of throwaway measurements to perform before recording samples.
		// Having at least one helps ensure that caching quirks don't manifest in
		// the results.
		const throwaway = 1;

		let i = throwaway + samples;

		// Measuring loading time.
		while ( i-- ) {
			await page.close();
			page = await browser.newPage();

			await page.goto( editorURL );
			await page.waitForSelector( '.edit-site-visual-editor', {
				timeout: 120000,
			} );
			await canvas().waitForSelector( '.wp-block', { timeout: 120000 } );

			if ( i < samples ) {
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
		}
	} );

	it( 'Typing', async () => {
		await page.waitForSelector( '.edit-site-visual-editor', {
			timeout: 120000,
		} );
		await canvas().waitForSelector( '.wp-block', { timeout: 120000 } );

		// Measuring typing performance inside the post content.
		await canvas().waitForSelector(
			'[data-type="core/post-content"] [data-type="core/paragraph"]'
		);
		await enterEditMode();
		await canvas().click(
			'[data-type="core/post-content"] [data-type="core/paragraph"]'
		);
		await insertBlock( 'Paragraph' );
		let i = 200;
		const traceFile = __dirname + '/trace.json';
		await page.tracing.start( {
			path: traceFile,
			screenshots: false,
			categories: [ 'devtools.timeline' ],
		} );
		while ( i-- ) {
			await page.keyboard.type( 'x' );
		}
		await page.tracing.stop();
		const traceResults = JSON.parse( readFile( traceFile ) );
		const [ keyDownEvents, keyPressEvents, keyUpEvents ] =
			getTypingEventDurations( traceResults );

		for ( let j = 0; j < keyDownEvents.length; j++ ) {
			results.type.push(
				keyDownEvents[ j ] + keyPressEvents[ j ] + keyUpEvents[ j ]
			);
		}

		const resultsFilename = basename( __filename, '.js' ) + '.results.json';

		writeFileSync(
			join( __dirname, resultsFilename ),
			JSON.stringify( results, null, 2 )
		);

		deleteFile( traceFile );

		expect( true ).toBe( true );
	} );
} );
