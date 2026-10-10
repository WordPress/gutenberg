/**
 * E2E: the save pass keeps proposed content out of the stored post (#73411).
 *
 * On save, the server moves what a suggestion proposes (added text, an
 * inserted block, a proposed attribute value) out of `post_content` onto the
 * suggestion's note and leaves a content-free anchor in its place. The front
 * end, search, feeds and any plugin reading the post see the baseline only.
 * Edit-context REST reads, which is what the editor loads, put the proposal
 * back for users who can read suggestions, so the editor shows exactly what
 * was saved.
 *
 * The stored content is read through a test plugin, since `content.raw` is
 * the re-inflated view.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const RAW_CONTENT_PLUGIN = 'gutenberg-test-suggestion-raw-content';

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
		.first()
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

async function reloadEditor( page: any ) {
	await page.reload();
	await waitForEditor( page );
}

async function isDirty( page: any ): Promise< boolean > {
	return page.evaluate( () =>
		( window as any ).wp.data.select( 'core/editor' ).isEditedPostDirty()
	);
}

async function readStoredContent(
	requestUtils: any,
	postId: number
): Promise< string > {
	const response: any = await requestUtils.rest( {
		path: `/gutenberg-test/v1/suggestion-raw-content/${ postId }`,
	} );
	return response.content;
}

async function readEditContent(
	requestUtils: any,
	postId: number
): Promise< string > {
	const post: any = await requestUtils.rest( {
		path: `/wp/v2/posts/${ postId }`,
		params: { context: 'edit' },
	} );
	return post.content.raw;
}

async function searchPosts( requestUtils: any, term: string ) {
	const posts: any[] = await requestUtils.rest( {
		path: '/wp/v2/posts',
		params: { search: term, status: 'draft,publish', context: 'edit' },
	} );
	return posts.map( ( post ) => post.id );
}

async function suggestAddition( { editor, page }: any ) {
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
	await page.keyboard.type( ' zanzibarian' );
	await expect(
		paragraph.locator( 'mark.wp-suggestion-add' )
	).toHaveAttribute( 'data-suggestion-id', /\d/ );
	await suggestionSaved;
	await editor.saveDraft();
	return currentPostId( page );
}

async function suggestBlockInsertion( { editor, page }: any ) {
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
	await page.keyboard.type( 'Quixotic suggested paragraph' );
	await expect(
		editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.nth( 1 )
	).toHaveClass( /is-suggestion-pending-insert/ );
	await suggestionSaved;
	await editor.saveDraft();
	return currentPostId( page );
}

async function suggestHeadingLevel( { editor, page }: any ) {
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
	return currentPostId( page );
}

test.describe( 'Suggestion mode keeps proposals out of the stored post', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
		await requestUtils.activatePlugin( RAW_CONTENT_PLUGIN );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( RAW_CONTENT_PLUGIN );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'an inline addition is stored as an anchor and comes back in the editor', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const postId = await suggestAddition( { editor, page } );
		expect( await isDirty( page ) ).toBe( false );

		const stored = await readStoredContent( requestUtils, postId );
		expect( stored ).toContain( 'Hello' );
		expect( stored ).not.toContain( 'zanzibarian' );
		expect( stored ).toContain( 'data-suggestion-run=' );
		expect( await searchPosts( requestUtils, 'zanzibarian' ) ).toEqual(
			[]
		);

		// Editors still get the proposal.
		expect( await readEditContent( requestUtils, postId ) ).toContain(
			'zanzibarian</mark>'
		);
		await reloadEditor( page );
		await expect(
			editor.canvas.locator( 'mark.wp-suggestion-add' )
		).toHaveText( ' zanzibarian' );
		expect( await isDirty( page ) ).toBe( false );
	} );

	test( 'accepting an extracted addition and saving publishes its text', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const postId = await suggestAddition( { editor, page } );
		await reloadEditor( page );
		await switchIntent( page, 'Editing' );
		await decideSuggestion( page, 'Accept' );
		await editor.saveDraft();

		const stored = await readStoredContent( requestUtils, postId );
		expect( stored ).toContain( 'Hello zanzibarian' );
		expect( stored ).not.toContain( 'data-suggestion' );
	} );

	test( 'a suggested block is stored as a placeholder and comes back in the editor', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const postId = await suggestBlockInsertion( { editor, page } );
		expect( await isDirty( page ) ).toBe( false );

		const stored = await readStoredContent( requestUtils, postId );
		expect( stored ).toContain( 'Existing paragraph' );
		expect( stored ).not.toContain( 'Quixotic' );
		expect( stored ).toContain( '<!-- wp:suggestion-placeholder ' );
		expect( await searchPosts( requestUtils, 'Quixotic' ) ).toEqual( [] );

		await reloadEditor( page );
		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.nth( 1 )
		).toHaveClass( /is-suggestion-pending-insert/ );
		await expect(
			editor.canvas.getByText( 'Quixotic suggested paragraph' )
		).toBeVisible();
		expect( await isDirty( page ) ).toBe( false );

		// Accept and save: the block becomes real content.
		await switchIntent( page, 'Editing' );
		await decideSuggestion( page, 'Accept' );
		await editor.saveDraft();
		const accepted = await readStoredContent( requestUtils, postId );
		expect( accepted ).toContain( 'Quixotic suggested paragraph' );
		expect( accepted ).not.toContain( 'suggestion-placeholder' );
	} );

	test( 'a proposed attribute value is stored on the note, not in the post', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const postId = await suggestHeadingLevel( { editor, page } );

		const stored = await readStoredContent( requestUtils, postId );
		expect( stored ).toContain( '<h2' );
		expect( stored ).not.toContain( '"after"' );

		expect( await readEditContent( requestUtils, postId ) ).toContain(
			'"after"'
		);
		await reloadEditor( page );
		expect( await isDirty( page ) ).toBe( false );
		await switchIntent( page, 'Editing' );
		await decideSuggestion( page, 'Accept' );
		await editor.saveDraft();
		const accepted = await readStoredContent( requestUtils, postId );
		expect( accepted ).toContain( '<h3' );
	} );

	test( 'a plugin saving the stored content back keeps the suggestion', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const postId = await suggestAddition( { editor, page } );
		const stored = await readStoredContent( requestUtils, postId );

		// What a plugin reading `post_content` and writing it back sends.
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/posts/${ postId }`,
			data: { content: stored },
		} );

		expect( await readStoredContent( requestUtils, postId ) ).toBe(
			stored
		);
		await reloadEditor( page );
		await expect(
			editor.canvas.locator( 'mark.wp-suggestion-add' )
		).toHaveText( ' zanzibarian' );
	} );

	test( 'a formatting suggestion is stored as an anchor around the original run', async ( {
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
		const suggestionSaved = suggestionSavedPromise( page );
		await pageUtils.pressKeys( 'primary+b' );
		await expect(
			paragraph.locator( 'mark.wp-suggestion-format' )
		).toContainText( 'world' );
		await suggestionSaved;
		await editor.saveDraft();
		const postId = await currentPostId( page );
		expect( await isDirty( page ) ).toBe( false );

		const stored = await readStoredContent( requestUtils, postId );
		expect( stored ).toContain( 'Hello ' );
		expect( stored ).toContain( 'world</mark>' );
		expect( stored ).not.toContain( '<strong>' );

		await reloadEditor( page );
		await expect(
			editor.canvas.locator( 'mark.wp-suggestion-format strong' )
		).toHaveText( 'world' );
		expect( await isDirty( page ) ).toBe( false );

		await switchIntent( page, 'Editing' );
		await decideSuggestion( page, 'Accept' );
		await editor.saveDraft();
		const accepted = await readStoredContent( requestUtils, postId );
		expect( accepted ).toContain( '<strong>world</strong>' );
		expect( accepted ).not.toContain( 'data-suggestion' );
	} );

	test( 'a suggested move is stored in the original order and comes back in the editor', async ( {
		editor,
		page,
		requestUtils,
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
		await editor.saveDraft();
		const postId = await currentPostId( page );
		expect( await isDirty( page ) ).toBe( false );

		const stored = await readStoredContent( requestUtils, postId );
		expect( stored.indexOf( 'First paragraph' ) ).toBeLessThan(
			stored.indexOf( 'Second paragraph' )
		);
		expect( stored ).toContain( '"type":"pending-move"' );

		// Editors get the proposed order back.
		const edit = await readEditContent( requestUtils, postId );
		expect( edit.indexOf( 'Second paragraph' ) ).toBeLessThan(
			edit.indexOf( 'First paragraph' )
		);
		expect( edit ).not.toContain( 'suggestion-placeholder' );
		await reloadEditor( page );
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveText( [ 'Second paragraph', 'First paragraph' ] );
		expect( await isDirty( page ) ).toBe( false );

		// Accept and save: the new order becomes the stored one.
		await switchIntent( page, 'Editing' );
		await decideSuggestion( page, 'Accept' );
		await editor.saveDraft();
		const accepted = await readStoredContent( requestUtils, postId );
		expect( accepted.indexOf( 'Second paragraph' ) ).toBeLessThan(
			accepted.indexOf( 'First paragraph' )
		);
		expect( accepted ).not.toContain( 'pending-move' );
	} );
} );
