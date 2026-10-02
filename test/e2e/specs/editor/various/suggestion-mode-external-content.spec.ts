/**
 * E2E coverage for content that reaches the editor from somewhere other than
 * this user's keyboard while Suggest mode is active.
 *
 * The sync manager applies another session's changes by dispatching
 * `editEntityRecord` with a fresh `blocks` array (see the `editRecord` handler
 * in core-data's resolvers); `useBlockSync` turns that into `resetBlocks`. A
 * revision restore and a refetch arrive the same way. Every block in the
 * replacement carries a new clientId, so the suggestion capture layer used to
 * read the arriving document as "this user inserted all of this" and the
 * outgoing one as "this user removed all of that" — the post doubled in the
 * canvas, every block wore a pending marker, and auto-save opened a note for
 * each one (issue #73411, finding F-21).
 *
 * These tests pin both halves: the reconcile is adopted silently, and capture
 * is still live afterwards.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const INCOMING_CONTENT = `<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph -->

<!-- wp:paragraph --><p>Beta, edited by someone else</p><!-- /wp:paragraph -->

<!-- wp:paragraph --><p>Gamma</p><!-- /wp:paragraph -->`;

async function switchIntent( page: any, intentLabel: string ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	const menuItem = page.getByRole( 'menuitemradio', {
		name: new RegExp( `^${ intentLabel }` ),
	} );
	await menuItem.waitFor( { state: 'visible', timeout: 10000 } );
	await menuItem.click();
	// `MenuItemsChoice` doesn't auto-close its dropdown on selection.
	await page.keyboard.press( 'Escape' );
}

/*
 * Returns a promise for the debounced suggestion auto-save REST call. Call
 * this BEFORE performing the edit that triggers the auto-save.
 */
function suggestionSavedPromise( page: any ) {
	return page.waitForResponse(
		( response: any ) =>
			/\/wp\/v2\/comments(\?|$|\/)/.test( response.url() ) &&
			[ 'POST', 'PUT' ].includes( response.request().method() ) &&
			response.ok()
	);
}

/**
 * Hands the editor a replacement document the way the sync manager does: an
 * `editEntityRecord` carrying a `blocks` array parsed elsewhere, which
 * `useBlockSync` applies to the store as a `resetBlocks`.
 *
 * @param {import('@playwright/test').Page} page    Playwright page.
 * @param {string}                          content Serialized block markup.
 */
async function receiveExternalContent( page: any, content: string ) {
	await page.evaluate( ( markup: string ) => {
		const postId = window.wp.data
			.select( 'core/editor' )
			.getCurrentPostId();
		window.wp.data
			.dispatch( 'core' )
			.editEntityRecord( 'postType', 'post', postId, {
				blocks: window.wp.blocks.parse( markup ),
			} );
	}, content );
}

/**
 * Counts the post's note comments, pending ones included.
 *
 * `status` has to be spelled out: pending suggestion notes are `hold`, and the
 * comments endpoint defaults to `approve`, so the default query would report
 * zero however many notes a bug manufactured.
 *
 * @param {Object} requestUtils Playwright request utils.
 * @param {number} postId       Post whose notes are counted.
 * @return {Promise<number>} Number of notes on the post.
 */
async function countNotes( requestUtils: any, postId: number ) {
	const notes = await requestUtils.rest( {
		path: '/wp/v2/comments',
		params: {
			type: 'note',
			post: postId,
			per_page: 100,
			status: 'all',
		},
	} );
	return notes.length;
}

/**
 * Reads every block's pending-suggestion marker type.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 * @return {Promise<Array<string|null>>} One entry per top-level block.
 */
function getMarkerTypes( page: any ) {
	return page.evaluate( () =>
		window.wp.data
			.select( 'core/block-editor' )
			.getBlocks()
			.map(
				( block: any ) =>
					block.attributes?.metadata?.suggestion?.type ?? null
			)
	);
}

test.describe( 'Suggestion mode and externally-supplied content', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Alpha' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Beta' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Gamma' },
		} );
		await editor.saveDraft();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( "another session's content is not captured as suggested insertions", async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await switchIntent( page, 'Suggesting' );

		// This user makes one real suggestion first, so the note count below
		// measures manufactured notes against a known baseline.
		const first = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Alpha' } );
		await first.click();
		await page.keyboard.press( 'End' );
		const suggestionSaved = suggestionSavedPromise( page );
		await page.keyboard.type( ' plus a word' );
		await suggestionSaved;

		const postId = await page.evaluate( () =>
			window.wp.data.select( 'core/editor' ).getCurrentPostId()
		);
		const notesBefore = await countNotes( requestUtils, postId );

		/*
		 * The other session edits the shared document, so what comes back
		 * carries this user's pending suggestion untouched and differs only
		 * where the other author typed. Deriving the incoming markup from the
		 * live content models that faithfully: a hardcoded replacement would
		 * drop the suggestion's inline marker, and the note would be collected
		 * as a genuine orphan rather than by the bug under test.
		 */
		const shared = await editor.getEditedPostContent();
		expect( shared ).toContain( 'plus a word' );
		const incoming = shared.replace(
			'<p>Beta</p>',
			'<p>Beta, edited by someone else</p>'
		);
		expect( incoming ).not.toBe( shared );

		await receiveExternalContent( page, incoming );

		// The incoming document replaces the tree; it is not duplicated, and
		// nothing in it is marked as this user's pending change.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveCount( 3 );
		await expect(
			editor.canvas.getByText( 'Beta, edited by someone else' )
		).toBeVisible();
		expect( await getMarkerTypes( page ) ).toEqual( [ null, null, null ] );

		// The suggestion auto-save is debounced; saving the draft gives it its
		// window and round-trips to the server, so any note opened for the
		// incoming document exists by the time the count is read.
		await editor.saveDraft();
		const notesAfter = await countNotes( requestUtils, postId );
		expect( notesAfter ).toBe( notesBefore );

		// And the reconciled document is what gets saved: three paragraphs,
		// no pending markers manufactured for them.
		const saved = await editor.getEditedPostContent();
		expect( saved ).toContain( 'Beta, edited by someone else' );
		expect( saved ).not.toContain( 'pending-insert' );
		expect( saved ).not.toContain( 'pending-remove' );
	} );

	test( 'an edit made after the reconcile is still captured as a suggestion', async ( {
		editor,
		page,
	} ) => {
		await switchIntent( page, 'Suggesting' );

		await receiveExternalContent( page, INCOMING_CONTENT );
		await expect(
			editor.canvas.getByText( 'Beta, edited by someone else' )
		).toBeVisible();

		// Adopting the reconcile re-seeds the capture baseline; it must not
		// switch capture off. Editing a block that only exists because of the
		// reconcile still produces a marker rather than a direct edit.
		const incoming = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Beta, edited by someone else' } );
		await incoming.click();
		await page.keyboard.press( 'End' );
		const suggestionSaved = suggestionSavedPromise( page );
		await page.keyboard.type( ' and by me' );
		await suggestionSaved;

		await expect(
			editor.canvas.locator( 'mark.wp-suggestion' )
		).toContainText( ' and by me' );
	} );
} );
