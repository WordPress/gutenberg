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

	// Skipped: asserts an automatic debounced auto-save
	// (POST /wp/v2/comments). On this branch a suggestion is only
	// persisted via the explicit commit-bar Submit button; the debounced
	// auto-save subsystem lands in Phase 6 (#78308), which is not in this
	// branch's ancestry. Re-enable once #78308 is in this stack's base.
	// See: https://github.com/WordPress/gutenberg/pull/78308
	// eslint-disable-next-line playwright/no-skipped-test -- intentional; tracked by #78308.
	test.skip( 'auto-saves a content edit as a suggestion', async ( {
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

	// Skipped: relies on the debounced auto-save (POST /wp/v2/comments) to
	// persist the captured suggestion. That subsystem lands in Phase 6
	// (#78308) and is not in this branch's ancestry; on this branch the
	// suggestion is only persisted via the explicit commit-bar Submit
	// button. Re-enable once #78308 is in this stack's base.
	// See: https://github.com/WordPress/gutenberg/pull/78308
	// eslint-disable-next-line playwright/no-skipped-test -- intentional; tracked by #78308.
	test.skip( 'captures a heading-level change made via the block-switcher variation picker', async ( {
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
		await switchIntent( page, 'Suggest' );

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
} );
