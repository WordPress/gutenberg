/**
 * E2E coverage for persistent structural suggestions.
 *
 * Structural suggestion state (the `metadata.suggestion` marker, a pending
 * move's proposed order, a pending-insert block itself) saves into
 * `post_content` — there is no save lock. These tests pin the consequences:
 *
 *   - Save draft stays available while a structural suggestion is pending,
 *     and saving leaves the editor clean (no unsaved-changes trap).
 *   - Pending state and the note linkage survive a reload; the suggestion
 *     can still be accepted or rejected afterwards.
 *   - Un-accepted insertions never render on the public front end (the
 *     type-aware render_block strip), while pending removals still do.
 *   - An un-accepted move does not change what readers see: the front end
 *     renders the pre-move order even though `post_content` holds the
 *     proposed one.
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
	// `MenuItemsChoice` doesn't auto-close its dropdown on selection.
	await page.keyboard.press( 'Escape' );
}

/*
 * Returns a promise for the debounced suggestion auto-save REST call. Call
 * this BEFORE performing the edit that triggers the auto-save.
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
 * Opens the "All notes" sidebar (if not already open) and returns the
 * settings-region locator the note threads render into.
 *
 * @param {import('@playwright/test').Page} page Playwright page.
 * @return {Promise<import('@playwright/test').Locator>} Sidebar region.
 */
