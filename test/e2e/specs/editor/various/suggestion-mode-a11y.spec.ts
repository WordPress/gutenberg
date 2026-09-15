/**
 * E2E coverage for the accessible semantics of inline suggestion markers
 * (#73411, finding F-23). Colour and text-decoration are the whole of the
 * marker treatment, and neither reaches a screen reader: without the
 * decoration asserted here a proposed deletion is read aloud as ordinary
 * prose.
 *
 * The decoration is editor-only — it is prepared into the editable tree and
 * never parsed back — so every test also checks that nothing it adds reaches
 * the serialized post.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

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
	// `MenuItemsChoice` doesn't auto-close its dropdown on selection, so
	// leaving the menu open would make a subsequent `Options` click toggle
	// it closed instead of reopening it.
	await page.keyboard.press( 'Escape' );
}

/*
 * Returns a promise for the debounced suggestion auto-save REST call. Call
 * this BEFORE performing the edit that triggers the auto-save: creating the
 * listener after the edit races the debounce on slow CI - the response can
 * land before `waitForResponse` attaches and the wait then times out.
 *
 * The authored announcements only exist once the note thread this creates has
 * been saved and read back, so every announcement assertion has to wait for it
 * rather than spend its poll budget on the debounce.
 */
function suggestionSavedPromise( page: any ) {
	return page.waitForResponse(
		( response: any ) =>
			/\/wp\/v2\/comments(\?|$|\/)/.test( response.url() ) &&
			[ 'POST', 'PUT' ].includes( response.request().method() ) &&
			response.ok()
	);
}

/**
 * Reads what a screen reader gets at a marker's boundaries: the announcements
 * are painted as CSS generated content, so they live in the computed style
 * rather than in the DOM.
 *
 * @param {import('@playwright/test').Locator} locator The `.wp-suggestion-a11y` span.
 * @return {Promise<{before: string, after: string}>} Both announcement strings.
 */
function announcementsOf( locator: any ) {
	return locator.evaluate( ( el: any ) => ( {
		before: window.getComputedStyle( el, '::before' ).content,
		after: window.getComputedStyle( el, '::after' ).content,
	} ) );
}

test.describe( 'Suggestion mode marker accessibility', () => {
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

	test( 'an add marker carries an insertion role and is bracketed by an announcement naming its author', async ( {
		editor,
		page,
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
		const saved = suggestionSavedPromise( page );
		await page.keyboard.type( ' world' );

		const marker = paragraph.locator(
			'mark.wp-suggestion[data-suggestion-type="add"]'
		);
		await expect( marker ).toContainText( 'world' );

		// ARIA maps `insertion` to `<ins>`, so the run is at least exposed as
		// changed rather than as plain text.
		const decoration = marker.locator( 'span.wp-suggestion-a11y' );
		// Exactly one: a marker run is decorated with a single reused format
		// object so it stays one element. More would mean the run split, and
		// every assertion below would be reading an arbitrary half of it.
		await expect( decoration ).toHaveCount( 1 );
		await expect( decoration ).toHaveAttribute( 'role', 'insertion' );

		// The bracketing text is what actually says "this is proposed": most
		// screen readers do not announce `<ins>` on their own.
		const { name: authorName } = await page.evaluate( () =>
			window.wp.data.select( 'core' ).getCurrentUser()
		);
		// The per-author rules are injected asynchronously with the note
		// threads, so wait for the thread to save and then poll for the
		// refetch that carries it back.
		await saved;
		await expect
			.poll( async () => ( await announcementsOf( decoration ) ).before )
			.toBe( `"Start of suggested addition by ${ authorName }."` );
		expect( ( await announcementsOf( decoration ) ).after ).toBe(
			`"End of suggested addition by ${ authorName }."`
		);

		// None of it is content: the decoration is prepared into the editable
		// tree only, so the saved post keeps the bare marker.
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'data-suggestion-type="add"' );
		expect( serialized ).not.toContain( 'wp-suggestion-a11y' );
		expect( serialized ).not.toContain( 'data-suggestion-a11y' );
		expect( serialized ).not.toContain( 'role=' );
	} );

	test( 'a del marker carries a deletion role and says so', async ( {
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
		const saved = suggestionSavedPromise( page );
		await page.keyboard.press( 'Backspace' );

		const decoration = paragraph.locator(
			'mark.wp-suggestion[data-suggestion-type="del"] span.wp-suggestion-a11y'
		);
		await expect( decoration ).toHaveCount( 1 );
		await expect( decoration ).toHaveAttribute( 'role', 'deletion' );
		await saved;
		await expect
			.poll( async () => ( await announcementsOf( decoration ) ).before )
			.toMatch( /^"Start of suggested deletion by / );
	} );

	test( 'a format marker is announced as a formatting change, not as a deletion', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// A formatting suggestion removes nothing. Reusing `role="deletion"`
		// for it — the shape of the original decoration — tells a
		// screen-reader user the run is slated for removal when it is not.
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
		const saved = suggestionSavedPromise( page );
		await pageUtils.pressKeys( 'primary+b' );

		const marker = paragraph.locator(
			'mark.wp-suggestion[data-suggestion-type="format"]'
		);
		await expect( marker ).toContainText( 'world' );

		const decoration = marker.locator( 'span.wp-suggestion-a11y' );
		await expect( decoration ).toHaveCount( 1 );
		expect( await decoration.getAttribute( 'role' ) ).toBeNull();
		await saved;
		await expect
			.poll( async () => ( await announcementsOf( decoration ) ).before )
			.toMatch( /^"Start of suggested formatting change by / );
	} );

	test( 'a marker spanning a formatting boundary is bracketed once, not once per run', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// The decoration sits directly inside the marker so its position in
		// the format stack is the same for every character of the run. Nested
		// at the end instead, a bold run covering only part of the marker
		// shifts it and rich-text emits a second element - the closing
		// announcement then lands in the middle of the suggestion and the
		// opening one is repeated.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello <strong>bold</strong> world' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await paragraph.click();
		await page.keyboard.press( 'End' );
		// "bold world" - half inside the bold run, half outside it.
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 10 } );
		await page.keyboard.press( 'Backspace' );

		const marker = paragraph.locator(
			'mark.wp-suggestion[data-suggestion-type="del"]'
		);
		await expect( marker ).toContainText( 'bold world' );
		await expect( marker.locator( 'span.wp-suggestion-a11y' ) ).toHaveCount(
			1
		);
	} );
} );
