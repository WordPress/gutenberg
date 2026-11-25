/**
 * Suggestion mode with real-time collaboration peers (#73411): two people
 * suggest deleting overlapping words at the same time. Both deletions land
 * on the shared words, the text stays intact, and the peers settle on one
 * value.
 */
import type { Page } from '@playwright/test';
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';
import { test, expect } from './fixtures';

const SUGGESTION_EXPERIMENT = 'gutenberg-suggestion-mode';
const TEXT = 'The quick brown fox jumps.';

/*
 * Toggles the Suggestion mode experiment without touching the collaboration
 * experiment the fixture manages.
 */
async function setSuggestionExperiment(
	requestUtils: RequestUtils,
	enabled: boolean
) {
	const settings = await requestUtils.rest< {
		'gutenberg-experiments'?: Record< string, boolean >;
	} >( { path: '/wp/v2/settings' } );
	const experiments = { ...( settings[ 'gutenberg-experiments' ] || {} ) };
	if ( enabled ) {
		experiments[ SUGGESTION_EXPERIMENT ] = true;
	} else {
		delete experiments[ SUGGESTION_EXPERIMENT ];
	}
	await requestUtils.rest( {
		path: '/wp/v2/settings',
		method: 'POST',
		data: { 'gutenberg-experiments': experiments },
	} );
}

async function switchIntent( page: Page, intentLabel: string ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	await page
		.getByRole( 'menuitemradio', {
			name: new RegExp( `^${ intentLabel }` ),
		} )
		.click();
	await page.keyboard.press( 'Escape' );
}

/**
 * Select `[ start, end )` of the first paragraph with the keyboard.
 *
 * @param page  Page.
 * @param start Selection start.
 * @param end   Selection end.
 */
async function selectRange( page: Page, start: number, end: number ) {
	await page
		.frameLocator( 'iframe[name="editor-canvas"]' )
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.click();
	await page.keyboard.press( 'Home' );
	for ( let i = 0; i < start; i++ ) {
		await page.keyboard.press( 'ArrowRight' );
	}
	for ( let i = start; i < end; i++ ) {
		await page.keyboard.press( 'Shift+ArrowRight' );
	}
}

/**
 * The first paragraph's deletion ids per character, and its text.
 *
 * @param page Page.
 */
function readParagraph( page: Page ) {
	return page.evaluate( () => {
		const { data } = ( window as any ).wp;
		const [ block ] = data.select( 'core/block-editor' ).getBlocks();
		const value = block.attributes.content;
		return {
			text: value.text as string,
			html: value.toHTMLString() as string,
			deletions: Array.from( value.formats as any[], ( stack ) =>
				( stack ?? [] )
					.filter(
						( format: any ) => format.type === 'core/suggestion-del'
					)
					.map(
						( format: any ) =>
							format.attributes[ 'data-suggestion-id' ]
					)
					.sort()
					.join()
			) as string[],
		};
	} );
}

test.describe( 'Suggestion mode overlaps with real-time collaboration', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await setSuggestionExperiment( requestUtils, false );
	} );

	test( 'two peers suggest deleting overlapping words at the same time', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		await setSuggestionExperiment( requestUtils, true );
		const post = await requestUtils.createPost( {
			title: 'Concurrent overlapping deletions',
			content: `<!-- wp:paragraph --><p>${ TEXT }</p><!-- /wp:paragraph -->`,
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );
		const { page2 } = collaborationUtils;

		await switchIntent( page, 'Suggesting' );
		await switchIntent( page2, 'Suggesting' );

		// "quick brown" and "brown fox", sharing "brown".
		await selectRange( page, 4, 15 );
		await selectRange( page2, 10, 19 );
		await Promise.all( [
			page.keyboard.press( 'Delete' ),
			page2.keyboard.press( 'Delete' ),
		] );

		// Both deletions arrive on both peers.
		for ( const peer of [ page, page2 ] ) {
			await expect
				.poll(
					async () =>
						new Set(
							( await readParagraph( peer ) ).deletions
								.join()
								.split( ',' )
								.filter( Boolean )
						).size,
					{ timeout: 20_000 }
				)
				.toBe( 2 );
		}
		await collaborationUtils.waitForConvergence();

		const one = await readParagraph( page );
		const two = await readParagraph( page2 );
		expect( two.html ).toBe( one.html );
		expect( one.text ).toBe( TEXT );
		const ids = [ ...new Set( one.deletions.join().split( ',' ) ) ]
			.filter( Boolean )
			.sort();
		expect( ids ).toHaveLength( 2 );
		/*
		 * "brown", which both selected, carries both deletions, and every
		 * other selected character exactly one. Which one it carries at the
		 * two ends is not certain: each peer's wrap inserts an open and a
		 * close tag into the shared HTML string, a close tag names no
		 * element, and the merge can pair them the other way round, giving
		 * " fox" to the "quick brown" deletion. The peers still agree.
		 */
		expect( one.deletions.slice( 10, 15 ) ).toEqual(
			Array( 5 ).fill( ids.join() )
		);
		for ( const index of [ 4, 5, 6, 7, 8, 9, 15, 16, 17, 18 ] ) {
			expect( ids ).toContain( one.deletions[ index ] );
		}
		expect( one.deletions.slice( 0, 4 ) ).toEqual( Array( 4 ).fill( '' ) );
		expect( one.deletions.slice( 19 ) ).toEqual( Array( 7 ).fill( '' ) );
	} );
} );