async function openNotesSidebar( page: any ) {
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

/**
 * Clicks the note-header decision button and waits for the confirmation
 * snackbar.
 *
 * @param {import('@playwright/test').Page} page   Playwright page.
 * @param {'Accept'|'Reject'}               action Which decision to take.
 */
async function decideSuggestion( page: any, action: 'Accept' | 'Reject' ) {
	const sidebar = await openNotesSidebar( page );
	await sidebar
		.getByRole( 'button', { name: `${ action } suggestion` } )
		.click();
	await expect(
		page
			.locator( '.components-snackbar-list' )
			.getByText(
				action === 'Accept'
					? 'Suggestion applied.'
					: 'Suggestion rejected.'
			)
	).toBeVisible();
	return sidebar;
}

test.describe( 'Suggestion mode persistence', () => {
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

	test( 'a structural suggestion does not block saving, and saving leaves the editor clean', async ( {
		editor,
		page,
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
		await editor.selectBlocks( mover );
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockToolbarButton( 'Move down' );
		await expect( mover ).toHaveClass( /is-suggestion-pending-move/ );
		await suggestionSaved;

		// The regression this pins: the save lock used to keep Save draft
		// disabled while the post stayed dirty, trapping the suggester
		// behind an unsaved-changes warning with no way to resolve it.
		const saveButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save draft' } );
		await expect( saveButton ).toBeEnabled();

		await editor.saveDraft();

		// Once saved, nothing is left unsaved: no beforeunload trap.
		const isDirty = await page.evaluate( () =>
			window.wp.data.select( 'core/editor' ).isEditedPostDirty()
		);
		expect( isDirty ).toBe( false );
	} );

	test( 'a pending move survives a reload and can still be rejected', async ( {
		editor,
		page,
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
		await editor.selectBlocks( mover );
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockToolbarButton( 'Move down' );
		await suggestionSaved;

		await editor.saveDraft();
		await page.reload();

		// The pending treatment, its origin ghost, and the note linkage all
		// come back from saved content.
		const movedBlock = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'First paragraph' } );
		await expect( movedBlock ).toHaveClass( /is-suggestion-pending-move/ );
		await expect(
			editor.canvas.locator( '.is-suggestion-move-ghost' )
		).toBeVisible();

		const sidebar = await openNotesSidebar( page );
		await expect(
			sidebar.locator(
				'.editor-collab-sidebar-panel__suggestion-summary'
			)
		).toContainText( 'Move block:' );

		// Rejecting after the reload restores the original order: the
		// same-parent origin is recoverable from fromIndex alone.
		await decideSuggestion( page, 'Reject' );
		const serialized = await editor.getEditedPostContent();
		expect( serialized.indexOf( 'First paragraph' ) ).toBeLessThan(
			serialized.indexOf( 'Second paragraph' )
		);
		expect( serialized ).not.toContain( 'pending-move' );
	} );

	test( 'a pending removal survives a reload and can still be accepted', async ( {
		editor,
		page,
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
		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockOptionsMenuItem( 'Delete' );
		await expect( doomed ).toHaveClass( /is-suggestion-pending-remove/ );
		await suggestionSaved;

		await editor.saveDraft();
		await page.reload();

		const pendingRemove = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Remove me' } );
		await expect( pendingRemove ).toHaveClass(
			/is-suggestion-pending-remove/
		);

		await decideSuggestion( page, 'Accept' );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Keep me' );
		expect( serialized ).not.toContain( 'Remove me' );
	} );

	test( 'a pending insertion is hidden on the front end until accepted', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Existing content' },
		} );

		await switchIntent( page, 'Suggesting' );

		const suggestionSaved = suggestionSavedPromise( page );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Proposed new paragraph' },
		} );
		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.filter( { hasText: 'Proposed new paragraph' } )
		).toHaveClass( /is-suggestion-pending-insert/ );
		await suggestionSaved;

		// Publishing is an editorial decision, refused while Suggesting (see
		// the post-status guard). These tests only need the post published so
		// the front end can be inspected, so take the editor's own route back.
		await switchIntent( page, 'Editing' );
		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );
		await expect(
			page.locator( 'body' ).getByText( 'Existing content' )
		).toBeVisible();
		await expect(
			page.locator( 'body' ).getByText( 'Proposed new paragraph' )
		).toBeHidden();
	} );

	test( 'a pending move renders in its original order on the front end', async ( {
		editor,
		page,
	} ) => {
		/*
		 * A move is the one structural suggestion with nothing to strip: the
		 * block is real content and the proposal is its POSITION. The editor
		 * keeps the proposed order (that is what a reviewer needs to see), so
		 * the pre-render pass has to put it back for readers.
		 */
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Alpha the first' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Bravo the second' },
		} );

		await switchIntent( page, 'Suggesting' );

		const mover = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Alpha the first' } );
		await editor.selectBlocks( mover );

		const suggestionSaved = suggestionSavedPromise( page );
		await editor.clickBlockToolbarButton( 'Move down' );
		await expect( mover ).toHaveClass( /is-suggestion-pending-move/ );
		await suggestionSaved;

		/*
		 * The editor - and `post_content` - hold the PROPOSED order. Both
		 * texts are asserted present first: comparing two `indexOf` results
		 * alone passes vacuously when the expected text is missing, since a
		 * -1 is less than any real offset.
		 */
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Alpha the first' );
		expect( serialized ).toContain( 'Bravo the second' );
		expect( serialized.indexOf( 'Bravo the second' ) ).toBeLessThan(
			serialized.indexOf( 'Alpha the first' )
		);

		// See above: leave Suggesting before publishing.
		await switchIntent( page, 'Editing' );
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const rendered = await page.locator( 'body' ).innerText();
		expect( rendered ).toContain( 'Alpha the first' );
		expect( rendered ).toContain( 'Bravo the second' );
		// Readers still see the order the post is actually in.
		expect( rendered.indexOf( 'Alpha the first' ) ).toBeLessThan(
			rendered.indexOf( 'Bravo the second' )
		);
	} );

	test( 'two pending moves in one list keep the proposed order on the front end', async ( {
		editor,
		page,
	} ) => {
		/*
		 * `fromIndex` is measured against the order the list was in when the
		 * move was made, so the second move records an index the first move
		 * already shifted. Replaying both would publish an order that existed
		 * in no version of the document - here [Bravo, Alpha, Charlie], which
		 * is neither the baseline [Alpha, Bravo, Charlie] nor the proposal.
		 * The renderer declines the whole list instead.
		 */
		for ( const content of [
			'Alpha the first',
			'Bravo the second',
			'Charlie the third',
		] ) {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content },
			} );
		}

		await switchIntent( page, 'Suggesting' );

		const blockNamed = ( text: string ) =>
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.filter( { hasText: text } );

		// Move Charlie to the top: [Charlie, Alpha, Bravo].
		const charlie = blockNamed( 'Charlie the third' );
		await editor.selectBlocks( charlie );
		let saved = suggestionSavedPromise( page );
		await editor.clickBlockToolbarButton( 'Move up' );
		await editor.clickBlockToolbarButton( 'Move up' );
		await expect( charlie ).toHaveClass( /is-suggestion-pending-move/ );
		await saved;

		// Move Alpha to the end: [Charlie, Bravo, Alpha].
		const alpha = blockNamed( 'Alpha the first' );
		await editor.selectBlocks( alpha );
		saved = suggestionSavedPromise( page );
		await editor.clickBlockToolbarButton( 'Move down' );
		await expect( alpha ).toHaveClass( /is-suggestion-pending-move/ );
		await saved;

		// See above: leave Suggesting before publishing.
		await switchIntent( page, 'Editing' );
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const rendered = await page.locator( 'body' ).innerText();
		for ( const text of [
			'Alpha the first',
			'Bravo the second',
			'Charlie the third',
		] ) {
			expect( rendered ).toContain( text );
		}
		const order = [
			'Alpha the first',
			'Bravo the second',
			'Charlie the third',
		]
			.map(
				( text ) =>
					[ text, rendered.indexOf( text ) ] as [ string, number ]
			)
			.sort( ( a, b ) => a[ 1 ] - b[ 1 ] )
			.map( ( [ text ] ) => text );

		// The proposed order, untouched - not a fabricated third order.
		expect( order ).toEqual( [
			'Charlie the third',
			'Bravo the second',
			'Alpha the first',
		] );
	} );

	test( 'a pending move between two groups renders where the block sits', async ( {
		editor,
		page,
	} ) => {
		/*
		 * Client IDs never reach the server, so a move between two different
		 * nested parents cannot be identified from `fromParentClientId`
		 * alone: it is a non-empty ID either way. Applying its `fromIndex`
		 * inside the destination Group would drop the block at an offset of a
		 * list it never belonged to, so the marker records `crossedParents`
		 * and the renderer leaves the block alone.
		 */
		await editor.insertBlock( {
			name: 'core/group',
			attributes: { layout: { type: 'default' } },
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Group A traveller' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Group A resident' },
				},
			],
		} );
		await editor.insertBlock( {
			name: 'core/group',
			attributes: { layout: { type: 'default' } },
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Group B first' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Group B second' },
				},
			],
		} );

		await switchIntent( page, 'Suggesting' );

		const traveller = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Group A traveller' } );
		await editor.selectBlocks( traveller );

		/*
		 * Dispatched rather than driven through the toolbar: the "Move down"
		 * button will not carry a block across a Group boundary from the tail
		 * of its parent, and drag-and-drop needs lower-level input injection
		 * than Playwright exposes here. `moveBlocksToPosition` is the same
		 * store action a drag ends in, so the interceptor sees exactly what a
		 * dragged block would produce.
		 */
		const saved = suggestionSavedPromise( page );
		await page.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const [ groupA, groupB ] =
				select( 'core/block-editor' ).getBlocks();
			dispatch( 'core/block-editor' ).moveBlocksToPosition(
				[ groupA.innerBlocks[ 0 ].clientId ],
				groupA.clientId,
				groupB.clientId,
				groupB.innerBlocks.length
			);
		} );
		await expect( traveller ).toHaveClass( /is-suggestion-pending-move/ );
		await saved;

		// It really did change parents: it now trails Group B's children.
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( '"crossedParents":true' );
		expect( serialized.indexOf( 'Group B first' ) ).toBeGreaterThan( -1 );
		expect( serialized.indexOf( 'Group A traveller' ) ).toBeGreaterThan(
			serialized.indexOf( 'Group B first' )
		);

		// See above: leave Suggesting before publishing.
		await switchIntent( page, 'Editing' );
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const rendered = await page.locator( 'body' ).innerText();
		expect( rendered ).toContain( 'Group A traveller' );
		expect( rendered ).toContain( 'Group B first' );
		/*
		 * Left where it sits. The bug this guards is the block being hoisted
		 * to the FRONT of Group B, the offset it held back in Group A.
		 */
		expect( rendered.indexOf( 'Group A traveller' ) ).toBeGreaterThan(
			rendered.indexOf( 'Group B first' )
		);
		expect( rendered.indexOf( 'Group A traveller' ) ).toBeGreaterThan(
			rendered.indexOf( 'Group B second' )
		);
	} );

	test( 'pending inline suggestions on the front end: additions are hidden, deletions and format runs render their text', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		/*
		 * The render_block strip is type-aware: a proposed addition must never
		 * reach the front end, while a proposed deletion or format change only
		 * unwraps — the marked text is real content and keeps rendering until
		 * the suggestion is accepted.
		 */
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Addition target' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Keep rendering me' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Format target' },
		} );

		await switchIntent( page, 'Suggesting' );

		const paragraphs = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );

		// A typed addition…
		const first = paragraphs.filter( { hasText: 'Addition target' } );
		await first.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' PROPOSED' );
		await expect(
			first.locator( 'mark.wp-suggestion[data-suggestion-type="add"]' )
		).toHaveAttribute( 'data-suggestion-id', /\d/ );

		// …a deletion of "rendering"…
		const second = paragraphs.filter( { hasText: 'Keep rendering me' } );
		await second.click();
		await pageUtils.pressKeys( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 3 } );
		await page.keyboard.press( 'Backspace' );
		await expect(
			second.locator( 'mark.wp-suggestion[data-suggestion-type="del"]' )
		).toHaveAttribute( 'data-suggestion-id', /\d/ );

		// …and a format change.
		const third = paragraphs.filter( { hasText: 'Format target' } );
		await third.click();
		await pageUtils.pressKeys( 'End' );
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 6 } );
		await pageUtils.pressKeys( 'primary+b' );
		await expect(
			third.locator( 'mark.wp-suggestion[data-suggestion-type="format"]' )
		).toHaveAttribute( 'data-suggestion-id', /\d/ );

		// See above: leave Suggesting before publishing.
		await switchIntent( page, 'Editing' );
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const body = page.locator( 'body' );
		// The proposed addition never renders until accepted…
		await expect( body.getByText( 'Addition target' ) ).toBeVisible();
		await expect( body.getByText( 'PROPOSED' ) ).toBeHidden();
		// …while deletion and format runs still render their real text…
		await expect( body.getByText( 'Keep rendering me' ) ).toBeVisible();
		await expect( body.getByText( 'Format target' ) ).toBeVisible();
		// …with the marker wrappers stripped.
		await expect( body.locator( 'mark.wp-suggestion' ) ).toHaveCount( 0 );
	} );

	test( 'a typed inline addition survives a reload and can still be accepted', async ( {
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
		const suggestionSaved = suggestionSavedPromise( page );
		await page.keyboard.type( ' world' );
		await suggestionSaved;
		// The marker is only written once the async note id resolves.
		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="add"]'
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );

		await editor.saveDraft();
		await page.reload();

		// The marker lives in saved content, so it comes back decorated and
		// its note stays linked.
		const reloaded = editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();
		await expect(
			reloaded.locator( 'mark.wp-suggestion[data-suggestion-type="add"]' )
		).toContainText( 'world' );

		// Accepting after the reload unwraps the marker and keeps the text.
		await decideSuggestion( page, 'Accept' );
		const serialized = await editor.getEditedPostContent();
		expect( serialized ).toContain( 'Hello world' );
		expect( serialized ).not.toContain( 'data-suggestion-id' );
	} );
} );
