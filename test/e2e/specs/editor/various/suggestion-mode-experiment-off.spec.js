/**
 * E2E coverage for what a post carrying suggestion data looks like when the
 * Suggest mode experiment is OFF (F-22 in the guided testing pass for #73411).
 *
 * Suggestion state deliberately outlives the experiment flag: the
 * `core/suggestion` format is registered unconditionally so a `<mark
 * class="wp-suggestion">` survives a load-and-save byte for byte. That keeps
 * content safe when the experiment is toggled off on a site that has been
 * using it, at the cost of comprehension — the markers render with no intent
 * switcher, no tooltip and no per-author tinting to explain them.
 *
 * These tests pin the explanation that closes the gap, and the two cases it
 * must stay out of:
 *
 *   - Experiment off + suggestion markers in the post: an explanatory notice
 *     appears, and its action opens the notes sidebar where the Accept and
 *     Reject controls already live.
 *   - Experiment off + no suggestion markers: no notice.
 *   - Experiment on: no notice, because the suggestion UI explains itself.
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const NOTICE_TEXT = 'This post has suggested edits';

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

/**
 * Creates a post carrying one pending inline addition, with the experiment on,
 * and returns its id.
 *
 * @param {Object} args        Fixtures.
 * @param {Object} args.admin  Admin utils.
 * @param {Object} args.editor Editor utils.
 * @param {Object} args.page   Playwright page.
 * @return {Promise<string>} The post id.
 */
async function createPostWithSuggestion( { admin, editor, page } ) {
	await admin.createNewPost( { title: 'Suggestion carried past the flag' } );
	await editor.insertBlock( {
		name: 'core/paragraph',
		attributes: { content: 'The quick brown fox' },
	} );

	await switchIntent( page, 'Suggesting' );

	const paragraph = editor.canvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.first();
	await paragraph.click();
	await page.keyboard.press( 'End' );
	await page.keyboard.type( ' jumps' );

	// A populated id proves the backing note comment saved.
	await expect(
		paragraph.locator( 'mark.wp-suggestion[data-suggestion-type="add"]' )
	).toHaveAttribute( 'data-suggestion-id', /\d/ );

	await editor.saveDraft();
	return new URL( page.url() ).searchParams.get( 'post' );
}

test.describe( 'Suggestion data with the experiment off', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'a post carrying suggestion markers explains them and points at the notes sidebar', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
		const postId = await createPostWithSuggestion( {
			admin,
			editor,
			page,
		} );

		// Turn the experiment off and reopen the post, the way a site that
		// stops using the feature would.
		await requestUtils.setGutenbergExperiments( [] );
		await admin.editPost( postId );

		// The marker is still there — content safety is the invariant this
		// notice exists to explain, not to change.
		await expect(
			editor.canvas.locator(
				'mark.wp-suggestion[data-suggestion-type="add"]'
			)
		).toBeVisible();

		const notice = page.locator( '.components-notice', {
			hasText: NOTICE_TEXT,
		} );
		await expect( notice ).toBeVisible();

		// The action opens the sidebar where Accept/Reject already live.
		await notice.getByRole( 'button', { name: 'Show notes' } ).click();
		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await expect(
			sidebar.getByRole( 'button', { name: 'Accept suggestion' } )
		).toBeVisible();
	} );

	test( 'a post with no suggestion markers gets no notice', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.setGutenbergExperiments( [] );
		await admin.createNewPost( { title: 'No suggestions here' } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'The quick brown fox' },
		} );
		await editor.saveDraft();
		const postId = new URL( page.url() ).searchParams.get( 'post' );
		await admin.editPost( postId );

		// Anchor on a positive signal before asserting an absence, so the
		// check cannot land before the editor has finished booting.
		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.first()
		).toBeVisible();
		await expect(
			page.locator( '.components-notice', { hasText: NOTICE_TEXT } )
		).toHaveCount( 0 );
	} );

	test( 'the notice stays away while the experiment is on', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
		const postId = await createPostWithSuggestion( {
			admin,
			editor,
			page,
		} );
		await admin.editPost( postId );

		await expect(
			editor.canvas.locator(
				'mark.wp-suggestion[data-suggestion-type="add"]'
			)
		).toBeVisible();
		await expect(
			page.locator( '.components-notice', { hasText: NOTICE_TEXT } )
		).toHaveCount( 0 );
	} );
} );
