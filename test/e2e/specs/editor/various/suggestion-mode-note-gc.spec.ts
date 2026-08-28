/**
 * E2E coverage for the suggestion note collector (#81958, part of #73411).
 *
 * The collector trashes a pending suggestion note once the anchor it was
 * watching disappears, because a suggestion with nothing left to change has
 * nothing left to accept or reject. The tests in `suggestion-mode-undo.spec.ts`
 * pin that behaviour for a note nobody has answered.
 *
 * These tests pin the exception: once someone has replied, the note is no
 * longer only a proposal, it is a discussion. Collecting it would delete the
 * root comment and take every reply with it - silently, and for a reply the
 * person who pressed Ctrl+Z may never have seen. Withdrawing your own
 * suggestion may never discard someone else's comment, so a note with replies
 * is kept and the withdrawal is announced instead.
 *
 * Both routes into the collector are covered: undo in Suggesting intent, and
 * deleting the marked text in Editing intent, which reaches the same place
 * because the collector is mounted for every intent.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const SUGGESTION_MARK = 'mark.wp-suggestion';

/*
 * The collector announces the reprieve once its grace period is out, so the
 * snackbar is the settled point at which the note's fate has been decided.
 * Waiting on it rather than on a fixed delay keeps "the note survived" an
 * assertion about a finished decision, not a race with one.
 */
const KEPT_NOTICE = 'The note is kept because it has replies.';

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
	// `MenuItemsChoice` doesn't auto-close its dropdown on selection, so
	// leaving the menu open would make a subsequent `Options` click toggle
	// it closed instead of reopening it.
	await page.keyboard.press( 'Escape' );
}

/**
 * Opens the "All notes" sidebar (if not already open) and returns the
 * settings-region locator the note threads render into.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 * @return {Promise<import('@playwright/test').Locator>} Sidebar region.
 */
async function openNotesSidebar( page: any ) {
	const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
	const allNotesToggle = topBar.getByRole( 'button', {
		name: 'All notes',
		exact: true,
	} );
	if (
		( await allNotesToggle.getAttribute( 'aria-expanded' ) ) === 'false'
	) {
		await allNotesToggle.click();
	}
	return page.getByRole( 'region', { name: 'Editor settings' } );
}

/**
 * Suggests bold on the last word of the first paragraph, leaving a `format`
 * suggestion whose marker and note the collector watches.
 *
 * @param {Object} editor    Editor utils.
 * @param {Object} page      Playwright page.
 * @param {Object} pageUtils Page utils.
 * @return {Promise<import('@playwright/test').Locator>} The paragraph locator.
 */
async function suggestBoldOnLastWord( editor: any, page: any, pageUtils: any ) {
	const paragraph = editor.canvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.first();
	await paragraph.click();
	await page.keyboard.press( 'End' );
	await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
	await pageUtils.pressKeys( 'primary+b' );

	// A populated id proves the note comment saved before the test goes on.
	await expect(
		paragraph.locator(
			`${ SUGGESTION_MARK }[data-suggestion-type="format"]`
		)
	).toHaveAttribute( 'data-suggestion-id', /\d/ );

	return paragraph;
}

/**
 * Replies to the single suggestion note in the sidebar, standing in for the
 * collaborator who answers a proposal.
 *
 * @param {Object} page Playwright page.
 * @param {string} text Reply body.
 * @return {Promise<import('@playwright/test').Locator>} Sidebar region.
 */
async function replyToSuggestionNote( page: any, text: string ) {
	const sidebar = await openNotesSidebar( page );
	const thread = sidebar.locator( '.editor-collab-sidebar-panel__thread' );
	await expect( thread ).toHaveCount( 1 );

	// Select the thread to render its reply form. Clicking the summary rather
	// than the thread box: the click bubbles to the thread's select handler
	// either way, and the summary carries no buttons of its own to hit.
	await thread
		.locator( '.editor-collab-sidebar-panel__suggestion-summary' )
		.click();

	const replyBox = sidebar.getByRole( 'textbox', {
		name: /^Reply to note/,
	} );
	await expect( replyBox ).toBeVisible();
	// The reply form deliberately does not focus on mount, so click into it
	// before typing.
	await replyBox.click();
	await replyBox.pressSequentially( text );
	await sidebar.getByRole( 'button', { name: 'Reply', exact: true } ).click();
	await expect(
		page.locator( '.components-snackbar-list' ).getByText( 'Reply added.' )
	).toBeVisible();

	return sidebar;
}

test.describe( 'Suggestion note collector', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'undoing a suggestion keeps its note when the note has replies', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello world' },
		} );
		await switchIntent( page, 'Suggesting' );

		const paragraph = await suggestBoldOnLastWord(
			editor,
			page,
			pageUtils
		);
		const sidebar = await replyToSuggestionNote(
			page,
			'Please keep this bold.'
		);

		// Undo from the canvas, the way the suggester would after answering.
		await paragraph.click();
		await pageUtils.pressKeys( 'primary+z' );

		// The proposal itself is withdrawn: the marker is gone from the block.
		await expect( paragraph.locator( SUGGESTION_MARK ) ).toHaveCount( 0 );
		expect( await editor.getEditedPostContent() ).not.toContain(
			'data-suggestion'
		);

		// The withdrawal is announced rather than passing unremarked, since
		// the note it leaves behind can no longer be applied or rejected.
		await expect(
			page.locator( '.components-snackbar-list' ).getByText( KEPT_NOTICE )
		).toBeVisible();

		// The discussion survives the withdrawal, reply and all.
		await expect(
			sidebar.locator( '.editor-collab-sidebar-panel__thread' )
		).toHaveCount( 1 );
		await expect(
			sidebar.getByText( 'Please keep this bold.' )
		).toBeVisible();
	} );

	test( 'deleting suggested text in Editing intent keeps the note when it has replies', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello world' },
		} );
		await switchIntent( page, 'Suggesting' );

		const paragraph = await suggestBoldOnLastWord(
			editor,
			page,
			pageUtils
		);
		const sidebar = await replyToSuggestionNote(
			page,
			'Please keep this bold.'
		);

		// Back in Editing intent, delete the marked word outright. No undo
		// involved - ordinary editing reaches the collector too.
		await switchIntent( page, 'Editing' );
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'Backspace', { times: 5 } );

		await expect( paragraph ).toHaveText( 'Hello ' );
		await expect( paragraph.locator( SUGGESTION_MARK ) ).toHaveCount( 0 );

		await expect(
			page.locator( '.components-snackbar-list' ).getByText( KEPT_NOTICE )
		).toBeVisible();
		await expect(
			sidebar.locator( '.editor-collab-sidebar-panel__thread' )
		).toHaveCount( 1 );
		await expect(
			sidebar.getByText( 'Please keep this bold.' )
		).toBeVisible();
	} );
} );
