/**
 * Phase 0 safety net for the overlay-retirement work (Option B) tracked in
 * #73411. Before any overlay code is deleted, these tests pin the behaviour the
 * migration must preserve and the seams it must close.
 *
 * Two groups:
 *
 *   1. INVARIANT - the end-state property the migration establishes: a single
 *      block never carries both an inline `<mark class="wp-suggestion">` marker
 *      AND an overlay `<del>/<ins class="has-suggestion-*">` diff. The clean
 *      case (a lone formatting change) holds now that Phase 2 moved formatting
 *      to markers; the combined case (a formatting change on a block that
 *      already carries a marker) is the remaining gap and stays `test.fixme`.
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

	// The clean-block form of this invariant — a lone formatting change becomes a
	// `format` marker with no overlay `<ins>/<del>` diff — is the passing "style
	// golden path" in suggestion-mode.spec.js, the oracle this spec's header
	// designates for formatting.
	//
	// This combined form (a text addition AND a formatting change on the SAME
	// block) is the remaining gap: `planFormatMarkers` declines whenever the
	// block already carries any pending suggestion marker — not only on true
	// run overlap — so the second, formatting suggestion falls back to the
	// overlay diff path. Un-fixme once the format path tolerates a co-existing
	// marker elsewhere in the block (and, ultimately, the overlapping-run case).
	test.fixme(
		'invariant: a block never carries both an inline marker and an overlay diff',
		async ( { editor, page, pageUtils } ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Hello world' },
			} );

			await switchIntent( page, 'Suggesting' );

			const paragraph = editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.first();
			await paragraph.click();

			// Addition marker: append at the end of the paragraph.
			await page.keyboard.press( 'End' );
			await page.keyboard.type( ' more' );
			await expect(
				paragraph.locator(
					`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
				)
			).toBeVisible();

			// Formatting change on the leading (non-overlapping) word.
			await page.keyboard.press( 'Home' );
			await pageUtils.pressKeys( 'shift+ArrowRight', { times: 5 } ); // "Hello"
			await pageUtils.pressKeys( 'primary+b' );
			await expect(
				paragraph.locator(
					`${ SUGGESTION_MARK }[data-suggestion-type="format"]`
				)
			).toBeVisible();

			await deselect( page );

			// The invariant: inline markers, but never an overlay diff.
			const overlayDiff =
				( await paragraph.locator( OVERLAY_ADD ).count() ) +
				( await paragraph.locator( OVERLAY_DEL ).count() );
			expect( overlayDiff ).toBe( 0 );
		}
	);

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
