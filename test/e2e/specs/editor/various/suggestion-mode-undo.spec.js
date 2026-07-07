/**
 * E2E coverage for undo (cmd/ctrl+Z) while composing suggestions in Suggest
 * mode (#73411).
 *
 * The contract these tests pin down: undoing right after making a suggestion
 * restores the document to its pre-suggestion state — the proposed change is
 * reverted, any pending treatment (marker, strikethrough, ghost) is cleared,
 * and the suggestion's note is removed from the sidebar. A pending note whose
 * proposed change no longer exists has nothing left to accept or reject, so
 * it must not survive as an orphan.
 *
 * Just as important is what undo must NOT do: the capture machinery may not
 * re-capture the undo itself as a fresh suggestion (undoing a suggested
 * insertion must not spawn a "Remove block" suggestion, undoing a suggested
 * move must not spawn a counter-move, and so on).
 *
 * Granularity differs by kind. Inline text suggestions ride the real undo
 * stack, so undo steps back through them the way typing normally undoes.
 * Attribute suggestions live outside the undo stack entirely (the proposed
 * value is parked in the suggestion overlay while the real store stays at
 * baseline), and structural suggestions are compound state spread across
 * history transactions — for both, undo withdraws the pending suggestion
 * as a single unit.
 */

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const SUGGESTION_MARK = 'mark.wp-suggestion';

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
 * locator for the suggestion summaries rendered into it. Asserting on this
 * list is how the tests observe a note appearing and — after undo —
 * disappearing again.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 * @return {Promise<import('@playwright/test').Locator>} Summary locator.
 */
async function openSuggestionSummaries( page ) {
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
	return page
		.getByRole( 'region', { name: 'Editor settings' } )
		.locator( '.editor-collab-sidebar-panel__suggestion-summary' );
}

