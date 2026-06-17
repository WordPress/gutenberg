/**
 * E2E coverage for Suggest mode (#77867). The diff-rendering scenarios below
 * are the "golden paths" referenced in the PR description:
 *
 *   - `add — golden path`    : type a word, see it wrapped in
 *                              `<ins class="has-suggestion-addition">`.
 *   - `delete — golden path` : Backspace a word, see it survive in
 *                              `<del class="has-suggestion-deletion">`.
 *   - `style — golden path`  : Cmd/Ctrl+B a word, see it render bold AND
 *                              wrapped in the addition format, with the
 *                              pre-bold version surfacing as a paired `<del>`.
 *
 * Other tests in this file cover snackbar announcements, auto-save, and
 * routing of block-switcher mutations through the store interceptor.
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

async function waitForSuggestionSaved( page ) {
	// Auto-save is debounced; wait for the REST call to land.
	await page.waitForResponse(
		( response ) =>
			/\/wp\/v2\/comments(\?|$|\/)/.test( response.url() ) &&
			[ 'POST', 'PUT' ].includes( response.request().method() ) &&
			response.ok()
	);
}

test.describe( 'Suggestion mode', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
	} );

	test( 'announces the mode change with a snackbar', async ( { page } ) => {
		// The mode change also fires an a11y live-region announcement
		// carrying the same text, so scope to the snackbar list to avoid a
		// strict-mode match on both the snackbar and the live region.
		const snackbarList = page.locator( '.components-snackbar-list' );

		await switchIntent( page, 'Suggest' );
		await expect(
			snackbarList.getByText( "You're suggesting" )
		).toBeVisible();

		await switchIntent( page, 'Edit' );
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

		await switchIntent( page, 'Suggest' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' plus suggested' );

		// Overlay reflects the proposed content, block store does not.
		await expect( paragraph ).toContainText(
			'Original content plus suggested'
		);
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Original content' );
		expect( serialized ).not.toContain( 'plus suggested' );

		// Auto-save fires after the debounce window.
		await waitForSuggestionSaved( page );

		// Edited block picks up the pending-suggestion outline.
		await expect( paragraph ).toHaveClass( /is-suggestion-pending/ );
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

		await switchIntent( page, 'Suggest' );

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

		await switchIntent( page, 'Suggest' );

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

		await switchIntent( page, 'Suggest' );

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

		await switchIntent( page, 'Suggest' );

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

	test( 'style — golden path: shows a newly bolded word wrapped in <ins> with <strong> preserved', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Golden-path inline-format change: select a word, press Cmd/Ctrl+B
		// to bold it, and the suggestion preview should mark the run as
		// added (so it reads as both bold AND highlighted) without losing
		// the underlying <strong> markup. The diff sees the bare token
		// replaced by the wrapped one, so it surfaces as a delete + insert
		// pair around the styled run.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello world' },
		} );

		await switchIntent( page, 'Suggest' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
		await pageUtils.pressKeys( 'primary+b' );

		await waitForSuggestionSaved( page );
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
		} );

		// The bolded run is wrapped in `<ins>` so it picks up the addition
		// color treatment, with `<strong>` preserved inside so it still
		// renders as bold.
		await expect(
			paragraph.locator( 'ins.has-suggestion-addition strong' )
		).toContainText( 'world' );

		// And the bare-text version is shown as a deletion so the reviewer
		// can see what the run looked like before the suggestion.
		await expect(
			paragraph.locator( 'del.has-suggestion-deletion' )
		).toContainText( 'world' );
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

		await switchIntent( page, 'Suggest' );

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
		await waitForSuggestionSaved( page );
		await expect( heading ).toHaveClass( /is-suggestion-pending/ );
	} );
} );
