/**
 * E2E coverage for the Suggest mode review cycle (#73411): the full loop of
 * making a suggestion, then accepting or rejecting it from the notes sidebar.
 *
 * Capture-side basics (the mode snackbar, content-edit capture, the
 * block-switcher attribute capture, and the empty-inserted-block guard) live
 * in `suggestion-mode.spec.js`; this spec picks up where those leave off —
 * the block-remove and block-move structural captures, and the accept/reject
 * decision for every suggestion kind this layer ships:
 *
 *   - attribute-set   (heading level via the block switcher)
 *   - block-remove    (delete a block)
 *   - block-insert    (add a block)
 *   - block-move      (reorder blocks)
 *
 * Reviews happen in Editing intent: structural markers are persisted on the
 * live block, so a post author sees the pending treatment and the sidebar
 * decision buttons without entering Suggest mode themselves.
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
	// `MenuItemsChoice` doesn't auto-close its dropdown on selection, so
	// leaving the menu open would make a subsequent `Options` click toggle
	// it closed instead of reopening it.
	await page.keyboard.press( 'Escape' );
}

/*
 * Returns a promise for the debounced suggestion auto-save REST call. Call
 * this BEFORE performing the edit that triggers the auto-save: creating the
 * listener after the edit races the debounce on slow CI — the response can
 * land before `waitForResponse` attaches and the wait then times out.
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
 * snackbar, which fires only after the comment status PATCH succeeds.
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

test.describe( 'Suggestion mode review flows', () => {
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

	// --- Structural capture: block remove / block move ----------------------

	test( 'remove — deleting a block keeps it with a pending-remove treatment', async ( {
		editor,
		page,
	} ) => {
		// Deleting a block in Suggest mode must not remove it: the
		// interceptor re-inserts the subtree and tags it `pending-remove`,
		// so the block stays visible (struck-through) until the suggestion
		// is accepted.
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
		// Attach the auto-save listener before the edit starts the debounce.
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockOptionsMenuItem( 'Delete' );

		// The block survives the delete, carrying the pending-remove
		// treatment instead of disappearing.
		await expect( doomed ).toBeVisible();
		await expect( doomed ).toHaveClass( /is-suggestion-pending-remove/ );

		// Nothing was actually removed from the post content.
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Remove me' );

		await suggestionSaved;

		// The sidebar carries a "Remove block" note for the suggestion.
		const sidebar = await openNotesSidebar( page );
		const summary = sidebar.locator(
			'.editor-collab-sidebar-panel__suggestion-summary'
		);
		await expect( summary ).toContainText( 'Remove block:' );
		await expect( summary ).toContainText( 'paragraph' );
	} );

	test( 'move — moving a block tags it pending-move and ghosts its origin', async ( {
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
		// Select via the store: the freshly-inserted second block's floating
		// toolbar hovers over the first paragraph and intercepts a raw click.
		await editor.selectBlocks( mover );
		// Attach the auto-save listener before the edit starts the debounce.
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockToolbarButton( 'Move down' );

		// The block lands at its proposed position with the pending-move
		// treatment, and a non-interactive ghost marks where it came from.
		await expect( mover ).toHaveClass( /is-suggestion-pending-move/ );
		await expect(
			editor.canvas.locator( '.is-suggestion-move-ghost' )
		).toBeVisible();

		// The live document already reflects the proposed order (the marker
		// records the origin so Reject can restore it).
		const serialized = await editor.getEditedPostContent();
		expect( serialized.indexOf( 'Second paragraph' ) ).toBeLessThan(
			serialized.indexOf( 'First paragraph' )
		);

		await suggestionSaved;

		const sidebar = await openNotesSidebar( page );
		const summary = sidebar.locator(
			'.editor-collab-sidebar-panel__suggestion-summary'
		);
		await expect( summary ).toContainText( 'Move block:' );
	} );

	test( 'move — moving a block up attributes the suggestion to the moved block', async ( {
		editor,
		page,
	} ) => {
		// An adjacent swap is ambiguous to order-diffing alone: "Beta moved
		// up" and "Alpha moved down" produce the same order. The suggestion
		// must be attributed to the block the user actually acted on — the
		// selected block — with the ghost at ITS origin, not the other way
		// around.
		for ( const content of [ 'Alpha', 'Beta', 'Gamma' ] ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content },
			} );
		}

		await switchIntent( page, 'Suggesting' );

		const mover = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Beta' } );
		await editor.selectBlocks( mover );
		// Attach the auto-save listener before the edit starts the debounce.
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockToolbarButton( 'Move up' );

		// The moved block carries the pending-move treatment; the block it
		// swapped past keeps no marker.
		await expect( mover ).toHaveClass( /is-suggestion-pending-move/ );
		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.filter( { hasText: 'Alpha' } )
		).not.toHaveClass( /is-suggestion-pending-move/ );

		// The ghost previews the MOVED block's content at its origin slot.
		await expect(
			editor.canvas
				.getByTestId( 'suggestion-move-ghost' )
				.locator( '.is-suggestion-move-ghost__excerpt' )
		).toHaveText( 'Beta' );

		// The marker records the moved block's true origin (index 1), which
		// is what places the ghost and what Reject restores.
		const blocks = await editor.getBlocks();
		expect( blocks[ 0 ].attributes.content ).toBe( 'Beta' );
		expect( blocks[ 0 ].attributes.metadata.suggestion ).toMatchObject( {
			type: 'pending-move',
			fromIndex: 1,
		} );
		expect( blocks[ 1 ].attributes.metadata?.suggestion ).toBeUndefined();

		await suggestionSaved;

		// One move action creates exactly one note.
		const sidebar = await openNotesSidebar( page );
		const summaries = sidebar.locator(
			'.editor-collab-sidebar-panel__suggestion-summary'
		);
		await expect( summaries ).toHaveCount( 1 );
		await expect( summaries ).toContainText( 'Move block:' );

		// Rejecting restores the original order.
		await decideSuggestion( page, 'Reject' );
		const serialized = await editor.getEditedPostContent();
		expect( serialized.indexOf( 'Alpha' ) ).toBeLessThan(
			serialized.indexOf( 'Beta' )
		);
		expect( serialized ).not.toContain( 'pending-move' );
	} );

	test( 'move — moving the same block twice keeps a single note', async ( {
		editor,
		page,
	} ) => {
		// Nudging a block up two slots is one logical suggestion. Each hop
		// must update the same pending-move marker and note — not tag a
		// different sibling per hop and pile up notes.
		for ( const content of [ 'Alpha', 'Beta', 'Gamma', 'Delta' ] ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content },
			} );
		}

		await switchIntent( page, 'Suggesting' );

		const mover = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Gamma' } );
		await editor.selectBlocks( mover );
		const firstSaved = suggestionSavedPromise( page );
		await editor.clickBlockToolbarButton( 'Move up' );
		await firstSaved;

		const secondSaved = suggestionSavedPromise( page );
		await editor.clickBlockToolbarButton( 'Move up' );
		await secondSaved;

		// Only the block the user moved is tagged, and its marker still
		// points at the true origin (index 2).
		const blocks = await editor.getBlocks();
		const tagged = blocks.filter(
			( block ) =>
				block.attributes.metadata?.suggestion?.type === 'pending-move'
		);
		expect( tagged ).toHaveLength( 1 );
		expect( tagged[ 0 ].attributes.content ).toBe( 'Gamma' );
		expect( tagged[ 0 ].attributes.metadata.suggestion.fromIndex ).toBe(
			2
		);

		// Both hops fold into a single note.
		const sidebar = await openNotesSidebar( page );
		const summaries = sidebar.locator(
			'.editor-collab-sidebar-panel__suggestion-summary'
		);
		await expect( summaries ).toHaveCount( 1 );
		await expect( summaries ).toContainText( 'Move block:' );

		// Rejecting the single note restores the original order.
		await decideSuggestion( page, 'Reject' );
		const serialized = await editor.getEditedPostContent();
		const order = [ 'Alpha', 'Beta', 'Gamma', 'Delta' ].map( ( text ) =>
			serialized.indexOf( text )
		);
		expect( order ).toEqual( [ ...order ].sort( ( x, y ) => x - y ) );
	} );

	// --- Review: attribute-set (heading level) ------------------------------

	test( 'accept — an accepted heading-level change lands in the post content', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'My Heading', level: 2 },
		} );

		await switchIntent( page, 'Suggesting' );

		const heading = editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.first();
		await heading.click();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: /^Heading 2$/ } )
			.click();
		// Attach the auto-save listener before the edit starts the debounce.
		const suggestionSaved = suggestionSavedPromise( page );
		await page.getByRole( 'menuitem', { name: /^Heading 3/ } ).click();
		await suggestionSaved;

		// Review as the post author, outside Suggest mode.
		await switchIntent( page, 'Editing' );
		const sidebar = await decideSuggestion( page, 'Accept' );

		// The level change is committed to the live block and the post.
		await expect( heading ).toHaveJSProperty( 'tagName', 'H3' );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( '"level":3' );

		// The note stays as a record of the decision.
		await expect(
			sidebar.getByText( 'Applied', { exact: true } )
		).toBeVisible();
	} );

	test( 'reject — a rejected heading-level change leaves the post untouched', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'My Heading', level: 2 },
		} );

		await switchIntent( page, 'Suggesting' );

		const heading = editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.first();
		await heading.click();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: /^Heading 2$/ } )
			.click();
		// Attach the auto-save listener before the edit starts the debounce.
		const suggestionSaved = suggestionSavedPromise( page );
		await page.getByRole( 'menuitem', { name: /^Heading 3/ } ).click();
		await suggestionSaved;

		await switchIntent( page, 'Editing' );
		const sidebar = await decideSuggestion( page, 'Reject' );

		// The heading keeps its original level everywhere.
		await expect( heading ).toHaveJSProperty( 'tagName', 'H2' );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( '"level":3' );

		await expect(
			sidebar.getByText( 'Rejected', { exact: true } )
		).toBeVisible();
	} );

	// --- Review: block-remove ------------------------------------------------

	test( 'accept — an accepted block removal actually removes the block', async ( {
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

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Remove me' } )
			.click();
		// Attach the auto-save listener before the edit starts the debounce.
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockOptionsMenuItem( 'Delete' );
		await suggestionSaved;

		await switchIntent( page, 'Editing' );
		const sidebar = await decideSuggestion( page, 'Accept' );

		// Now — and only now — the block is gone.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveCount( 1 );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( 'Remove me' );
		expect( serialized ).toContain( 'Keep me' );

		await expect(
			sidebar.getByText( 'Applied', { exact: true } )
		).toBeVisible();
	} );

	test( 'reject — a rejected block removal keeps the block and clears its treatment', async ( {
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
		// Attach the auto-save listener before the edit starts the debounce.
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockOptionsMenuItem( 'Delete' );
		await suggestionSaved;

		await switchIntent( page, 'Editing' );
		const sidebar = await decideSuggestion( page, 'Reject' );

		// The block survives with the strikethrough treatment lifted.
		await expect( doomed ).toBeVisible();
		await expect( doomed ).not.toHaveClass(
			/is-suggestion-pending-remove/
		);
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Remove me' );

		await expect(
			sidebar.getByText( 'Rejected', { exact: true } )
		).toBeVisible();
	} );

	// --- Review: block-insert ------------------------------------------------

	test( 'accept — an accepted block insertion keeps the block and clears its treatment', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Existing paragraph' },
		} );

		await switchIntent( page, 'Suggesting' );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first()
			.click();
		await page.keyboard.press( 'End' );
		// Attach the auto-save listener before the edit starts the debounce.
		const suggestionSaved = suggestionSavedPromise( page );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Brand new suggested paragraph' );

		const inserted = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.nth( 1 );
		await expect( inserted ).toHaveClass( /is-suggestion-pending-insert/ );
		await suggestionSaved;

		await switchIntent( page, 'Editing' );
		const sidebar = await decideSuggestion( page, 'Accept' );

		// The block stays, now as regular content with no pending treatment.
		await expect( inserted ).toContainText(
			'Brand new suggested paragraph'
		);
		await expect( inserted ).not.toHaveClass(
			/is-suggestion-pending-insert/
		);
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Brand new suggested paragraph' );

		await expect(
			sidebar.getByText( 'Applied', { exact: true } )
		).toBeVisible();
	} );

	test( 'reject — a rejected block insertion removes the block', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Existing paragraph' },
		} );

		await switchIntent( page, 'Suggesting' );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first()
			.click();
		await page.keyboard.press( 'End' );
		// Attach the auto-save listener before the edit starts the debounce.
		const suggestionSaved = suggestionSavedPromise( page );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Brand new suggested paragraph' );
		await suggestionSaved;

		await switchIntent( page, 'Editing' );
		const sidebar = await decideSuggestion( page, 'Reject' );

		// The suggested insertion is undone entirely.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveCount( 1 );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( 'Brand new suggested paragraph' );
		expect( serialized ).toContain( 'Existing paragraph' );

		await expect(
			sidebar.getByText( 'Rejected', { exact: true } )
		).toBeVisible();
	} );

	// --- Review: block-move ---------------------------------------------------

	test( 'accept — an accepted block move keeps the new order and clears the ghost', async ( {
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
		// Select via the store: the freshly-inserted second block's floating
		// toolbar hovers over the first paragraph and intercepts a raw click.
		await editor.selectBlocks( mover );
		// Attach the auto-save listener before the edit starts the debounce.
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockToolbarButton( 'Move down' );
		await suggestionSaved;

		await switchIntent( page, 'Editing' );
		const sidebar = await decideSuggestion( page, 'Accept' );

		// The proposed order becomes the real order; treatment and ghost go.
		await expect( mover ).not.toHaveClass( /is-suggestion-pending-move/ );
		await expect(
			editor.canvas.locator( '.is-suggestion-move-ghost' )
		).toHaveCount( 0 );
		const serialized = await editor.getEditedPostContent();
		expect( serialized.indexOf( 'Second paragraph' ) ).toBeLessThan(
			serialized.indexOf( 'First paragraph' )
		);

		await expect(
			sidebar.getByText( 'Applied', { exact: true } )
		).toBeVisible();
	} );

	test( 'reject — a rejected block move restores the original order', async ( {
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
		// Select via the store: the freshly-inserted second block's floating
		// toolbar hovers over the first paragraph and intercepts a raw click.
		await editor.selectBlocks( mover );
		// Attach the auto-save listener before the edit starts the debounce.
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockToolbarButton( 'Move down' );
		await suggestionSaved;

		await switchIntent( page, 'Editing' );
		const sidebar = await decideSuggestion( page, 'Reject' );

		// The block returns to where it was; treatment and ghost go.
		await expect( mover ).not.toHaveClass( /is-suggestion-pending-move/ );
		await expect(
			editor.canvas.locator( '.is-suggestion-move-ghost' )
		).toHaveCount( 0 );
		const serialized = await editor.getEditedPostContent();
		expect( serialized.indexOf( 'First paragraph' ) ).toBeLessThan(
			serialized.indexOf( 'Second paragraph' )
		);

		await expect(
			sidebar.getByText( 'Rejected', { exact: true } )
		).toBeVisible();
	} );
} );
