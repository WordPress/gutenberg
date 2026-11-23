/**
 * E2E coverage for what a post carrying suggestion data looks like when the
 * Suggestion mode experiment is OFF (F-22 in the guided testing pass for
 * #73411).
 *
 * Suggestion state outlives the experiment flag, but nothing acts on it while
 * the flag is off: the server neither extracts nor puts back proposals, so
 * the editor loads the stored content, where the save pass left an emptied
 * `<mark class="wp-suggestion-add">` anchor in place of the proposed text. The
 * marker formats are registered unconditionally so that anchor survives a
 * load-and-save, and the notes sidebar lists the suggestion without Accept or
 * Reject.
 *
 * These tests pin the explanation that closes the gap, and the two cases it
 * must stay out of:
 *
 *   - Experiment off + suggestion markers in the post: the proposed text is
 *     not loaded, an explanatory notice appears, and the notes sidebar shows
 *     the suggestion with a hint and no decision controls.
 *   - Experiment off + no suggestion markers: no notice.
 *   - Experiment on: no notice, because the suggestion UI explains itself.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const NOTICE_TEXT = 'This post has suggested edits';

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
async function createPostWithSuggestion( {
	admin,
	editor,
	page,
}: {
	admin: any;
	editor: any;
	page: any;
} ) {
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
		paragraph.locator( 'mark.wp-suggestion-add' )
	).toHaveAttribute( 'data-suggestion-id', /\d/ );

	await editor.saveDraft();
	return new URL( page.url() ).searchParams.get( 'post' )!;
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

		// The proposal stays on its note: the editor loads the public
		// baseline, with the emptied anchor in place of the proposed text.
		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await expect( paragraph ).toContainText( 'The quick brown fox' );
		await expect( paragraph ).not.toContainText( 'jumps' );

		const notice = page.locator( '.notices-inline-notices__notice', {
			hasText: NOTICE_TEXT,
		} );
		await expect( notice ).toBeVisible();

		// The action opens the sidebar, which lists the suggestion but
		// offers nothing to decide it with.
		await notice.getByRole( 'button', { name: 'Show notes' } ).click();
		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await expect(
			sidebar.getByText(
				'Turn on the Suggestion Mode experiment to accept or reject this suggestion.'
			)
		).toBeVisible();
		await expect(
			sidebar.getByRole( 'button', { name: 'Accept suggestion' } )
		).toHaveCount( 0 );
		await expect(
			sidebar.getByRole( 'button', { name: 'Reject suggestion' } )
		).toHaveCount( 0 );

		// Saving with the experiment off keeps the anchor, so the suggestion
		// is still there to review once the experiment is back on.
		await paragraph.click();
		await page.keyboard.press( 'Home' );
		await page.keyboard.type( 'Now ' );
		await editor.saveDraft();
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
		await admin.editPost( postId );
		await expect(
			editor.canvas.locator( 'mark.wp-suggestion-add' )
		).toHaveText( 'jumps' );
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
		const postId = new URL( page.url() ).searchParams.get( 'post' )!;
		await admin.editPost( postId );

		// Anchor on a positive signal before asserting an absence, so the
		// check cannot land before the editor has finished booting.
		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.first()
		).toBeVisible();
		await expect(
			page.locator( '.notices-inline-notices__notice', {
				hasText: NOTICE_TEXT,
			} )
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
			editor.canvas.locator( 'mark.wp-suggestion-add' )
		).toBeVisible();
		await expect(
			page.locator( '.notices-inline-notices__notice', {
				hasText: NOTICE_TEXT,
			} )
		).toHaveCount( 0 );
	} );
} );
