/**
 * External dependencies
 */
import { basename, join } from 'path';
import { writeFileSync } from 'fs';

/**
 * WordPress dependencies
 */
import {
	trashAllPosts,
	activateTheme,
	canvas,
	createNewPost,
	saveDraft,
	insertBlock,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { siteEditor } from '../../experimental-features';
import { readFile, deleteFile, getTypingEventDurations } from './utils';

jest.setTimeout( 1000000 );

describe( 'Site Editor Performance', () => {
	beforeAll( async () => {
		await activateTheme( 'tt1-blocks' );
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template', 'auto-draft' );
		await trashAllPosts( 'wp_template_part' );
	} );
	afterAll( async () => {
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
		await activateTheme( 'twentytwentyone' );
	} );

	it( 'Loading', async () => {
		const results = {
			load: [],
			type: [],
			focus: [],
			inserterOpen: [],
			inserterHover: [],
		};

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

		const id = await page.evaluate( () =>
			new URL( document.location ).searchParams.get( 'post' )
		);

		await siteEditor.visit( { postId: id, postType: 'page' } );

		let i = 3;

		// Measuring loading time
		while ( i-- ) {
			const startTime = new Date();
			await page.reload();
			await page.waitForSelector( '.edit-site-visual-editor', {
				timeout: 120000,
			} );
			await canvas().waitForSelector( '.wp-block', { timeout: 120000 } );

			results.load.push( new Date() - startTime );
		}

		// Measuring typing performance inside the post content.
		await canvas().click(
			'[data-type="core/post-content"] [data-type="core/paragraph"]'
		);
		await insertBlock( 'Paragraph' );
		i = 200;
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
		const [
			keyDownEvents,
			keyPressEvents,
			keyUpEvents,
		] = getTypingEventDurations( traceResults );

		// Both keydown and keypress events are bubbled from the iframe to the
		// main frame, which must be ignored. These will be the odd values in
		// the array.
		const _keyDownEvents = keyDownEvents.filter(
			( v, ii ) => ii % 2 === 0
		);
		const _keyPressEvents = keyPressEvents.filter(
			( v, ii ) => ii % 2 === 0
		);

		expect(
			_keyDownEvents.length === _keyPressEvents.length &&
				_keyPressEvents.length === keyUpEvents.length
		).toBe( true );

		for ( let j = 0; j < _keyDownEvents.length; j++ ) {
			results.type.push(
				_keyDownEvents[ j ] + _keyPressEvents[ j ] + keyUpEvents[ j ]
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
