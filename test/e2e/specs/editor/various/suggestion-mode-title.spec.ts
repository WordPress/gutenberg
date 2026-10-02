/**
 * E2E coverage for post title suggestions (#73411). The title is not a block,
 * so it has its own capture path: in Suggest intent a title edit is held as a
 * proposed value and saved as a note with no block anchor, which the post
 * author then accepts or rejects from the notes sidebar.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

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
 * this BEFORE the edit that triggers it, or the response can land before the
 * listener attaches.
 */
function suggestionSavedPromise( page: any ) {
	return page.waitForResponse(
		( response: any ) =>
			/\/wp\/v2\/comments(\?|$|\/)/.test( response.url() ) &&
			[ 'POST', 'PUT' ].includes( response.request().method() ) &&
			response.ok()
	);
}

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

function getEditedTitle( page: any ) {
	return page.evaluate( () =>
		( window as any ).wp.data
			.select( 'core/editor' )
			.getEditedPostAttribute( 'title' )
	);
}

/*
 * Types a title in Editing intent, switches to Suggesting, and appends to the
 * title. Resolves once the suggestion note has been saved.
 */
async function suggestTitleChange( editor: any, page: any ) {
	const title = editor.canvas.getByRole( 'textbox', { name: 'Add title' } );
	await title.click();
	await page.keyboard.type( 'Original title' );
	await expect.poll( () => getEditedTitle( page ) ).toBe( 'Original title' );

	await switchIntent( page, 'Suggesting' );

	await title.click();
	await page.keyboard.press( 'End' );
	const suggestionSaved = suggestionSavedPromise( page );
	await page.keyboard.type( ' revised' );
	await suggestionSaved;
	return title;
}

test.describe( 'Suggestion mode: post title', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'a title edit in Suggest mode becomes a suggestion, not an edit', async ( {
		editor,
		page,
	} ) => {
		const title = await suggestTitleChange( editor, page );

		// The proposed title is shown, marked pending, and never reaches
		// the post.
		await expect( title ).toHaveText( 'Original title revised' );
		await expect( title ).toHaveClass( /\bis-suggestion-pending\b/ );
		expect( await getEditedTitle( page ) ).toBe( 'Original title' );

		const sidebar = await openNotesSidebar( page );
		const thread = sidebar.locator(
			'.editor-collab-sidebar-panel__thread'
		);
		await expect( thread ).toHaveCount( 1 );
		await expect(
			thread.locator( '.editor-collab-sidebar-panel__suggestion-summary' )
		).toHaveText( 'Title: “Original title” → “Original title revised”' );
		// A title note has no block, but it is not an orphan either.
		await expect( thread ).toContainText( 'Post title' );
		await expect( thread ).not.toContainText( 'Original block deleted.' );
	} );

	test( 'accepting a title suggestion applies the new title', async ( {
		editor,
		page,
	} ) => {
		const title = await suggestTitleChange( editor, page );
		await switchIntent( page, 'Editing' );

		const sidebar = await openNotesSidebar( page );
		await sidebar
			.getByRole( 'button', { name: 'Accept suggestion' } )
			.click();
		await expect(
			page
				.locator( '.components-snackbar-list' )
				.getByText( 'Suggestion applied.' )
		).toBeVisible();

		await expect
			.poll( () => getEditedTitle( page ) )
			.toBe( 'Original title revised' );
		await expect( title ).toHaveText( 'Original title revised' );
		await expect( title ).not.toHaveClass( /\bis-suggestion-pending\b/ );
	} );

	test( 'rejecting a title suggestion restores the title', async ( {
		editor,
		page,
	} ) => {
		const title = await suggestTitleChange( editor, page );

		const sidebar = await openNotesSidebar( page );
		await sidebar
			.getByRole( 'button', { name: 'Reject suggestion' } )
			.click();
		await expect(
			page
				.locator( '.components-snackbar-list' )
				.getByText( 'Suggestion rejected.' )
		).toBeVisible();

		await expect( title ).toHaveText( 'Original title' );
		await expect( title ).not.toHaveClass( /\bis-suggestion-pending\b/ );
		expect( await getEditedTitle( page ) ).toBe( 'Original title' );
	} );

	test( 'the title still edits directly in Editing intent', async ( {
		editor,
		page,
	} ) => {
		const title = editor.canvas.getByRole( 'textbox', {
			name: 'Add title',
		} );
		await title.click();
		await page.keyboard.type( 'Direct title' );

		await expect
			.poll( () => getEditedTitle( page ) )
			.toBe( 'Direct title' );
		await expect( title ).not.toHaveClass( /\bis-suggestion-pending\b/ );
	} );
} );
