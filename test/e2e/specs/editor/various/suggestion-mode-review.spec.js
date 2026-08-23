/**
 * E2E coverage for the Suggest mode review cycle (#73411): the full loop of
 * making a suggestion, then accepting or rejecting it from the notes sidebar.
 *
 * Capture-side golden paths (typing, deleting, formatting, block insertion)
 * live in `suggestion-mode.spec.js`; this spec picks up where those leave
 * off — the block-remove and block-move structural captures, and the
 * accept/reject decision for every suggestion kind:
 *
 *   - attribute-set   (heading level via the block switcher)
 *   - block-remove    (delete a block)
 *   - block-insert    (add a block)
 *   - block-move      (reorder blocks)
 *   - inline add/del/format markers (typed text, deletions, bold)
 *
 * Reviews happen in Editing intent: structural markers are persisted on the
 * live block, so a post author sees the pending treatment and the sidebar
 * decision buttons without entering Suggest mode themselves.
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

	test( 'summary — an attribute change and an inline format change read as two different kinds', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		/*
		 * The sidebar is a mixed list, and a block-attribute change used to
		 * arrive there as "Format: heading level" right next to an inline
		 * formatting change reading "Formatting: bold" — two families of
		 * suggestion one word apart (F-16). The labels have to be tellable
		 * apart at a glance.
		 */
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'My Heading', level: 2 },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello world' },
		} );

		await switchIntent( page, 'Suggesting' );

		// An inline format suggestion: bold the trailing word.
		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
		const formatSaved = suggestionSavedPromise( page );
		await pageUtils.pressKeys( 'primary+b' );
		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="format"]'
			)
		).toContainText( 'world' );
		await formatSaved;

		// A block attribute suggestion: demote the heading.
		const heading = editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.first();
		await heading.click();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: /^Heading 2$/ } )
			.click();
		const attributeSaved = suggestionSavedPromise( page );
		await page.getByRole( 'menuitem', { name: /^Heading 3/ } ).click();
		await attributeSaved;

		const sidebar = await openNotesSidebar( page );
		const summaries = sidebar.locator(
			'.editor-collab-sidebar-panel__suggestion-summary'
		);
		await expect( summaries ).toHaveCount( 2 );

		const summaryText = async () =>
			( await summaries.allInnerTexts() ).join( '\n' );
		// Positive signals first: both suggestions are described.
		await expect.poll( summaryText ).toContain( 'Formatting: bold' );
		await expect.poll( summaryText ).toContain( 'Change: heading level' );
		// And the old near-collision is gone.
		expect( await summaryText() ).not.toMatch( /(^|\W)Format:/ );
	} );

	test( 'accept — an accepted text-alignment change lands in the post content', async ( {
		editor,
		page,
	} ) => {
		/*
		 * Text alignment is a block support writing `style.typography
		 * .textAlign` straight to the store, so the store interceptor
		 * captures it as an attribute suggestion. Note the treatment class is
		 * the only visible cue while pending: the alignment class itself is
		 * applied by the support's `useBlockProps` hook from the (reverted)
		 * store attributes, so the proposed alignment renders only once
		 * accepted.
		 */
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Align me' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await editor.selectBlocks( paragraph );
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Align text' } )
			.click();
		// Attach the auto-save listener before the edit starts the debounce.
		const suggestionSaved = suggestionSavedPromise( page );
		await page
			.getByRole( 'menuitemradio', { name: 'Align text center' } )
			.click();
		await suggestionSaved;

		// Captured as a pending attribute suggestion; nothing committed.
		await expect( paragraph ).toHaveClass( /is-suggestion-pending/ );
		let serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( 'has-text-align-center' );

		// Review as the post author, outside Suggest mode.
		await switchIntent( page, 'Editing' );
		await decideSuggestion( page, 'Accept' );

		// The alignment lands in the block and the post content.
		await expect( paragraph ).toHaveClass( /has-text-align-center/ );
		serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'has-text-align-center' );
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

	// --- Review: inline markers (add / del / format) --------------------------

	test( 'accept — an accepted addition unwraps the marker and keeps the text', async ( {
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
		await page.keyboard.type( ' world' );

		// A populated id proves the note comment saved (see
		// suggestion-mode.spec.js for the rationale).
		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="add"]'
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );

		await switchIntent( page, 'Editing' );
		const sidebar = await decideSuggestion( page, 'Accept' );

		// The proposed text is now permanent content, marker gone.
		await expect( paragraph ).toHaveText( 'Hello world' );
		await expect( paragraph.locator( 'mark.wp-suggestion' ) ).toHaveCount(
			0
		);
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Hello world' );
		expect( serialized ).not.toContain( 'data-suggestion' );

		await expect(
			sidebar.getByText( 'Applied', { exact: true } )
		).toBeVisible();
	} );

	test( 'reject — a rejected addition removes the proposed text', async ( {
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
		await page.keyboard.type( ' world' );

		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="add"]'
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );

		await switchIntent( page, 'Editing' );
		const sidebar = await decideSuggestion( page, 'Reject' );

		// The block reads exactly as it did before the suggestion.
		await expect( paragraph ).toHaveText( 'Hello' );
		await expect( paragraph.locator( 'mark.wp-suggestion' ) ).toHaveCount(
			0
		);
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( 'world' );
		expect( serialized ).not.toContain( 'data-suggestion' );

		await expect(
			sidebar.getByText( 'Rejected', { exact: true } )
		).toBeVisible();
	} );

	test( 'accept — an accepted deletion removes the marked text', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello world' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
		await page.keyboard.press( 'Backspace' );

		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="del"]'
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );

		await switchIntent( page, 'Editing' );
		const sidebar = await decideSuggestion( page, 'Accept' );

		// The struck-through text is finally removed.
		await expect( paragraph ).not.toContainText( 'world' );
		await expect( paragraph ).toContainText( 'Hello' );
		await expect( paragraph.locator( 'mark.wp-suggestion' ) ).toHaveCount(
			0
		);
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( 'world' );
		expect( serialized ).not.toContain( 'data-suggestion' );

		await expect(
			sidebar.getByText( 'Applied', { exact: true } )
		).toBeVisible();
	} );

	test( 'reject — a rejected deletion keeps the text and drops the marker', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello world' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
		await page.keyboard.press( 'Backspace' );

		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="del"]'
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );

		await switchIntent( page, 'Editing' );
		const sidebar = await decideSuggestion( page, 'Reject' );

		// The text survives, back to plain content.
		await expect( paragraph ).toHaveText( 'Hello world' );
		await expect( paragraph.locator( 'mark.wp-suggestion' ) ).toHaveCount(
			0
		);
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Hello world' );
		expect( serialized ).not.toContain( 'data-suggestion' );

		await expect(
			sidebar.getByText( 'Rejected', { exact: true } )
		).toBeVisible();
	} );

	test( 'accept — an accepted format suggestion keeps the proposed formatting', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello world' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
		await pageUtils.pressKeys( 'primary+b' );

		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="format"]'
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );

		await switchIntent( page, 'Editing' );
		const sidebar = await decideSuggestion( page, 'Accept' );

		// The bold survives as regular formatting; the marker is unwrapped.
		await expect( paragraph.locator( 'strong' ) ).toContainText( 'world' );
		await expect( paragraph ).toHaveText( 'Hello world' );
		await expect( paragraph.locator( 'mark.wp-suggestion' ) ).toHaveCount(
			0
		);
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( '<strong>' );
		expect( serialized ).not.toContain( 'data-suggestion' );

		await expect(
			sidebar.getByText( 'Applied', { exact: true } )
		).toBeVisible();
	} );

	test( 'reject — a rejected format suggestion restores the original run', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello world' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
		await pageUtils.pressKeys( 'primary+b' );

		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="format"]'
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );

		await switchIntent( page, 'Editing' );
		const sidebar = await decideSuggestion( page, 'Reject' );

		// Text intact, no bold, no marker — as if nothing was proposed.
		await expect( paragraph ).toHaveText( 'Hello world' );
		await expect( paragraph.locator( 'strong' ) ).toHaveCount( 0 );
		await expect( paragraph.locator( 'mark.wp-suggestion' ) ).toHaveCount(
			0
		);
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( '<strong>' );
		expect( serialized ).not.toContain( 'data-suggestion' );

		await expect(
			sidebar.getByText( 'Rejected', { exact: true } )
		).toBeVisible();
	} );

	test( 'an inline decision leaves a co-resident attribute suggestion pending', async ( {
		editor,
		page,
	} ) => {
		// A heading can hold two independent suggestions at once: an
		// attribute-set overlay for its level, and an inline marker in its
		// text. They describe disjoint parts of the block, so deciding one
		// must not disturb the other. The apply/reject paths for an inline
		// marker used to clear the block's whole overlay entry, which is the
		// attribute note's only anchor — the note was collected as an orphan
		// and its proposed level vanished from the canvas. See F-14.
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'My Heading', level: 2 },
		} );

		await switchIntent( page, 'Suggesting' );

		const heading = editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.first();
		await heading.click();

		// Suggestion one: heading level, captured into the overlay.
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: /^Heading 2$/ } )
			.click();
		const attributeSaved = suggestionSavedPromise( page );
		await page.getByRole( 'menuitem', { name: /^Heading 3/ } ).click();
		await attributeSaved;
		await expect( heading ).toHaveJSProperty( 'tagName', 'H3' );

		// Suggestion two: typed text in the same heading, captured as a marker.
		await heading.click();
		await page.keyboard.press( 'End' );
		const inlineSaved = suggestionSavedPromise( page );
		await page.keyboard.type( ' XYZ' );
		await inlineSaved;
		await expect(
			heading.locator( 'mark.wp-suggestion[data-suggestion-type="add"]' )
		).toHaveAttribute( 'data-suggestion-id', /\d/ );

		// Both suggestions are listed as their own threads.
		const sidebar = await openNotesSidebar( page );
		const threads = sidebar.locator(
			'.editor-collab-sidebar-panel__thread'
		);
		await expect( threads ).toHaveCount( 2 );

		// Accept the inline one, picked by the thread carrying its summary —
		// thread order is not guaranteed, so index-based selection would
		// silently decide the wrong suggestion.
		await threads
			.filter( { hasText: 'XYZ' } )
			.getByRole( 'button', { name: 'Accept suggestion' } )
			.click();
		await expect(
			page
				.locator( '.components-snackbar-list' )
				.getByText( 'Suggestion applied.' )
		).toBeVisible();

		// The addition landed: marker unwrapped, text kept.
		await expect( heading.locator( 'mark.wp-suggestion' ) ).toHaveCount(
			0
		);
		await expect( heading ).toHaveText( 'My Heading XYZ' );

		/*
		 * Let the state settle before judging the level suggestion. Both
		 * failure modes are asynchronous — the orphan collector waits out its
		 * 500ms grace period and then round-trips a status write — so an
		 * assertion that retries until it passes would go green on the state
		 * before the damage, not after it.
		 */
		// eslint-disable-next-line no-restricted-syntax, playwright/no-wait-for-timeout
		await page.waitForTimeout( 3000 );

		// The level suggestion is untouched: still previewed on the canvas,
		// still listed in the sidebar, still pending on the server.
		await expect( heading ).toHaveJSProperty( 'tagName', 'H3' );
		await expect( sidebar.getByText( /heading level/ ) ).toBeVisible();
		const attributeNoteStatuses = await page.evaluate( async () => {
			const postId = window.wp.data
				.select( 'core/editor' )
				.getCurrentPostId();
			const comments = await window.wp.apiFetch( {
				path: `/wp/v2/comments?type=note&status=any&per_page=50&context=edit&post=${ postId }`,
			} );
			return comments
				.filter( ( comment ) =>
					/attribute-set/.test( comment.meta?._wp_suggestion ?? '' )
				)
				.map( ( comment ) => comment.status );
		} );
		expect( attributeNoteStatuses ).toEqual( [ 'hold' ] );
	} );

	// --- Review: block replacement (transform) -------------------------------

	/**
	 * Transform the first paragraph into a Quote through the block switcher.
	 *
	 * @param {import('@playwright/test').Page} page   Playwright page.
	 * @param {Object}                          editor Editor utils.
	 */
	async function transformParagraphToQuote( page, editor ) {
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first()
			.click();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Paragraph' } )
			.click();
		await page
			.getByRole( 'menuitem', { name: 'Quote', exact: true } )
			.click();
	}

	/**
	 * Read every suggestion note's lifecycle status straight from the REST
	 * API. The sidebar drops a card whose block has left the tree, so an
	 * accepted removal can't be confirmed from the DOM.
	 *
	 * @param {import('@playwright/test').Page} page Playwright page.
	 * @return {Promise<string[]>} Statuses, oldest note first.
	 */
	async function suggestionStatuses( page ) {
		return page.evaluate( async () => {
			// Scoped to this post: earlier tests in the same worker leave
			// their own pending notes behind until the suite's afterAll.
			const postId = window.wp.data
				.select( 'core/editor' )
				.getCurrentPostId();
			const notes = await window.wp.apiFetch( {
				path: `/wp/v2/comments?type=note&status=any&per_page=50&order=asc&post=${ postId }`,
			} );
			return notes
				.filter( ( note ) => !! note.meta?._wp_suggestion )
				.map(
					( note ) => note.meta?._wp_suggestion_status || 'pending'
				);
		} );
	}

	test( 'transform — a block-switcher transform links both halves with one group id', async ( {
		editor,
		page,
	} ) => {
		// `replaceBlocks` is captured as a removal plus an insertion. They
		// are one logical change, so both halves must carry the same
		// `metadata.suggestion.groupId` — without it a reviewer can accept
		// one and reject the other and end up with a duplicate or a hole.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Transform me' },
		} );

		await switchIntent( page, 'Suggesting' );

		const suggestionSaved = suggestionSavedPromise( page );
		await transformParagraphToQuote( page, editor );
		await suggestionSaved;

		const blocks = await editor.getBlocks();
		const removed = blocks.find(
			( block ) =>
				block.attributes?.metadata?.suggestion?.type ===
				'pending-remove'
		);
		const inserted = blocks.find(
			( block ) =>
				block.attributes?.metadata?.suggestion?.type ===
				'pending-insert'
		);
		expect( removed?.name ).toBe( 'core/paragraph' );
		expect( inserted?.name ).toBe( 'core/quote' );
		expect( inserted.attributes.metadata.suggestion.groupId ).toBeTruthy();
		expect( removed.attributes.metadata.suggestion.groupId ).toBe(
			inserted.attributes.metadata.suggestion.groupId
		);
	} );

	test( 'accept — accepting one half of a transform resolves both halves', async ( {
		editor,
		page,
	} ) => {
		// Accepting only the insertion used to leave the original paragraph
		// behind, still flagged for removal: one transform, two blocks, one
		// still-pending note.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Transform me' },
		} );

		await switchIntent( page, 'Suggesting' );

		const suggestionSaved = suggestionSavedPromise( page );
		await transformParagraphToQuote( page, editor );
		await suggestionSaved;

		await switchIntent( page, 'Editing' );
		const sidebar = await openNotesSidebar( page );
		await sidebar
			.getByRole( 'button', { name: 'Accept suggestion' } )
			.first()
			.click();
		await expect(
			page
				.locator( '.components-snackbar-list' )
				.getByText( 'Suggestion applied.' )
		).toBeVisible();

		// The quote is the only block left, with no pending treatment and
		// no leftover paragraph beside it.
		await expect
			.poll( async () =>
				( await editor.getBlocks() ).map( ( block ) => block.name )
			)
			.toEqual( [ 'core/quote' ] );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( '<!-- wp:quote' );
		expect( serialized ).not.toContain( 'pending-remove' );
		expect( serialized ).not.toContain( 'pending-insert' );

		// Both notes are resolved by the single decision.
		await expect
			.poll( () => suggestionStatuses( page ) )
			.toEqual( [ 'applied', 'applied' ] );
	} );

	test( 'reject — rejecting one half of a transform withdraws the whole change', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Transform me' },
		} );

		await switchIntent( page, 'Suggesting' );

		const suggestionSaved = suggestionSavedPromise( page );
		await transformParagraphToQuote( page, editor );
		await suggestionSaved;

		await switchIntent( page, 'Editing' );
		const sidebar = await openNotesSidebar( page );
		await sidebar
			.getByRole( 'button', { name: 'Reject suggestion' } )
			.first()
			.click();
		await expect(
			page
				.locator( '.components-snackbar-list' )
				.getByText( 'Suggestion rejected.' )
		).toBeVisible();

		// The document is back to the paragraph it started as.
		await expect
			.poll( async () =>
				( await editor.getBlocks() ).map( ( block ) => block.name )
			)
			.toEqual( [ 'core/paragraph' ] );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Transform me' );
		expect( serialized ).not.toContain( '<!-- wp:quote' );
		expect( serialized ).not.toContain( 'suggestion' );

		await expect
			.poll( () => suggestionStatuses( page ) )
			.toEqual( [ 'rejected', 'rejected' ] );
	} );

	// --- Sidebar summaries carry enough context to review (F-27) ------------

	test( 'summary — a whitespace-only addition is described, not quoted into invisibility', async ( {
		editor,
		page,
	} ) => {
		// HTML collapses a quoted run of spaces, so one typed space and three
		// typed spaces both rendered as `Add: " "` and a reviewer could not
		// tell them apart without opening the canvas.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Spacing test' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		const suggestionSaved = suggestionSavedPromise( page );
		await page.keyboard.type( '   ' );

		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="add"]'
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );
		await suggestionSaved;

		const sidebar = await openNotesSidebar( page );
		const summary = sidebar.locator(
			'.editor-collab-sidebar-panel__suggestion-summary'
		);
		await expect( summary ).toContainText( 'Add:' );
		await expect( summary ).toContainText( '3 spaces' );
	} );

	test( 'summary — a link suggestion records the URL it proposes', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// "Formatting: link" says a link changed but not which one, and the
		// URL is the entire substance of a link suggestion.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello world' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
		const suggestionSaved = suggestionSavedPromise( page );
		await pageUtils.pressKeys( 'primary+k' );
		await page
			.getByRole( 'combobox', { name: 'Search or type URL' } )
			.fill( 'https://example.com/handbook' );
		await page.keyboard.press( 'Enter' );

		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="format"]'
			)
		).toContainText( 'world' );
		await suggestionSaved;

		const sidebar = await openNotesSidebar( page );
		const summary = sidebar.locator(
			'.editor-collab-sidebar-panel__suggestion-summary'
		);
		await expect( summary ).toContainText( 'Add formatting:' );
		await expect( summary ).toContainText( 'https://example.com/handbook' );
	} );

	test( 'summary — a structural change inside a container names the container', async ( {
		editor,
		page,
	} ) => {
		// "Remove block: paragraph" reads identically whether the paragraph
		// sat at the top level or inside a Group, so nesting was invisible
		// from the sidebar.
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Inner keeper' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Inner goner' },
				},
			],
		} );

		await switchIntent( page, 'Suggesting' );

		const doomed = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Inner goner' } );
		await editor.selectBlocks( doomed );
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockOptionsMenuItem( 'Delete' );

		await expect( doomed ).toHaveClass( /is-suggestion-pending-remove/ );
		await suggestionSaved;

		const sidebar = await openNotesSidebar( page );
		const summary = sidebar.locator(
			'.editor-collab-sidebar-panel__suggestion-summary'
		);
		await expect( summary ).toContainText( 'Remove block:' );
		await expect( summary ).toContainText( 'paragraph in group' );
	} );
} );
