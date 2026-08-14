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
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const INCOMING_CONTENT = `<!-- wp:paragraph --><p>Alpha</p><!-- /wp:paragraph -->

<!-- wp:paragraph --><p>Beta, edited by someone else</p><!-- /wp:paragraph -->

<!-- wp:paragraph --><p>Gamma</p><!-- /wp:paragraph -->`;

async function switchIntent( page, intentLabel ) {
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
function suggestionSavedPromise( page ) {
	return page.waitForResponse(
		( response ) =>
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
async function receiveExternalContent( page, content ) {
	await page.evaluate( ( markup ) => {
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
 * Reads every block's pending-suggestion marker type.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 * @return {Promise<Array<string|null>>} One entry per top-level block.
 */
function getMarkerTypes( page ) {
	return page.evaluate( () =>
		window.wp.data
			.select( 'core/block-editor' )
			.getBlocks()
			.map(
				( block ) =>
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
		const notesBefore = await requestUtils.rest( {
			path: '/wp/v2/comments',
			params: { type: 'note', post: postId, per_page: 100 },
		} );

		await receiveExternalContent( page, INCOMING_CONTENT );

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
		const notesAfter = await requestUtils.rest( {
			path: '/wp/v2/comments',
			params: { type: 'note', post: postId, per_page: 100 },
		} );
		expect( notesAfter ).toHaveLength( notesBefore.length );

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
