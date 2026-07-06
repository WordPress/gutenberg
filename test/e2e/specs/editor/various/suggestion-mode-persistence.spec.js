/**
 * E2E coverage for persistent structural suggestions.
 *
 * Structural suggestion state (the `metadata.suggestion` marker, a pending
 * move's proposed order, a pending-insert block itself) saves into
 * `post_content` — there is no save lock. These tests pin the consequences:
 *
 *   - Save draft stays available while a structural suggestion is pending,
 *     and saving leaves the editor clean (no unsaved-changes trap).
 *   - Pending state and the note linkage survive a reload; the suggestion
 *     can still be accepted or rejected afterwards.
 *   - Un-accepted insertions never render on the public front end (the
 *     type-aware render_block strip), while pending removals still do.
 */

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

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
 * Opens the "All notes" sidebar (if not already open) and returns the
 * settings-region locator the note threads render into.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 * @return {Promise<import('@playwright/test').Locator>} Sidebar region.
 */
async function openNotesSidebar( page ) {
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
 * Clicks the note-header decision button and waits for the confirmation
 * snackbar.
 *
 * @param {import('@playwright/test').Page} page   Playwright page.
 * @param {'Accept'|'Reject'}               action Which decision to take.
 */
async function decideSuggestion( page, action ) {
	const sidebar = await openNotesSidebar( page );
	await sidebar
		.getByRole( 'button', { name: `${ action } suggestion` } )
		.click();
	await expect(
		page
			.locator( '.components-snackbar-list' )
			.getByText(
				action === 'Accept'
					? 'Suggestion applied.'
					: 'Suggestion rejected.'
			)
	).toBeVisible();
	return sidebar;
}

test.describe( 'Suggestion mode persistence', () => {
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

	test( 'a structural suggestion does not block saving, and saving leaves the editor clean', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second paragraph' },
		} );

		await switchIntent( page, 'Suggesting' );

		const mover = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'First paragraph' } );
		await editor.selectBlocks( mover );
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockToolbarButton( 'Move down' );
		await expect( mover ).toHaveClass( /is-suggestion-pending-move/ );
		await suggestionSaved;

		// The regression this pins: the save lock used to keep Save draft
		// disabled while the post stayed dirty, trapping the suggester
		// behind an unsaved-changes warning with no way to resolve it.
		const saveButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save draft' } );
		await expect( saveButton ).toBeEnabled();

		await editor.saveDraft();

		// Once saved, nothing is left unsaved: no beforeunload trap.
		const isDirty = await page.evaluate( () =>
			window.wp.data.select( 'core/editor' ).isEditedPostDirty()
		);
		expect( isDirty ).toBe( false );
	} );

	test( 'a pending move survives a reload and can still be rejected', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second paragraph' },
		} );

		await switchIntent( page, 'Suggesting' );

		const mover = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'First paragraph' } );
		await editor.selectBlocks( mover );
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockToolbarButton( 'Move down' );
		await suggestionSaved;

		await editor.saveDraft();
		await page.reload();

		// The pending treatment, its origin ghost, and the note linkage all
		// come back from saved content.
		const movedBlock = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'First paragraph' } );
		await expect( movedBlock ).toHaveClass( /is-suggestion-pending-move/ );
		await expect(
			editor.canvas.locator( '.is-suggestion-move-ghost' )
		).toBeVisible();

		const sidebar = await openNotesSidebar( page );
		await expect(
			sidebar.locator(
				'.editor-collab-sidebar-panel__suggestion-summary'
			)
		).toContainText( 'Move block:' );

		// Rejecting after the reload restores the original order: the
		// same-parent origin is recoverable from fromIndex alone.
		await decideSuggestion( page, 'Reject' );
		const serialized = await editor.getEditedPostContent();
		expect( serialized.indexOf( 'First paragraph' ) ).toBeLessThan(
			serialized.indexOf( 'Second paragraph' )
		);
		expect( serialized ).not.toContain( 'pending-move' );
	} );

	test( 'a pending removal survives a reload and can still be accepted', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Keep me' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Remove me' },
		} );

		await switchIntent( page, 'Suggesting' );

		const doomed = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Remove me' } );
		await doomed.click();
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockOptionsMenuItem( 'Delete' );
		await expect( doomed ).toHaveClass( /is-suggestion-pending-remove/ );
		await suggestionSaved;

		await editor.saveDraft();
		await page.reload();

		const pendingRemove = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Remove me' } );
		await expect( pendingRemove ).toHaveClass(
			/is-suggestion-pending-remove/
		);

		await decideSuggestion( page, 'Accept' );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Keep me' );
		expect( serialized ).not.toContain( 'Remove me' );
	} );

	test( 'a pending insertion is hidden on the front end until accepted', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Existing content' },
		} );

		await switchIntent( page, 'Suggesting' );

		const suggestionSaved = suggestionSavedPromise( page );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Proposed new paragraph' },
		} );
		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.filter( { hasText: 'Proposed new paragraph' } )
		).toHaveClass( /is-suggestion-pending-insert/ );
		await suggestionSaved;

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );
		await expect(
			page.locator( 'body' ).getByText( 'Existing content' )
		).toBeVisible();
		await expect(
			page.locator( 'body' ).getByText( 'Proposed new paragraph' )
		).toBeHidden();
	} );

	test( 'a typed inline addition survives a reload and can still be accepted', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		const suggestionSaved = suggestionSavedPromise( page );
		await page.keyboard.type( ' world' );
		await suggestionSaved;
		// The marker is only written once the async note id resolves.
		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="add"]'
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );

		await editor.saveDraft();
		await page.reload();

		// The marker lives in saved content, so it comes back decorated and
		// its note stays linked.
		const reloaded = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await expect(
			reloaded.locator( 'mark.wp-suggestion[data-suggestion-type="add"]' )
		).toContainText( 'world' );

		// Accepting after the reload unwraps the marker and keeps the text.
		await decideSuggestion( page, 'Accept' );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Hello world' );
		expect( serialized ).not.toContain( 'data-suggestion-id' );
	} );
} );
