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
 *      input events. Word/line delete, cut, and single-line paste produce
 *      markers via the deletion/addition keyboards; multi-line paste and
 *      autocorrect-style replacements reach RichText's `onChange` as a fresh
 *      `content` value and are diffed into markers by the content reconciler
 *      (exercised below). IME composition is driven through the Chrome
 *      DevTools Protocol; drag-drop shares that reconciler path but needs
 *      input injection e2e can't drive — the reconcile-edit unit tests
 *      cover its diff shapes.
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

		/*
		 * Addition marker: append at the end, past the formatted run, so the
		 * two suggestions do not overlap. The caret collapse must be
		 * `ArrowRight`, not `End`: on macOS Chromium `End` is a no-op on a
		 * non-collapsed selection (it only moves a collapsed caret), so `End`
		 * would leave "world" selected and the typing would become a
		 * type-over of the format marker instead of an append.
		 */
		await page.keyboard.press( 'ArrowRight' );
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

	/*
	 * Regression: the keyboards used to anchor marker writes to the
	 * block-editor STORE selection, which is synced from the DOM
	 * asynchronously. After the format keyboard's marker write re-renders
	 * RichText (restoring the store's selection over "world"), a caret
	 * collapse (ArrowRight) moves the DOM caret synchronously while the
	 * store still reports the old selection — so a fast typist's
	 * `beforeinput` fired against stale store offsets and the add marker
	 * landed mid-word, splitting the format marker into two `<mark>`
	 * fragments and dropping the typed leading space
	 * (`Hello <mark format>w</mark><mark add>more</mark><mark format>orld</mark>`).
	 * Offsets now come from the DOM at input time (`readEventRange`).
	 */
	test( 'typing fast after a format marker lands the addition at the DOM caret, not stale store offsets', async ( {
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

		// Format marker: bold the trailing word "world".
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
		await pageUtils.pressKeys( 'primary+b' );
		const formatMark = paragraph.locator(
			`${ SUGGESTION_MARK }[data-suggestion-type="format"]`
		);
		await expect( formatMark ).toContainText( 'world' );

		/*
		 * Immediately collapse the caret to the selection end and type.
		 * `ArrowRight` (not `End` — a no-op on a non-collapsed selection on
		 * macOS Chromium) collapses the DOM selection synchronously, while
		 * the store's selection sync is asynchronous; Playwright types with
		 * no delay, so the first `beforeinput` fires while the store still
		 * reports the old "world" selection — the exact window the
		 * regression corrupted.
		 */
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( ' more' );

		// One add marker containing exactly " more" — WITH the leading space
		// (`toHaveText` normalizes whitespace, so compare `textContent`).
		const addMark = paragraph.locator(
			`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
		);
		await expect( addMark ).toBeVisible();
		await expect.poll( () => addMark.textContent() ).toBe( ' more' );

		// The paragraph reads as the proposed result, nothing reordered.
		await expect
			.poll( () => paragraph.textContent() )
			.toBe( 'Hello world more' );

		// The format marker was not fragmented: exactly two markers on the
		// block (format + add) and the format marker still spans "world"
		// (a fragmented marker would also fail toHaveText's strict mode).
		await expect( paragraph.locator( SUGGESTION_MARK ) ).toHaveCount( 2 );
		await expect( formatMark ).toHaveText( 'world' );
	} );

	/*
	 * Regression (#79799): typing over a selection that still overlaps an
	 * existing marker. The addition keyboard declines to build a combined
	 * deletion+addition suggestion here (that is a later phase — wrapping the
	 * overlapping run in a `del` would re-attribute part of the existing
	 * marker). The bug was that it declined by *falling through* to native
	 * `contentEditable`, which edited a DOM that still contained the `<mark>`
	 * and corrupted it: the leading space was dropped, the format marker was
	 * fragmented into several `<mark>` segments, and the paragraph sometimes
	 * emptied entirely. The fix rejects the keystroke instead — cancel the
	 * native edit and make no change — so the marker and text are untouched.
	 */
	test( 'type-over of a selection overlapping a marker is rejected, not corrupted', async ( {
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

		// Format marker: bold the trailing word "world".
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
		await pageUtils.pressKeys( 'primary+b' );
		const formatMark = paragraph.locator(
			`${ SUGGESTION_MARK }[data-suggestion-type="format"]`
		);
		await expect( formatMark ).toContainText( 'world' );

		/*
		 * The format-marker write re-renders RichText and restores the
		 * selection over "world", so "world" is still selected. Type WITHOUT
		 * collapsing the caret first: every keystroke is a type-over whose
		 * selection overlaps the format marker — the exact #79799 trigger.
		 */
		await page.keyboard.type( ' more' );

		// Rejected: no addition marker was created…
		await expect(
			paragraph.locator(
				`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
			)
		).toHaveCount( 0 );
		// …the format marker was neither fragmented nor lost (still exactly one
		// marker, still spanning "world" — a fragmented marker fails strict
		// `toHaveText`)…
		await expect( paragraph.locator( SUGGESTION_MARK ) ).toHaveCount( 1 );
		await expect( formatMark ).toHaveText( 'world' );
		// …and no marker ended up nested inside another.
		await expect(
			paragraph.locator( `${ SUGGESTION_MARK } ${ SUGGESTION_MARK }` )
		).toHaveCount( 0 );
		// The paragraph text is unchanged: nothing typed, nothing dropped, the
		// block not emptied.
		await expect
			.poll( () => paragraph.textContent() )
			.toBe( 'Hello world' );
		// The user is told why the keystroke did nothing, so the rejection does
		// not read as an unresponsive editor. Scope to the snackbar itself: the
		// same copy is also mirrored into the `#a11y-speak-polite` live region,
		// so a bare text match is ambiguous under Playwright strict mode.
		await expect(
			page
				.getByTestId( 'snackbar' )
				.filter( { hasText: /Accept or reject it first/i } )
		).toBeVisible();
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

	test( 'seam: a multi-line paste is captured as an attribute suggestion, never a raw commit', async ( {
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

		/*
		 * A REAL multi-line paste: the addition keyboard declines anything
		 * matching /[\r\n]/, so the editor's own paste pipeline handles it.
		 * That pipeline commits the merged value to the block-editor store
		 * directly (not through the block's `setAttributes` prop), so the
		 * STORE INTERCEPTOR — not the content reconciler — captures it,
		 * reverting the store to baseline and diverting the pasted value
		 * into the attribute overlay as a whole-attribute suggestion.
		 * Converting that capture into inline markers is a possible
		 * follow-up; what this safety net pins is that the paste is never
		 * committed raw and never rendered as an overlay inline diff.
		 */
		pageUtils.setClipboardData( { plainText: ' one two\nthree four' } );
		await pageUtils.pressKeys( 'primary+v' );

		await waitForSuggestionSaved( page );
		await deselect( page );

		// The suggester sees their pasted text live (overlay merge)…
		await expect( paragraph ).toContainText( 'one two' );
		await expect( paragraph ).toContainText( 'three four' );
		// …with the attribute-pending bracket treatment, not inline markers.
		await expect( paragraph ).toHaveClass( /is-suggestion-pending/ );
		await expect( paragraph.locator( SUGGESTION_MARK ) ).toHaveCount( 0 );
		// The store (and thus serialized content) stays at the baseline:
		// nothing from the paste is committed until the suggestion is
		// accepted.
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( '<p>Start</p>' );
		expect( serialized ).not.toContain( 'one two' );
	} );

	test( 'seam: an autocorrect-style replacement (insertReplacementText) becomes markers via the reconciler', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Start teh' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );

		/*
		 * Simulate the browser's autocorrect seam: no `beforeinput` the
		 * typing keyboards can cancel does the edit — the browser mutates
		 * the DOM and announces it with `insertReplacementText`. RichText's
		 * input handler then reads the DOM back into a fresh `content`
		 * value, which must reach the singleton content reconciler and come
		 * back as markers, not as a raw content change.
		 */
		await paragraph.evaluate( ( node ) => {
			const view = node.ownerDocument.defaultView;
			// The keyboards ignore `insertReplacementText`; dispatching the
			// (uncancelled) beforeinput mirrors the real event order.
			node.dispatchEvent(
				new view.InputEvent( 'beforeinput', {
					inputType: 'insertReplacementText',
					data: 'the',
					bubbles: true,
					cancelable: true,
					composed: true,
				} )
			);
			// The "browser" applies the replacement directly to the DOM…
			const walker = node.ownerDocument.createTreeWalker(
				node,
				view.NodeFilter.SHOW_TEXT
			);
			let textNode;
			while ( ( textNode = walker.nextNode() ) ) {
				if ( textNode.data.includes( 'teh' ) ) {
					textNode.data = textNode.data.replace( 'teh', 'the' );
					break;
				}
			}
			// …and announces it, which drives RichText's DOM→value sync.
			node.dispatchEvent(
				new view.InputEvent( 'input', {
					inputType: 'insertReplacementText',
					data: 'the',
					bubbles: true,
					composed: true,
				} )
			);
		} );

		await waitForSuggestionSaved( page );
		await deselect( page );

		// The replacement is expressed as markers on the ORIGINAL text: the
		// replaced run is kept and struck through (del), the replacement is
		// inserted alongside it (add). The raw content was not overwritten.
		await expect(
			paragraph.locator(
				`${ SUGGESTION_MARK }[data-suggestion-type="del"]`
			)
		).toBeVisible();
		await expect(
			paragraph.locator(
				`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
			)
		).toBeVisible();
		// Nothing was lost: the original run is still present in the block.
		await expect( paragraph ).toContainText( 'Start' );

		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'data-suggestion-type="del"' );
		expect( serialized ).toContain( 'data-suggestion-type="add"' );
	} );

	test( 'seam: a committed IME composition becomes an add marker via the reconciler', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello ' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );

		/*
		 * Drive a real IME composition through the Chrome DevTools Protocol
		 * (Playwright's own keyboard API can't compose): set composition text,
		 * then commit it. RichText holds `onChange` until `compositionend`,
		 * after which the committed text reaches the singleton content
		 * reconciler as a fresh `content` value and must come back as an add
		 * marker, not a raw commit.
		 */
		const saved = waitForSuggestionSaved( page );
		const session = await page.context().newCDPSession( page );
		await session.send( 'Input.imeSetComposition', {
			text: 'ねこ',
			selectionStart: 2,
			selectionEnd: 2,
		} );
		await session.send( 'Input.insertText', { text: 'ねこ' } );
		await saved;
		await deselect( page );

		await expect(
			paragraph
				.locator( `${ SUGGESTION_MARK }[data-suggestion-type="add"]` )
				.filter( { hasText: 'ねこ' } )
		).toBeVisible();
		// The committed text is a suggestion, not part of the base content.
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'data-suggestion-type="add"' );
	} );

	test( 'seam: a delete straddling an existing marker never corrupts it', async ( {
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
		await page.keyboard.type( ' NEW' );
		const addMarker = paragraph.locator(
			`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
		);
		await expect( addMarker ).toHaveAttribute( 'data-suggestion-id', /\d/ );

		/*
		 * Select "ld NEW" — a range straddling the add marker's boundary —
		 * and delete it. The deletion keyboard declines ranges overlapping an
		 * existing suggestion (no nested marks), and the reconciler's diff
		 * declares the straddling edit unresolvable, so the store interceptor
		 * captures it as a whole-attribute suggestion. The one behavior this
		 * seam pins: the existing suggestion is never corrupted.
		 */
		const saved = waitForSuggestionSaved( page );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 6 } );
		await page.keyboard.press( 'Backspace' );
		await saved;
		await deselect( page );

		// Never nested: a marker inside a marker would corrupt both.
		await expect(
			paragraph.locator( `${ SUGGESTION_MARK } ${ SUGGESTION_MARK }` )
		).toHaveCount( 0 );
		// The straddling edit fell back to an attribute suggestion…
		await expect( paragraph ).toHaveClass( /is-suggestion-pending/ );
		// …and the baseline — including the earlier add suggestion, intact —
		// is what serializes.
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Hello world' );
		expect( serialized ).toContain( 'data-suggestion-type="add"' );
		expect( serialized ).toContain( 'NEW' );
	} );

	/*
	 * Remaining seam that needs lower-level input injection than Playwright's
	 * event APIs expose end-to-end: drag-and-drop text. The `onChange`
	 * diff->marker converter (`SuggestionContentReconciler`) is
	 * input-event-agnostic and covers it by construction; the autocorrect and
	 * IME tests above exercise that seam, and the converter's edge cases are
	 * validated by the reconcile-edit unit tests.
	 */
} );
