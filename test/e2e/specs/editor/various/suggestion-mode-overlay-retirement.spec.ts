/**
 * Phase 0 safety net for the overlay-retirement work (Option B) tracked in
 * #73411. Before any overlay code is deleted, these tests pin the behaviour the
 * migration must preserve and the seams it must close.
 *
 * Two groups:
 *
 *   1. INVARIANT - the end-state property the migration establishes: a single
 *      block never carries both an inline `<mark class="wp-suggestion-<kind>">` marker
 *      AND an overlay `<del>/<ins class="has-suggestion-*">` diff. This holds
 *      now that Phase 2 moved formatting to markers, including when a formatting
 *      change and a text addition coexist on one block (non-overlapping runs).
 *      A second format toggle over a marked run extends that marker rather
 *      than opening an overlay on top of it. An edit that can be expressed as
 *      neither — a delete straddling a marker, a type-over of a marked run —
 *      is declined outright rather than falling through to the overlay, which
 *      would hide the marker it landed on top of.
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
 * `suggestion-mode.spec.ts` (the "style golden path" and the heading-level
 * tests) and serve as the oracle for those categories.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const SUGGESTION_MARK =
	'mark:is(.wp-suggestion-add, .wp-suggestion-del, .wp-suggestion-format)';
const OVERLAY_ADD = 'ins.has-suggestion-addition';
const OVERLAY_DEL = 'del.has-suggestion-deletion';

async function switchIntent( page: any, intentLabel: string ) {
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

async function waitForSuggestionSaved( page: any ) {
	await page.waitForResponse(
		( response: any ) =>
			/\/wp\/v2\/comments(\?|$|\/)/.test( response.url() ) &&
			[ 'POST', 'PUT' ].includes( response.request().method() ) &&
			response.ok()
	);
}

async function openNotesSidebar( page: any ) {
	const allNotesToggle = page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'All notes', exact: true } );
	if (
		( await allNotesToggle.getAttribute( 'aria-expanded' ) ) === 'false'
	) {
		await allNotesToggle.click();
	}
	return page.getByRole( 'region', { name: 'Editor settings' } );
}

async function getParagraphs( page: any ) {
	return page.evaluate( () =>
		window.wp.data
			.select( 'core/block-editor' )
			.getBlocks()
			.map( ( block: any ) => ( {
				content: String( block.attributes.content ?? '' ),
				noteIds: [ block.attributes.metadata?.noteId ?? [] ]
					.flat()
					.map( Number ),
			} ) )
	);
}

async function deselect( page: any ) {
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
		// `<ins>`/`<del>` diff, and no whole-attribute proposal for the
		// marked attribute in its `metadata.suggestion` marker either.
		const overlayDiff =
			( await paragraph.locator( OVERLAY_ADD ).count() ) +
			( await paragraph.locator( OVERLAY_DEL ).count() );
		expect( overlayDiff ).toBe( 0 );
		const proposedContent = await page.evaluate( () => {
			const [ block ] = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			return block.attributes.metadata?.suggestion?.after?.content;
		} );
		expect( proposedContent ).toBeUndefined();
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
		 * STORE INTERCEPTOR, not the content reconciler, captures it,
		 * reverting the store to baseline and diverting the pasted value
		 * into the block marker's proposal as a whole-attribute suggestion.
		 * Converting that capture into inline markers is a possible
		 * follow-up; what this safety net pins is that the paste is never
		 * committed raw and never rendered as an overlay inline diff.
		 */
		pageUtils.setClipboardData( { plainText: ' one two\nthree four' } );
		await pageUtils.pressKeys( 'primary+v' );

		await waitForSuggestionSaved( page );
		await deselect( page );

		// The suggester sees their pasted text live (proposal merge)…
		await expect( paragraph ).toContainText( 'one two' );
		await expect( paragraph ).toContainText( 'three four' );
		// …with the attribute-pending bracket treatment, not inline markers.
		await expect( paragraph ).toHaveClass( /is-suggestion-pending/ );
		await expect( paragraph.locator( SUGGESTION_MARK ) ).toHaveCount( 0 );
		// The live block (and thus its markup) stays at the baseline:
		// nothing from the paste is committed until the suggestion is
		// accepted. The pasted value is only in the marker's proposal.
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( '<p>Start</p>' );
		expect( serialized ).not.toMatch( /<p>[^<]*one two/ );
		expect( serialized ).toContain( '"type":"pending-attributes"' );
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
			const view = node.ownerDocument.defaultView!;
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
			let textNode: any;
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
		const delMarker = paragraph.locator(
			`${ SUGGESTION_MARK }[data-suggestion-type="del"]`
		);
		const addMarker = paragraph.locator(
			`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
		);
		await expect( delMarker ).toBeVisible();
		await expect( addMarker ).toBeVisible();
		/*
		 * Both markers cover whole words. Trimming the shared prefix and
		 * suffix locates the edit but describes it as delete "eh" plus add
		 * "he", which renders as "tehhe" in the canvas and quotes word
		 * fragments in the sidebar (F-27).
		 */
		await expect( delMarker ).toHaveText( 'teh' );
		await expect( addMarker ).toHaveText( 'the' );
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

	test( 'invariant: a delete straddling a formatting change becomes a deletion over it, not an overlay', async ( {
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
		// Bold "world": one `format` marker.
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
		await pageUtils.pressKeys( 'primary+b' );
		const formatMarker = paragraph.locator( 'mark.wp-suggestion-format' );
		await expect( formatMarker ).toHaveAttribute(
			'data-suggestion-id',
			/\d/
		);

		/*
		 * Select "lo wor" - a range straddling the format marker's boundary -
		 * and delete it. A deletion and a formatting change are different
		 * marker kinds, so they share the text: the deletion becomes its own
		 * suggestion, split around the format marker's edge and nested inside
		 * it, and the formatting change keeps exactly its run. The
		 * whole-content overlay this used to fall through to would have hidden
		 * every marker in the block (#73411, F-09).
		 */
		await page.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const [ block ] = select( 'core/block-editor' ).getBlocks();
			dispatch( 'core/block-editor' ).selectionChange(
				block.clientId,
				'content',
				3,
				9
			);
		} );
		await page.keyboard.press( 'Backspace' );

		const deletion = paragraph.locator( 'mark.wp-suggestion-del' );
		await expect( deletion ).toHaveText( [ 'lo ', 'wor' ] );
		await expect(
			paragraph.locator(
				'mark.wp-suggestion-format mark.wp-suggestion-del'
			)
		).toHaveText( 'wor' );

		await deselect( page );

		// No overlay landed on this block: the markers are its rendered state.
		await expect( paragraph ).not.toHaveClass( /is-suggestion-pending/ );
		await expect( paragraph.locator( OVERLAY_ADD ) ).toHaveCount( 0 );
		await expect( paragraph.locator( OVERLAY_DEL ) ).toHaveCount( 0 );
		await expect( formatMarker ).toHaveText( 'world' );
		// Nothing was removed, and the earlier suggestion survives verbatim.
		await expect
			.poll( () => paragraph.textContent() )
			.toBe( 'Hello world' );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'data-suggestion-type="format"' );
		expect( serialized ).toContain( '<strong>' );
	} );

	test( 'invariant: a second format toggle over a marked run extends the marker, never an overlay', async ( {
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

		// Bold "world" - the golden path, one `format` marker.
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
		await pageUtils.pressKeys( 'primary+b' );
		const formatMark = paragraph.locator(
			`${ SUGGESTION_MARK }[data-suggestion-type="format"]`
		);
		await expect( formatMark ).toContainText( 'world' );

		/*
		 * Italicise the same run. The overlay this used to fall through to
		 * recorded a suggestion carrying no change at all while hiding the bold
		 * marker (#73411, F-12); the second toggle now extends the marker that
		 * is already there. `ArrowRight` collapses the selection first: on macOS
		 * Chromium `End` is a no-op while a selection is live.
		 */
		await page.keyboard.press( 'ArrowRight' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
		await pageUtils.pressKeys( 'primary+i' );

		/*
		 * Polled: the italic reaches the block's content only after the note
		 * round trip, while the browser applies it to the live DOM immediately.
		 */
		await expect
			.poll( async () => await editor.getEditedPostContent() )
			.toContain( '<em>' );

		await deselect( page );

		/*
		 * The invariant: one marker carrying both formats, and no overlay over
		 * the block it sits in. `suggestion-mode.spec.ts` owns the rest of the
		 * extension behaviour - one note, a summary naming both formats.
		 */
		await expect( paragraph ).not.toHaveClass( /is-suggestion-pending/ );
		await expect( paragraph.locator( SUGGESTION_MARK ) ).toHaveCount( 1 );
		await expect( paragraph.locator( OVERLAY_ADD ) ).toHaveCount( 0 );
		await expect( paragraph.locator( OVERLAY_DEL ) ).toHaveCount( 0 );
		await expect( formatMark ).toHaveText( 'world' );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'data-suggestion-type="format"' );
		expect( serialized ).toContain( '<strong>' );
		expect( serialized ).toContain( '<em>' );
	} );

	test( 'invariant: typing over your own pending addition revises it, not an overlay', async ( {
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
		const id = await addMarker.getAttribute( 'data-suggestion-id' );

		/*
		 * Select part of the pending addition and type over it. The author
		 * revises their own proposal in place (#73411, B11); the edit must
		 * never fall back to an overlay that hides the marker. Another
		 * author's marker is still refused (see `suggestion-mode.spec.ts`).
		 */
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 3 } );
		await page.keyboard.type( 'X' );

		await expect( addMarker ).toHaveText( ' X' );
		await expect( addMarker ).toHaveAttribute( 'data-suggestion-id', id! );

		await deselect( page );

		await expect( paragraph ).not.toHaveClass( /is-suggestion-pending/ );
		await expect( paragraph.locator( SUGGESTION_MARK ) ).toHaveCount( 1 );
		await expect
			.poll( () => paragraph.textContent() )
			.toBe( 'Hello world X' );
	} );

	test( 'invariant: deleting across your own pending markers removes your additions and keeps your deletions', async ( {
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
		const marks = ( type: string ) =>
			paragraph.locator(
				`${ SUGGESTION_MARK }[data-suggestion-type="${ type }"]`
			);
		await paragraph.click();

		// Propose deleting "Hello", then add text on both sides of it.
		await page.keyboard.press( 'Home' );
		await pageUtils.pressKeys( 'shift+ArrowRight', { times: 5 } );
		await page.keyboard.press( 'Backspace' );
		await expect( marks( 'del' ) ).toHaveAttribute(
			'data-suggestion-id',
			/\d/
		);
		const deletionId =
			await marks( 'del' ).getAttribute( 'data-suggestion-id' );
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' NEW' );
		await expect( marks( 'add' ) ).toHaveAttribute(
			'data-suggestion-id',
			/\d/
		);
		await page.keyboard.press( 'Home' );
		await page.keyboard.type( 'Hi ' );
		await expect( marks( 'add' ) ).toHaveCount( 2 );
		await expect( marks( 'add' ).first() ).toHaveAttribute(
			'data-suggestion-id',
			/\d/
		);
		await expect( paragraph ).toHaveText( 'Hi Hello world NEW' );

		/*
		 * Select everything and delete it. The selection crosses both of the
		 * author's additions, their own deletion, and original text. After a
		 * few edits a block is mostly the author's own markers, and refusing
		 * this as an overlap left the block impossible to edit (#73411, B7).
		 * The additions were never in the post, so they go; the deletion is
		 * already proposed, so it stays; the original text left between them
		 * is proposed for deletion.
		 */
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+Home' );
		await page.keyboard.press( 'Backspace' );

		await expect( marks( 'add' ) ).toHaveCount( 0 );
		await expect( marks( 'del' ) ).toHaveCount( 2 );
		await expect( marks( 'del' ).first() ).toHaveText( 'Hello' );
		await expect( marks( 'del' ).first() ).toHaveAttribute(
			'data-suggestion-id',
			deletionId!
		);
		await expect( marks( 'del' ).last() ).toHaveText( ' world' );
		await expect( marks( 'del' ).last() ).toHaveAttribute(
			'data-suggestion-id',
			/\d/
		);
		await expect(
			page
				.locator( '.components-snackbar-list' )
				.getByText( 'overlaps a pending suggestion' )
		).toHaveCount( 0 );

		await deselect( page );

		await expect( paragraph ).not.toHaveClass( /is-suggestion-pending/ );
		await expect( paragraph.locator( OVERLAY_ADD ) ).toHaveCount( 0 );
		await expect( paragraph.locator( OVERLAY_DEL ) ).toHaveCount( 0 );
		await expect
			.poll( () => paragraph.textContent() )
			.toBe( 'Hello world' );
	} );

	/*
	 * A splitting Enter reaches the store as `replaceBlocks` — a truncated head
	 * plus a new tail block — so it never passes through the overlay HOC's
	 * `setAttributes` seam and the head's truncation used to be captured as a
	 * whole-attribute overlay. The overlay renders its clean snapshot in place
	 * of the block's value, which drew the proposed removal as already done: a
	 * short first paragraph followed by a pending-insert block, indistinguishable
	 * from a split that had actually been applied (#73411, F-07).
	 */
	test( 'seam: a split strikes the removed tail through in place', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'The quick brown fox jumps over the lazy dog.',
			},
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		// Caret between "fox " and "jumps": the tail is the last 24 characters.
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: 24 } );
		await page.keyboard.press( 'Enter' );

		// Positive signal first: the deletion marker lands on the head block,
		// with the removed run still readable inside it.
		const delMarker = paragraph.locator(
			`${ SUGGESTION_MARK }[data-suggestion-type="del"]`
		);
		await expect( delMarker ).toHaveAttribute( 'data-suggestion-id', /\d/ );
		await expect( delMarker ).toHaveText( 'jumps over the lazy dog.' );
		await deselect( page );

		// The head block keeps its whole sentence rather than being repainted
		// as the post-split "The quick brown fox ".
		await expect( paragraph ).toHaveText(
			'The quick brown fox jumps over the lazy dog.'
		);
		// And it carries no overlay, so the marker is the only representation
		// of the pending change on that block.
		await expect( paragraph ).not.toHaveClass( /is-suggestion-pending\b/ );

		// The other half of the split is still proposed as an inserted block.
		const tail = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.nth( 1 );
		await expect( tail ).toHaveClass( /is-suggestion-pending-insert/ );
		await expect( tail ).toHaveText( 'jumps over the lazy dog.' );
	} );

	/*
	 * A split inside a block that already holds the user's own pending
	 * addition (#73411, B8). The head's truncation removes part of the marked
	 * run, which the planner used to decline, so the head fell back to a
	 * whole-attribute overlay ("Replace: ...", outlined like an attribute
	 * change), and the tail was built from the original content, copying the
	 * marker and its note id into a second block.
	 */
	test( 'seam: a split after an own addition moves the addition to the tail as plain text', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello world again' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' and more' );
		const addMarker = paragraph.locator(
			`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
		);
		await expect( addMarker ).toHaveAttribute( 'data-suggestion-id', /\d/ );
		await expect( addMarker ).toHaveText( ' and more' );
		const addId = Number(
			await addMarker.getAttribute( 'data-suggestion-id' )
		);

		// Caret between "aga" and "in and more". Counted from the start: the
		// marker boundary takes an extra arrow press of its own.
		await page.keyboard.press( 'Home' );
		await pageUtils.pressKeys( 'ArrowRight', { times: 15 } );
		await page.keyboard.press( 'Enter' );

		// The head strikes through only the base text that moved.
		const delMarker = paragraph.locator(
			`${ SUGGESTION_MARK }[data-suggestion-type="del"]`
		);
		await expect( delMarker ).toHaveAttribute( 'data-suggestion-id', /\d/ );
		await expect( delMarker ).toHaveText( 'in' );
		await deselect( page );

		await expect( paragraph ).toHaveText( 'Hello world again' );
		await expect( paragraph ).not.toHaveClass( /is-suggestion-pending\b/ );
		await expect( paragraph.locator( SUGGESTION_MARK ) ).toHaveCount( 1 );

		// The tail is a pending insertion holding the moved text, unmarked: the
		// whole block is the proposal, so its own `add` has nothing to add.
		const tail = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.nth( 1 );
		await expect( tail ).toHaveClass( /is-suggestion-pending-insert/ );
		await expect( tail ).toHaveText( 'in and more' );
		await expect( tail.locator( SUGGESTION_MARK ) ).toHaveCount( 0 );

		// Neither block keeps a link to the retired addition note.
		const [ head, tailBlock ] = await getParagraphs( page );
		expect( head.content ).not.toContain( `"${ addId }"` );
		expect( tailBlock.content ).not.toContain( 'data-suggestion-id' );
		expect( tailBlock.noteIds ).not.toContain( addId );

		// Each note is listed once, and the addition note is collected now
		// that nothing anchors it.
		const sidebar = await openNotesSidebar( page );
		const threads = sidebar.locator(
			'.editor-collab-sidebar-panel__thread'
		);
		await expect( threads ).toHaveCount( 2 );
		await expect(
			sidebar.locator( `[id="note-thread-${ addId }"]` )
		).toHaveCount( 0 );
		const threadIds = await threads.evaluateAll( ( els: Element[] ) =>
			els.map( ( el ) => el.id )
		);
		expect( new Set( threadIds ).size ).toBe( threadIds.length );
	} );

	test( "invariant: a split inside another author's pending marker is declined", async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content:
					'Hello <mark class="wp-suggestion-add" data-suggestion-id="987654" data-suggestion-type="add" data-author="987654">brave new</mark> world',
			},
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		// Caret inside the other author's addition ("Hello br|ave new"), so
		// the run a split would remove from this block carries their marker.
		await page.keyboard.press( 'Home' );
		await pageUtils.pressKeys( 'ArrowRight', { times: 8 } );
		await page.keyboard.press( 'Enter' );

		await expect(
			page
				.locator( '.components-snackbar-list' )
				.getByText( 'overlaps a pending suggestion' )
		).toBeVisible();

		await deselect( page );
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveCount( 1 );
		await expect( paragraph ).not.toHaveClass( /is-suggestion-pending/ );
		await expect( paragraph ).toHaveText( 'Hello brave new world' );
		await expect(
			paragraph.locator(
				`${ SUGGESTION_MARK }[data-suggestion-id="987654"]`
			)
		).toHaveText( 'brave new' );
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
