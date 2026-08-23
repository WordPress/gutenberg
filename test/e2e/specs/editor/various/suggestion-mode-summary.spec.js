/**
 * E2E coverage for what a suggestion's sidebar summary actually says (#73411).
 *
 * The sidebar precis is the only surface a reviewer has for a suggestion they
 * do not want to hunt down in the canvas, so a quote they cannot read is a
 * review failure. The summary's word diff used to run over the raw `content`
 * attribute: a tag is a token like any other to a whitespace tokenizer, so
 * markup was quoted at the reviewer as literal text, and the spaces separating
 * the changed words were matched away as `equal` segments and dropped, gluing
 * "jumps over the lazy dog." into "jumpsover the lazy dog." (F-10).
 *
 * The shapes of the summary lines themselves are unit-tested in
 * `packages/editor/src/components/suggestion-mode/test/suggestion-summary.js`;
 * this spec pins the end-to-end path, from a real capture in the editor to the
 * text rendered in the notes sidebar.
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
	// `MenuItemsChoice` keeps its dropdown open on selection; close it so a
	// later `Options` click reopens rather than toggles it shut.
	await page.keyboard.press( 'Escape' );
}

/*
 * Returns a promise for the debounced suggestion auto-save REST call. Call
 * this BEFORE the edit that triggers it: attaching the listener afterwards
 * races the debounce on slow CI.
 */
function suggestionSavedPromise( page ) {
	return page.waitForResponse(
		( response ) =>
			/\/wp\/v2\/comments(\?|$|\/)/.test( response.url() ) &&
			[ 'POST', 'PUT' ].includes( response.request().method() ) &&
			response.ok()
	);
}

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

test.describe( 'Suggest mode: sidebar summaries', () => {
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

	test( 'a whole-content suggestion quotes readable words, not glued text or markup', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content:
					'The quick brown fox jumps over the <strong>lazy</strong> dog.',
			},
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();

		/*
		 * Select the trailing "jumps over the lazy dog." and paste two lines
		 * over it. A multi-line paste is declined by the addition keyboard, so
		 * the editor's own paste pipeline commits the merged value and the
		 * store interceptor diverts it into a whole-content `attribute-set`
		 * suggestion — the path whose summary this test is about.
		 */
		await page.keyboard.press( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 24 } );

		const saved = suggestionSavedPromise( page );
		pageUtils.setClipboardData( { plainText: 'LINE ONE\nLINE TWO' } );
		await pageUtils.pressKeys( 'primary+v' );
		await saved;

		const sidebar = await openNotesSidebar( page );
		const summary = sidebar
			.locator( '.editor-collab-sidebar-panel__suggestion-summary' )
			.filter( { hasText: 'Replace:' } )
			.first();

		// Anchor on the summary existing before asserting what it says, so a
		// slow sidebar render can't pass as a well-formed quote.
		await expect( summary ).toBeVisible();

		// Words keep the spaces that separated them...
		await expect( summary ).toContainText( 'jumps over the lazy dog.' );
		await expect( summary ).toContainText( 'LINE ONE' );
		// ...and no markup is quoted at the reviewer.
		await expect( summary ).not.toContainText( '<strong>' );
	} );
} );
