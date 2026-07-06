/**
 * E2E coverage for Suggest mode (#77867). These tests exercise the core
 * suggestion layer: the mode-change snackbar announcement, auto-saving a
 * content edit as a suggestion, routing of block-switcher mutations through
 * the store interceptor, and the empty-inserted-block guard.
 *
 * The inline "golden paths" (typed/deleted text rendered as in-content
 * `<mark class="wp-suggestion">` markers) live with the inline-suggestions
 * layer, which owns that rendering.
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

test.describe( 'Suggestion mode', () => {
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

	test( 'announces the mode change with a snackbar', async ( { page } ) => {
		// The mode change also fires an a11y live-region announcement
		// carrying the same text, so scope to the snackbar list to avoid a
		// strict-mode match on both the snackbar and the live region.
		const snackbarList = page.locator( '.components-snackbar-list' );

		await switchIntent( page, 'Suggesting' );
		await expect(
			snackbarList.getByText( "You're suggesting" )
		).toBeVisible();

		await switchIntent( page, 'Editing' );
		await expect(
			snackbarList.getByText( "You're editing" )
		).toBeVisible();
	} );

	test( 'auto-saves a content edit as a suggestion', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Original content' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' plus suggested' );

		// Option B: the typed addition lives in content wrapped in a
		// `wp-suggestion` add marker (stripped only at the front end until
		// accepted), so it round-trips through the serialized post.
		await expect( paragraph ).toContainText(
			'Original content plus suggested'
		);

		// The addition's `data-suggestion-id` is minted by the note comment
		// created during typing, and the marker is only written once that id
		// resolves — so a populated id is race-free proof the suggestion
		// auto-saved. (Unlike `waitForResponse`, which can't catch a POST that
		// already landed while the text was being typed.) Typing routes
		// through the inline-marker path, which bypasses the overlay, so the
		// block doesn't take the overlay-only `is-suggestion-pending` bracket.
		const marker = paragraph.locator(
			'mark.wp-suggestion[data-suggestion-type="add"]'
		);
		await expect( marker ).toContainText( 'plus suggested' );
		await expect( marker ).toHaveAttribute( 'data-suggestion-id', /\d/ );

		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Original content' );
		expect( serialized ).toContain( 'data-suggestion-type="add"' );
		expect( serialized ).toContain( 'plus suggested' );
	} );

	test( 'add — golden path: typed text becomes an in-content add marker', async ( {
		editor,
		page,
	} ) => {
		// Golden-path text addition (Option B): typing in Suggest mode wraps
		// the new run in an in-content `core/suggestion` add marker rather
		// than diverting it to the overlay. The marker is visible immediately
		// (no blur needed) and the proposed text lives in the serialized post
		// content, stripped only at the front end until accepted.
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

		// The note is created asynchronously, then the marker is written.
		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="add"]'
			)
		).toContainText( 'world' );

		// The proposed text now lives in content as a marker (Option B), so
		// it round-trips through the serialized post — unlike the old overlay.
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'data-suggestion-type="add"' );
		expect( serialized ).toContain( 'Hello' );
	} );

	test( 'add — undo removes the typed marker', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		/*
		 * Typing in Suggest mode writes the add marker via
		 * updateBlockAttributes, so it participates in the editor undo stack
		 * like any attribute edit. Undo must remove the marker (and its
		 * proposed text) from content without crashing the editor.
		 *
		 * TODO: redo does NOT currently restore the marker — the marker
		 * write coalesces with surrounding non-persistent bookkeeping so
		 * there is no redo level to reapply. Defining redo semantics is part
		 * of the undo/redo follow-up. Undo also leaves the backing note
		 * comment in place — an orphaned note with no marker. Reconciling
		 * orphaned notes/markers is a pending design discussion; see the
		 * "Known limitations" section of
		 * docs/explanations/architecture/suggestions.md.
		 */
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
		// A single character keeps the marker write to one attribute update.
		await page.keyboard.type( '!' );

		const marker = paragraph.locator(
			'mark.wp-suggestion[data-suggestion-type="add"]'
		);
		// The marker is only written once the async note id resolves, so a
		// populated id means the write (the undo step under test) landed.
		await expect( marker ).toHaveAttribute( 'data-suggestion-id', /\d/ );

		await pageUtils.pressKeys( 'primary+z' );

		// The marker and its proposed text are gone from content…
		await expect( marker ).toHaveCount( 0 );
		await expect( paragraph ).toHaveText( 'Hello' );
		const serializedAfterUndo = await editor.getEditedPostContent();
		expect( serializedAfterUndo ).not.toContain( 'data-suggestion-id' );

		// Redo must not crash the editor or reintroduce a marker (see the
		// TODO above for actual marker-restoring redo semantics).
		await pageUtils.pressKeys( 'primaryShift+z' );
		await expect( paragraph ).toBeVisible();
		const serializedAfterRedo = await editor.getEditedPostContent();
		expect( serializedAfterRedo ).not.toContain( 'data-suggestion-id' );
	} );

	test( 'add — the note summarizes the addition as "Add: …", not "Format: content"', async ( {
		editor,
		page,
	} ) => {
		// Regression: an inline addition created by typing produces an
		// `inline-suggestion` operation that carries no before/after text (the
		// proposed words live in the in-content marker, not the payload). The
		// sidebar summary used to fall through to the generic attribute branch
		// and label the note "Format: content"; it should read like a Google
		// Docs review note — Add: "new text".
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'This is your first post.' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		// Place the caret before "This" and type the suggested addition.
		await page.keyboard.press( 'Home' );
		await page.keyboard.type( 'new text' );

		// The addition is wrapped in an in-content add marker. Its
		// `data-suggestion-id` is minted by the note comment created during
		// typing, so reaching this point means the suggestion already exists —
		// no separate auto-save wait is needed for the inline path.
		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="add"]'
			)
		).toContainText( 'new text' );

		// Open the notes sidebar and read the suggestion's summary line.
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

		const summary = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.locator( '.editor-collab-sidebar-panel__suggestion-summary' );
		await expect( summary ).toBeVisible();
		await expect( summary ).toContainText( 'Add:' );
		await expect( summary ).toContainText( 'new text' );
		await expect( summary ).not.toContainText( 'Format:' );
	} );

	test( 'add — a whitespace-only addition summarizes as "Add: …", not "Format: content"', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Regression: inserting only whitespace in Suggest mode resolves to a
		// marker whose text is all spaces. The summary required the resolved
		// text to survive a `trim()` (and then collapsed its whitespace), so a
		// pure-whitespace edit fell back to "Format: content" instead of
		// quoting the added spaces.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Wordone.' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		// Place the caret between "Word" and "one." and type only spaces.
		await page.keyboard.press( 'Home' );
		await pageUtils.pressKeys( 'ArrowRight', { times: 4 } );
		await page.keyboard.type( '   ' );

		// The spaces are wrapped in an in-content add marker whose
		// `data-suggestion-id` is minted by the note comment created during
		// typing — its presence proves the suggestion already saved.
		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="add"]'
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );

		// Open the notes sidebar and read the suggestion's summary line.
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

		const summary = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.locator( '.editor-collab-sidebar-panel__suggestion-summary' );
		await expect( summary ).toBeVisible();
		await expect( summary ).toContainText( 'Add:' );
		await expect( summary ).not.toContainText( 'Format:' );
	} );

	test( 'delete — golden path: deleting a selection becomes an in-content del marker', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Golden-path text deletion (Option B): selecting a run and pressing
		// Backspace wraps it in a `del` marker in content instead of removing
		// it. The text survives (struck through) until the suggestion is
		// accepted, and the marker is visible immediately.
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
		// Select "world" (five characters) then delete.
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
		await page.keyboard.press( 'Backspace' );

		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="del"]'
			)
		).toContainText( 'world' );

		// Deletion keeps the text until the suggestion is accepted.
		await expect( paragraph ).toContainText( 'Hello world' );
	} );

	test( 'type-over: replacing a selection becomes a del + add pair', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Typing over a selection proposes deleting the old text and adding
		// the replacement, as two adjacent markers.
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
		await page.keyboard.type( 'planet' );

		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="del"]'
			)
		).toContainText( 'world' );
		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="add"]'
			)
		).toContainText( 'planet' );
	} );

	test( 'collapsed delete: Backspace at a caret marks the previous character', async ( {
		editor,
		page,
	} ) => {
		// Backspace with no selection marks the character before the caret
		// for deletion instead of removing it.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'abcdef' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'Backspace' );

		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="del"]'
			)
		).toContainText( 'f' );
		// The character is kept until accepted.
		await expect( paragraph ).toContainText( 'abcdef' );
	} );

	test( 'style — golden path: bolding a word wraps the run in one format marker (no duplication)', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Golden-path inline-format change (Option B, Google Docs model):
		// select a word and press Cmd/Ctrl+B, and the run is wrapped in a
		// single in-content `core/suggestion` `format` marker carrying the
		// proposed `<strong>`. The text is shown once — not duplicated into a
		// paired del/ins overlay diff — and lives in the serialized post
		// content, stripped only at the front end until accepted.
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

		// The note is created asynchronously, then the marker is written over
		// the reformatted run. Its presence proves the whole flow completed.
		const marker = paragraph.locator(
			'mark.wp-suggestion[data-suggestion-type="format"]'
		);
		await expect( marker ).toContainText( 'world' );

		// The proposed bold is preserved inside the marker; the run is shown
		// once (the text is "Hello world", not "Hello worldworld").
		await expect( paragraph.locator( 'strong' ) ).toContainText( 'world' );
		await expect( paragraph ).toHaveText( 'Hello world' );

		// No overlay diff: the format change lives entirely as a mark, so the
		// old paired `<del>`/`<ins>` treatment never appears.
		await expect(
			paragraph.locator( 'del.has-suggestion-deletion' )
		).toHaveCount( 0 );
		await expect(
			paragraph.locator( 'ins.has-suggestion-addition' )
		).toHaveCount( 0 );

		// The proposed formatting round-trips through the serialized post as a
		// format marker (unlike the old render-only overlay).
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'data-suggestion-type="format"' );
		expect( serialized ).toContain( '<strong>' );

		// The sidebar reads the change as "Formatting: bold", not a text edit.
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
		const summary = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.locator( '.editor-collab-sidebar-panel__suggestion-summary' );
		await expect( summary ).toBeVisible();
		await expect( summary ).toContainText( 'Formatting:' );
		await expect( summary ).toContainText( 'bold' );
	} );

	test( 'captures a heading-level change made via the block-switcher variation picker', async ( {
		editor,
		page,
	} ) => {
		// The block-switcher dispatches `updateBlockAttributes` directly on
		// the block-editor store, bypassing the BlockEdit `setAttributes`
		// prop the overlay HOC intercepts. The store interceptor catches
		// these mutations and reroutes them into the overlay so the change
		// becomes a suggestion rather than a real edit.
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'My Heading', level: 2 },
		} );

		await switchIntent( page, 'Suggesting' );

		const heading = editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.first();
		await heading.click();

		// Open the block-switcher and pick the H3 variation. The block-
		// switcher's accessible name reflects the active heading variation
		// ("Heading 2"), not the bare block name.
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: /^Heading 2$/ } )
			.click();
		// Attach the auto-save listener before the edit starts the debounce.
		const suggestionSaved = suggestionSavedPromise( page );
		await page.getByRole( 'menuitem', { name: /^Heading 3/ } ).click();

		// Overlay reflects the user's change in the rendered DOM. The
		// heading block renders the level as the actual `h{n}` tag, so
		// check the tag name rather than `aria-level`.
		await expect( heading ).toHaveJSProperty( 'tagName', 'H3' );

		// But the serialized post still says level 2 — the interceptor
		// reverted the underlying store and routed the change to the overlay.
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( '<!-- wp:heading' );
		expect( serialized ).not.toContain( '"level":3' );

		// Auto-save persists the suggestion to a note comment.
		await suggestionSaved;
		await expect( heading ).toHaveClass( /is-suggestion-pending/ );
	} );

	test( 'does not suggest an empty inserted block until it has content', async ( {
		editor,
		page,
	} ) => {
		// Clicking the default block appender (the empty canvas space below
		// the last block) inserts an unmodified default paragraph via
		// `insertDefaultBlock`. In Suggest mode that empty block must NOT
		// become an "Insert block" suggestion on its own — the suggestion
		// should only appear once the user types content into it. See the
		// store interceptor's new-block branch.
		await switchIntent( page, 'Suggesting' );

		// Click the default block appender to insert an empty paragraph —
		// the same path as clicking the empty space below the last block.
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();

		const block = editor.canvas
			.locator( '[data-type="core/paragraph"]' )
			.first();
		await expect( block ).toBeVisible();

		// The empty inserted block must not carry the insertion-suggestion
		// treatment. The interceptor tags `pending-insert` synchronously on
		// the same store update that inserts the block, so with the bug the
		// class is already present by the time the block renders.
		await expect( block ).not.toHaveClass( /is-suggestion-pending-insert/ );

		// Once the user types into the new block, it becomes a suggestion.
		await page.keyboard.type( 'Newly added text' );
		await expect( block ).toHaveClass( /is-suggestion-pending-insert/ );
	} );

	test( 'insert — typing into a new paragraph yields ONE "Insert block" note, not an extra "Add" note', async ( {
		editor,
		page,
	} ) => {
		// Regression: the inline addition keyboard used to intercept the
		// first keystroke inside a freshly-inserted empty paragraph and open
		// its own "Add: …" note; the note's metadata.noteId write then made
		// the deferred empty block look modified, so the interceptor
		// registered a second, structural "Insert block" note for the same
		// action. Typing inside a pending/deferred insertion must fall
		// through natively and stay part of the single insertion suggestion.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Existing paragraph' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );

		// Attach the auto-save listener before the edit starts the debounce.
		const suggestionSaved = suggestionSavedPromise( page );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Massa praesent interdum' );

		const newParagraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.nth( 1 );
		await expect( newParagraph ).toContainText( 'Massa praesent interdum' );
		await expect( newParagraph ).toHaveClass(
			/is-suggestion-pending-insert/
		);
		// The typed text is plain content of the inserted block — NOT wrapped
		// in an inline add marker (that would be the second suggestion).
		await expect(
			newParagraph.locator( 'mark.wp-suggestion' )
		).toHaveCount( 0 );

		// The pre-existing paragraph is untouched.
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( 'data-suggestion-type' );

		await suggestionSaved;

		// Exactly one note — the block insertion — and no "Add" note.
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
		const summaries = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.locator( '.editor-collab-sidebar-panel__suggestion-summary' );
		await expect( summaries ).toHaveCount( 1 );
		await expect( summaries ).toContainText( 'Insert block:' );
		await expect( summaries ).not.toContainText( 'Add:' );
	} );

	test( 'paste — a single-line paste becomes an in-content add marker', async ( {
		editor,
		page,
		pageUtils,
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

		pageUtils.setClipboardData( { plainText: ' pasted words' } );
		await pageUtils.pressKeys( 'primary+v' );

		// The pasted run lands as a single add marker, not a raw commit.
		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="add"]'
			)
		).toContainText( 'pasted words' );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Hello' );
		expect( serialized ).toContain( 'data-suggestion-type="add"' );
	} );

	test( 'an open settings sidebar switches to All notes when a suggestion is created', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello' },
		} );
		await editor.openDocumentSettingsSidebar();

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		const suggestionSaved = suggestionSavedPromise( page );
		await page.keyboard.type( '!' );
		await suggestionSaved;

		// The open non-notes sidebar is switched to the notes sidebar so the
		// fresh suggestion note is immediately visible.
		const sidebar = page.getByRole( 'region', { name: 'Editor settings' } );
		await expect(
			sidebar.getByRole( 'heading', { name: 'All notes' } )
		).toBeVisible();
		await expect(
			sidebar.locator(
				'.editor-collab-sidebar-panel__suggestion-summary'
			)
		).toContainText( 'Add:' );
	} );
} );
