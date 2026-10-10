/**
 * E2E reproduction: a Suggestion mode decision that is never saved with the
 * post (#73411, reported by tyxla).
 *
 * Accept and Reject write the note's `_wp_suggestion_status` to the server
 * straight away, but the content change they make (unwrap the marker, drop
 * the marked text, clear `metadata.suggestion`, land the proposed attribute)
 * is an unsaved edit in the block editor. If the reviewer leaves without
 * saving the post, the note says "Applied" or "Rejected" while the marker is
 * still in `post_content`, and the sidebar offers no Accept or Reject any
 * more, so nobody can clear it.
 *
 * Each test: the suggester makes a suggestion and saves the post; a fresh
 * editor session (the reviewer) switches to Editing, decides, and navigates
 * away without saving; then the editor is opened again. The assertions state
 * what a user expects (the decision is reflected in the post) and are red on
 * purpose until a fix lands. The observed state is attached to each test as
 * an annotation so the failure report shows what actually happened.
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
}

async function currentPostId( page: any ): Promise< number > {
	return page.evaluate( () =>
		( window as any ).wp.data.select( 'core/editor' ).getCurrentPostId()
	);
}

async function waitForEditor( page: any ) {
	await page.waitForFunction(
		() =>
			( window as any ).wp?.data
				?.select( 'core/editor' )
				?.getCurrentPostId?.() &&
			( window as any ).wp.data.select( 'core/block-editor' ).getBlocks()
				.length > 0
	);
}

/**
 * The reviewer's half: a fresh session on the saved post decides in Editing
 * and then leaves without saving, accepting the unsaved-changes prompt if
 * one appears. Ends on a freshly loaded editor.
 *
 * @param page   Playwright page.
 * @param action The decision.
 * @return Whether the browser raised an unsaved-changes prompt on leave.
 */
async function decideThenLeaveWithoutSaving(
	page: any,
	action: 'Accept' | 'Reject'
) {
	// A fresh session for the reviewer.
	await page.reload();
	await waitForEditor( page );
	await switchIntent( page, 'Editing' );
	await decideSuggestion( page, action );

	const dirtyAfterDecision = await page.evaluate( () =>
		( window as any ).wp.data.select( 'core/editor' ).isEditedPostDirty()
	);

	let promptedOnLeave = false;
	const onDialog = async ( dialog: any ) => {
		if ( dialog.type() === 'beforeunload' ) {
			promptedOnLeave = true;
		}
		await dialog.accept();
	};
	page.on( 'dialog', onDialog );
	// Leave without saving.
	await page.reload();
	await waitForEditor( page );
	page.off( 'dialog', onDialog );

	return { dirtyAfterDecision, promptedOnLeave };
}

/**
 * Everything the stuck state is made of, read from the server, the reopened
 * editor, and the front end. Recorded as an annotation on the running test.
 *
 * @param args              Arguments.
 * @param args.page         Playwright page.
 * @param args.editor       Editor fixture.
 * @param args.requestUtils Request utils fixture.
 * @param args.postId       Post id.
 * @param args.leave        Result of `decideThenLeaveWithoutSaving`.
 * @return The observations.
 */
async function observe( { page, editor, requestUtils, postId, leave }: any ) {
	const post: any = await requestUtils.rest( {
		path: `/wp/v2/posts/${ postId }`,
		params: { context: 'edit' },
	} );
	const notes: any[] = await requestUtils.rest( {
		path: '/wp/v2/comments',
		params: {
			post: postId,
			type: 'note',
			status: 'all',
			context: 'edit',
			per_page: 50,
		},
	} );

	const editorContent = await editor.getEditedPostContent();
	const sidebar = await openNotesSidebar( page );
	// Let the thread list load from the server before counting controls.
	await sidebar
		.getByText( /^(Applied|Rejected)$/ )
		.waitFor( { state: 'visible', timeout: 5000 } )
		.catch( () => {} );
	const acceptButtons = await sidebar
		.getByRole( 'button', { name: 'Accept suggestion' } )
		.count();
	const rejectButtons = await sidebar
		.getByRole( 'button', { name: 'Reject suggestion' } )
		.count();
	const sidebarText = (
		( await sidebar.innerText().catch( () => '' ) ) as string
	 )
		.replace( /\s+/g, ' ' )
		.trim();
	const canvasMarkers = await editor.canvas
		.locator( 'mark.wp-suggestion' )
		.count();
	const canvasPendingBlocks = await editor.canvas
		.locator( '[class*="is-suggestion-pending"]' )
		.count();

	await page.goto( `/?p=${ postId }&preview=true` );
	const frontEnd = (
		( await page
			.locator( '.wp-block-post-content, .entry-content' )
			.first()
			.innerHTML()
			.catch( () => '' ) ) as string
	 )
		.replace( /\s+/g, ' ' )
		.trim();

	const observed = {
		dirtyAfterDecision: leave.dirtyAfterDecision,
		promptedOnLeave: leave.promptedOnLeave,
		rawPostContent: post.content.raw,
		notes: notes.map( ( note ) => ( {
			id: note.id,
			status: note.status,
			suggestionStatus: note.meta?._wp_suggestion_status,
		} ) ),
		reloadedEditorContent: editorContent,
		canvasMarkers,
		canvasPendingBlocks,
		sidebar: { acceptButtons, rejectButtons, text: sidebarText },
		frontEnd,
	};
	test.info().annotations.push( {
		type: 'observed stuck state',
		description: JSON.stringify( observed, null, 2 ),
	} );
	// eslint-disable-next-line no-console
	console.log(
		`[${ test.info().title }]\n${ JSON.stringify( observed, null, 2 ) }`
	);
	return observed;
}

