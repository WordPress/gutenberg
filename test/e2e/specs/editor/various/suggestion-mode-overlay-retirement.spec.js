/**
 * Phase 0 safety net for the overlay-retirement work (Option B) tracked in
 * #73411. Before any overlay code is deleted, these tests pin the behaviour the
 * migration must preserve and the seams it must close.
 *
 * Two groups:
 *
 *   1. INVARIANT - the end-state property the migration establishes: a single
 *      block never carries both an inline `<mark class="wp-suggestion">` marker
 *      AND an overlay `<del>/<ins class="has-suggestion-*">` diff. Today the
 *      two inline systems coexist, so this can be violated; it is marked
 *      `test.fixme` until Phase 2 (inline formatting moves to markers).
 *
 *   2. SEAMS - edits that currently fall through to the overlay diff path
 *      instead of producing a marker, because marker creation keys off a narrow
 *      set of input events. Each must end on a marker once Phase 1 lands the
 *      `onChange` diff->marker converter, so they are `test.fixme` until then.
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

	test.fixme(
		'invariant: a block never carries both an inline marker and an overlay diff',
		async ( { editor, page, pageUtils } ) => {
			// Combine a text addition (marker path) with an inline-format change
			// (overlay diff path) on the SAME block. Today the block ends up
			// with both representations; after Phase 2 the format change is a
			// marker too, so only `<mark>` is present.
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
			await page.keyboard.type( ' more' ); // addition -> marker

			// Bold "world" -> currently the overlay diff path.
			await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 9 } );
			await pageUtils.pressKeys( 'primary+b' );

			await waitForSuggestionSaved( page );
			await deselect( page );

			const hasMark = await paragraph
				.locator( SUGGESTION_MARK )
				.count();
			const hasOverlayDiff =
				( await paragraph.locator( OVERLAY_ADD ).count() ) +
				( await paragraph.locator( OVERLAY_DEL ).count() );

			// The invariant: not both at once.
			expect( hasMark > 0 && hasOverlayDiff > 0 ).toBe( false );
		}
	);

	// --- Seams (close in Phase 1) -----------------------------------------

	test.fixme(
		'seam: deleting a word backward becomes a deletion marker',
		async ( { editor, page } ) => {
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
			// deleteWordBackward (Ctrl+Backspace on the Linux CI runner).
			await page.keyboard.press( 'Control+Backspace' );

			await waitForSuggestionSaved( page );
			await deselect( page );

			await expect(
				paragraph
					.locator(
						`${ SUGGESTION_MARK }[data-suggestion-type="del"]`
					)
					.filter( { hasText: 'world' } )
			).toBeVisible();
		}
	);

	test.fixme(
		'seam: cutting a selection becomes a deletion marker',
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
			await page.keyboard.press( 'End' );
			await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 5 } );
			await pageUtils.pressKeys( 'primary+x' ); // deleteByCut

			await waitForSuggestionSaved( page );
			await deselect( page );

			await expect(
				paragraph
					.locator(
						`${ SUGGESTION_MARK }[data-suggestion-type="del"]`
					)
					.filter( { hasText: 'world' } )
			).toBeVisible();
		}
	);

	test.fixme(
		'seam: pasting multi-line text becomes addition markers',
		async ( { editor, page, pageUtils } ) => {
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

			await pageUtils.setClipboardData( { plainText: ' one two three' } );
			await pageUtils.pressKeys( 'primary+v' );

			await waitForSuggestionSaved( page );
			await deselect( page );

			await expect(
				paragraph.locator(
					`${ SUGGESTION_MARK }[data-suggestion-type="add"]`
				)
			).toBeVisible();
		}
	);

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