test.describe( 'Suggestion mode undo', () => {
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

	// --- Inline text suggestions ---------------------------------------------

	test( 'undo reverts a typed addition and removes its note', async ( {
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
		await page.keyboard.type( ' world' );

		// A populated id proves the note comment saved before we undo.
		await expect(
			paragraph.locator(
				`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );
		const summaries = await openSuggestionSummaries( page );
		await expect( summaries ).toHaveCount( 1 );

		await pageUtils.pressKeys( 'primary+z' );

		// The proposed text and its marker are gone; the block reads as it
		// did before the suggestion.
		await expect( paragraph ).toHaveText( 'Hello' );
		await expect( paragraph.locator( SUGGESTION_MARK ) ).toHaveCount( 0 );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( 'world' );
		expect( serialized ).not.toContain( 'data-suggestion' );

		// The note has nothing left to resolve, so it is removed too.
		await expect( summaries ).toHaveCount( 0 );
	} );

	test( 'undo reverts a suggested deletion and removes its note', async ( {
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
				`${ SUGGESTION_MARK }[data-suggestion-type="del"]`
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );
		const summaries = await openSuggestionSummaries( page );
		await expect( summaries ).toHaveCount( 1 );

		await pageUtils.pressKeys( 'primary+z' );

		// The strikethrough proposal is withdrawn: text intact, marker gone.
		await expect( paragraph ).toHaveText( 'Hello world' );
		await expect( paragraph.locator( SUGGESTION_MARK ) ).toHaveCount( 0 );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Hello world' );
		expect( serialized ).not.toContain( 'data-suggestion' );

		await expect( summaries ).toHaveCount( 0 );
	} );

	test( 'undo reverts a type-over replacement and removes both notes', async ( {
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
		await page.keyboard.type( 'there' );

		// Typing over a selection proposes a delete + add pair.
		await expect(
			paragraph.locator(
				`${ SUGGESTION_MARK }[data-suggestion-type="del"]`
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );
		await expect(
			paragraph.locator(
				`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );
		const summaries = await openSuggestionSummaries( page );
		await expect( summaries ).toHaveCount( 2 );

		// The replacement was one gesture, so one undo withdraws it whole:
		// the proposed text, the deletion marker, and both notes.
		await pageUtils.pressKeys( 'primary+z' );

		await expect( paragraph ).toHaveText( 'Hello world' );
		await expect( paragraph.locator( SUGGESTION_MARK ) ).toHaveCount( 0 );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( 'there' );
		expect( serialized ).not.toContain( 'data-suggestion' );

		await expect( summaries ).toHaveCount( 0 );
	} );

	test( 'undo reverts a format suggestion and removes its note', async ( {
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
				`${ SUGGESTION_MARK }[data-suggestion-type="format"]`
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );
		const summaries = await openSuggestionSummaries( page );
		await expect( summaries ).toHaveCount( 1 );

		await pageUtils.pressKeys( 'primary+z' );

		// The proposed bold is withdrawn along with its marker and note.
		await expect( paragraph ).toHaveText( 'Hello world' );
		await expect( paragraph.locator( 'strong' ) ).toHaveCount( 0 );
		await expect( paragraph.locator( SUGGESTION_MARK ) ).toHaveCount( 0 );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( '<strong>' );
		expect( serialized ).not.toContain( 'data-suggestion' );

		await expect( summaries ).toHaveCount( 0 );
	} );

	// --- Structural suggestions ----------------------------------------------

	test( 'undo withdraws a block-removal suggestion without spawning new ones', async ( {
		editor,
		page,
		pageUtils,
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

		await expect( doomed ).toHaveClass( /is-suggestion-pending-remove/ );
		await suggestionSaved;
		const summaries = await openSuggestionSummaries( page );
		await expect( summaries ).toHaveCount( 1 );

		await pageUtils.pressKeys( 'primary+z' );

		// The block sheds its pending-remove treatment and the note goes;
		// the document is back to its pre-suggestion state.
		await expect( doomed ).toBeVisible();
		await expect( doomed ).not.toHaveClass(
			/is-suggestion-pending-remove/
		);
		await expect( summaries ).toHaveCount( 0 );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Remove me' );
		expect( serialized ).not.toContain( '"suggestion"' );
	} );

	test( 'undo withdraws a block-insertion suggestion without spawning a removal', async ( {
		editor,
		page,
		pageUtils,
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
		const summaries = await openSuggestionSummaries( page );
		await expect( summaries ).toHaveCount( 1 );

		// A structural suggestion withdraws as one unit: a single undo takes
		// back the whole insertion (block and typed content together), and
		// must not be re-captured as a removal suggestion.
		await pageUtils.pressKeys( 'primary+z' );

		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveCount( 1 );
		await expect( summaries ).toHaveCount( 0 );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( 'Brand new suggested paragraph' );
		expect( serialized ).toContain( 'Existing paragraph' );
		expect( serialized ).not.toContain( '"suggestion"' );
	} );

	test( 'undo withdraws a block-move suggestion and restores the order', async ( {
		editor,
		page,
		pageUtils,
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

		await expect( mover ).toHaveClass( /is-suggestion-pending-move/ );
		await suggestionSaved;
		const summaries = await openSuggestionSummaries( page );
		await expect( summaries ).toHaveCount( 1 );

		await pageUtils.pressKeys( 'primary+z' );

		// Original order restored; treatment, ghost, and note all gone —
		// and no counter-move suggestion captured for the way back.
		await expect( mover ).not.toHaveClass( /is-suggestion-pending-move/ );
		await expect(
			editor.canvas.locator( '.is-suggestion-move-ghost' )
		).toHaveCount( 0 );
		await expect( summaries ).toHaveCount( 0 );
		const serialized = await editor.getEditedPostContent();
		expect( serialized.indexOf( 'First paragraph' ) ).toBeLessThan(
			serialized.indexOf( 'Second paragraph' )
		);
		expect( serialized ).not.toContain( '"suggestion"' );
	} );

	// --- Attribute suggestions -----------------------------------------------

	test( 'undo cancels a pending attribute suggestion', async ( {
		editor,
		page,
		pageUtils,
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
		const summaries = await openSuggestionSummaries( page );
		await expect( summaries ).toHaveCount( 1 );

		// The proposed level lives in the suggestion overlay (the real store
		// already sits at baseline), so undo cancels the suggestion itself.
		await pageUtils.pressKeys( 'primary+z' );

		await expect( summaries ).toHaveCount( 0 );
		await expect( heading ).toHaveJSProperty( 'tagName', 'H2' );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( '"level":3' );
	} );

	// --- Stacking ---------------------------------------------------------------

	test( 'repeated undo withdraws suggestions newest-first', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Alpha' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Beta' },
		} );

		await switchIntent( page, 'Suggesting' );

		// Suggestion 1: append text to the first paragraph. Select via the
		// store first: the freshly-inserted second block's floating toolbar
		// hovers over the first paragraph and intercepts a raw click.
		const alpha = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Alpha' } );
		await editor.selectBlocks( alpha );
		await alpha.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' one' );
		await expect(
			alpha.locator( `${ SUGGESTION_MARK }[data-suggestion-type="add"]` )
		).toHaveAttribute( 'data-suggestion-id', /\d/ );

		// Suggestion 2: remove the second paragraph.
		const beta = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Beta' } );
		await beta.click();
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockOptionsMenuItem( 'Delete' );
		await expect( beta ).toHaveClass( /is-suggestion-pending-remove/ );
		await suggestionSaved;

		const summaries = await openSuggestionSummaries( page );
		await expect( summaries ).toHaveCount( 2 );

		// First undo withdraws the newest suggestion (the removal)…
		await pageUtils.pressKeys( 'primary+z' );
		await expect( beta ).not.toHaveClass( /is-suggestion-pending-remove/ );
		await expect( summaries ).toHaveCount( 1 );
		await expect(
			alpha.locator( `${ SUGGESTION_MARK }[data-suggestion-type="add"]` )
		).toBeVisible();

		// …the second one withdraws the typed addition.
		await pageUtils.pressKeys( 'primary+z' );
		await expect( alpha ).toHaveText( 'Alpha' );
		await expect( summaries ).toHaveCount( 0 );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).not.toContain( 'data-suggestion' );
		expect( serialized ).not.toContain( '"suggestion"' );
	} );
} );