test.describe( 'Suggestion mode decisions survive leaving without saving', () => {
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

	test( 'an accepted inline addition is kept after leaving without saving', async ( {
		editor,
		page,
		requestUtils,
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
		await page.keyboard.type( ' world' );
		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="add"]'
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );
		await editor.saveDraft();
		const postId = await currentPostId( page );

		const leave = await decideThenLeaveWithoutSaving( page, 'Accept' );
		const observed = await observe( {
			page,
			editor,
			requestUtils,
			postId,
			leave,
		} );

		// The decision was recorded on the note...
		expect( observed.notes[ 0 ]?.suggestionStatus ).toBe( 'applied' );
		// ...so the post must reflect it: the text is permanent, no marker.
		expect( observed.rawPostContent ).toContain( 'Hello world' );
		expect( observed.rawPostContent ).not.toContain( 'data-suggestion' );
		expect( observed.frontEnd ).toContain( 'Hello world' );
	} );

	test( 'a rejected inline addition stays removed after leaving without saving', async ( {
		editor,
		page,
		requestUtils,
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
		await page.keyboard.type( ' world' );
		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="add"]'
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );
		await editor.saveDraft();
		const postId = await currentPostId( page );

		const leave = await decideThenLeaveWithoutSaving( page, 'Reject' );
		const observed = await observe( {
			page,
			editor,
			requestUtils,
			postId,
			leave,
		} );

		expect( observed.notes[ 0 ]?.suggestionStatus ).toBe( 'rejected' );
		expect( observed.rawPostContent ).not.toContain( 'world' );
		expect( observed.rawPostContent ).not.toContain( 'data-suggestion' );
	} );

	test( 'an accepted inline deletion stays deleted after leaving without saving', async ( {
		editor,
		page,
		pageUtils,
		requestUtils,
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
		await page.keyboard.press( 'Backspace' );
		await expect(
			paragraph.locator(
				'mark.wp-suggestion[data-suggestion-type="del"]'
			)
		).toHaveAttribute( 'data-suggestion-id', /\d/ );
		await editor.saveDraft();
		const postId = await currentPostId( page );

		const leave = await decideThenLeaveWithoutSaving( page, 'Accept' );
		const observed = await observe( {
			page,
			editor,
			requestUtils,
			postId,
			leave,
		} );

		expect( observed.notes[ 0 ]?.suggestionStatus ).toBe( 'applied' );
		expect( observed.rawPostContent ).not.toContain( 'world' );
		expect( observed.rawPostContent ).not.toContain( 'data-suggestion' );
		expect( observed.frontEnd ).not.toContain( 'world' );
	} );

	test( 'an accepted block insertion is kept after leaving without saving', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Existing paragraph' },
		} );
		await switchIntent( page, 'Suggesting' );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first()
			.click();
		await page.keyboard.press( 'End' );
		const suggestionSaved = suggestionSavedPromise( page );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Brand new suggested paragraph' );
		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.nth( 1 )
		).toHaveClass( /is-suggestion-pending-insert/ );
		await suggestionSaved;
		await editor.saveDraft();
		const postId = await currentPostId( page );

		const leave = await decideThenLeaveWithoutSaving( page, 'Accept' );
		const observed = await observe( {
			page,
			editor,
			requestUtils,
			postId,
			leave,
		} );

		expect( observed.notes[ 0 ]?.suggestionStatus ).toBe( 'applied' );
		expect( observed.rawPostContent ).toContain(
			'Brand new suggested paragraph'
		);
		expect( observed.rawPostContent ).not.toContain( 'pending-insert' );
		expect( observed.frontEnd ).toContain(
			'Brand new suggested paragraph'
		);
	} );

	test( 'an accepted attribute suggestion is kept after leaving without saving', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'My Heading', level: 2 },
		} );
		await switchIntent( page, 'Suggesting' );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.first()
			.click();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: /^Heading 2$/ } )
			.click();
		const suggestionSaved = suggestionSavedPromise( page );
		await page.getByRole( 'menuitem', { name: /^Heading 3/ } ).click();
		await suggestionSaved;
		await editor.saveDraft();
		const postId = await currentPostId( page );

		const leave = await decideThenLeaveWithoutSaving( page, 'Accept' );
		const observed = await observe( {
			page,
			editor,
			requestUtils,
			postId,
			leave,
		} );

		expect( observed.notes[ 0 ]?.suggestionStatus ).toBe( 'applied' );
		expect( observed.rawPostContent ).toContain( '"level":3' );
		expect( observed.rawPostContent ).not.toContain( 'pending-attributes' );
		expect( observed.frontEnd ).toContain( '<h3' );
	} );
} );
