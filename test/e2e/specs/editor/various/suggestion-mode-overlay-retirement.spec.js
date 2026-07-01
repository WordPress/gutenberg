/**
 * Phase 0 safety net for the overlay-retirement work (Option B) tracked in
 * #73411. Before any overlay code is deleted, these tests pin the behaviour the
 * migration must preserve and the seams it must close.
 *
 * Two groups:
 *
 *   1. INVARIANT - the end-state property the migration establishes: a single
 *      block never carries both an inline `<mark class="wp-suggestion">` marker
 *      AND an overlay `<del>/<ins class="has-suggestion-*">` diff. This holds
 *      now that Phase 2 moved formatting to markers, including when a formatting
 *      change and a text addition coexist on one block (non-overlapping runs).
 *      A formatting change whose run overlaps an existing marker still declines
 *      to the overlay; that narrower case is not yet exercised here.
 *
 *   2. SEAMS - edits that used to fall through to the overlay diff path instead
 *      of producing a marker, because marker creation keys off a narrow set of
 *      input events. Word/line delete, cut, and single-line paste now produce
 *      markers via the deletion/addition keyboards; the lower-level seams (IME,
 *      autocorrect, drag) remain and are validated by the reconcile-edit unit
 *      tests rather than e2e.
 *
 * The `fixme`s are the executable checklist: un-fixme each as its phase lands.
 * Formatting and block-attribute characterization already live in
 * `suggestion-mode.spec.js` (the "style golden path" and the heading-level
 * tests) and serve as the oracle for those categories.
 */

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const SUGGESTION_MARK = 'mark.wp-suggestion';
const OVERLAY_ADD = 'ins.has-suggestion-addition';
const OVERLAY_DEL = 'del.has-suggestion-deletion';

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
	// `MenuItemsChoice` keeps its dropdown open on selection; close it so a
	// later `Options` click reopens rather than toggles it shut.
	await page.keyboard.press( 'Escape' );
}

async function waitForSuggestionSaved( page ) {
	await page.waitForResponse(
		( response ) =>
			/\/wp\/v2\/comments(\?|$|\/)/.test( response.url() ) &&
			[ 'POST', 'PUT' ].includes( response.request().method() ) &&
			response.ok()
	);
}

async function deselect( page ) {
	// Inline marks render in place of the plain proposed value only once the
	// block is deselected.
	await page.evaluate( () => {
		window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
	} );
}

test.describe( 'Suggest mode: overlay-retirement safety net (Phase 0)', () => {
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

	// --- Invariant ---------------------------------------------------------

	// Two independent inline suggestions coexist on the SAME block: a formatting
	// change on one word and a text addition on another. Before Phase 2 the
	// formatting change took the overlay diff path, so the block carried both a
	// marker and an overlay diff; after Phase 2 the formatting change is its own
	// `format` marker, so the block carries only markers. `planFormatMarkers`
	// only declines when the changed run overlaps an existing marker, so a
	// formatting change on a non-overlapping word succeeds alongside an addition.
	test( 'invariant: a block never carries both an inline marker and an overlay diff', async ( {
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

		// Format marker: bold "world" (the trailing word), the proven
		// golden-path selection. The note is created asynchronously, so wait
		// on the marker landing rather than a single save response.
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
		await pageUtils.pressKeys( 'primary+b' );
		await expect(
			paragraph.locator(
				`${ SUGGESTION_MARK }[data-suggestion-type="format"]`
			)
		).toContainText( 'world' );

		// Addition marker: append at the end, past the formatted run, so the
		// two suggestions do not overlap.
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' more' );
		await expect(
			paragraph.locator(
				`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
			)
		).toBeVisible();

		await deselect( page );

		// The invariant: the block carries inline markers but no overlay
		// `<ins>`/`<del>` diff.
		const overlayDiff =
			( await paragraph.locator( OVERLAY_ADD ).count() ) +
			( await paragraph.locator( OVERLAY_DEL ).count() );
		expect( overlayDiff ).toBe( 0 );
	} );

	// --- Seams (close in Phase 1) -----------------------------------------

	test( 'seam: deleting a word backward becomes a deletion marker', async ( {
		editor,
		page,
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
		// Fire `deleteWordBackward`. The chord differs by platform: macOS
		// maps it to Option+Backspace, Windows/Linux (the CI runner) to
		// Ctrl+Backspace.
		await page.keyboard.press(
			process.platform === 'darwin'
				? 'Alt+Backspace'
				: 'Control+Backspace'
		);

		await waitForSuggestionSaved( page );
		await deselect( page );

		await expect(
			paragraph
				.locator( `${ SUGGESTION_MARK }[data-suggestion-type="del"]` )
				.filter( { hasText: 'world' } )
		).toBeVisible();
	} );

	test( 'seam: cutting a selection becomes a deletion marker', async ( {
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
		await pageUtils.pressKeys( 'primary+x' ); // deleteByCut

		await waitForSuggestionSaved( page );
		await deselect( page );

		await expect(
			paragraph
				.locator( `${ SUGGESTION_MARK }[data-suggestion-type="del"]` )
				.filter( { hasText: 'world' } )
		).toBeVisible();
	} );

	test( 'seam: pasting multi-line text becomes addition markers', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Start' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );

		pageUtils.setClipboardData( { plainText: ' one two three' } );
		await pageUtils.pressKeys( 'primary+v' );

		await waitForSuggestionSaved( page );
		await deselect( page );

		await expect(
			paragraph.locator(
				`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
			)
		).toBeVisible();
	} );

	/*
	 * Further seams that need lower-level input injection than Playwright's
	 * keyboard API exposes, deferred until Phase 1 wires the `onChange`
	 * diff->marker converter (which is input-event-agnostic and covers them by
	 * construction):
	 *   - autocorrect / `insertReplacementText`
	 *   - IME composition (`compositionstart` / `compositionend`)
	 *   - drag-and-drop text
	 * Phase 1 validates these via unit tests on the converter rather than e2e.
	 */
} );
