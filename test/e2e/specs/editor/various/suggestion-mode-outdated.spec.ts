/**
 * E2E: removing someone else's suggestion never deletes their note (#73411).
 *
 * The editor's note collector only trashes the current user's own notes. When
 * an edit removes another author's pending suggestion and the post is saved,
 * the save pass marks the note `outdated`: it is resolved, says why, and can
 * be reopened.
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

async function readNote( requestUtils: any, noteId: number ) {
	return requestUtils.rest( {
		path: `/wp/v2/comments/${ noteId }`,
		params: { context: 'edit' },
	} );
}

/**
 * Suggests " world" after "Hello" and saves the post.
 *
 * @param args        Arguments.
 * @param args.editor Editor fixture.
 * @param args.page   Playwright page.
 * @return The post and note ids.
 */
async function suggestAddition( { editor, page }: any ) {
	await editor.insertBlock( {
		name: 'core/paragraph',
		attributes: { content: 'Hello' },
	} );
	// A title keeps the post saveable once the paragraph is deleted. It is
	// saved before suggesting, since a save from Suggesting leaves staged
	// post field edits out.
	await page.evaluate( () =>
		( window as any ).wp.data
			.dispatch( 'core/editor' )
			.editPost( { title: 'Outdated suggestion' } )
	);
	await editor.saveDraft();
	await switchIntent( page, 'Suggesting' );
	const paragraph = editor.canvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.first();
	await paragraph.click();
	await page.keyboard.press( 'End' );
	await page.keyboard.type( ' world' );
	const mark = paragraph.locator( 'mark.wp-suggestion-add' );
	await expect( mark ).toHaveAttribute( 'data-suggestion-id', /\d/ );
	await editor.saveDraft();
	return {
		postId: await page.evaluate( () =>
			( window as any ).wp.data.select( 'core/editor' ).getCurrentPostId()
		),
		noteId: Number( await mark.getAttribute( 'data-suggestion-id' ) ),
	};
}

test.describe( 'Suggestion mode: outdated suggestions', () => {
	let otherAuthor: any;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
		otherAuthor = await requestUtils.createUser( {
			username: 'outdatedsuggester',
			email: 'outdated.suggester@example.com',
			password: 'outdatedsuggesterpassword',
			roles: [ 'editor' ],
		} );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllUsers();
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( "deleting another author's suggestion and saving outdates it instead of trashing it", async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const { noteId } = await suggestAddition( { editor, page } );
		// The suggestion belongs to someone else from here on.
		await requestUtils.rest( {
			method: 'PUT',
			path: `/wp/v2/comments/${ noteId }`,
			data: { author: otherAuthor.id },
		} );
		await page.reload();
		await waitForEditor( page );
		await switchIntent( page, 'Editing' );
		const sidebar = await openNotesSidebar( page );
		await expect(
			sidebar.getByRole( 'button', { name: 'Accept suggestion' } )
		).toBeVisible();

		// Listen past the collector's grace period: no trash request may go out.
		const trashRequest = page
			.waitForRequest(
				( request: any ) =>
					request.url().includes( `/wp/v2/comments/${ noteId }` ) &&
					( request.postData() ?? '' ).includes( '"trash"' ),
				{ timeout: 3000 }
			)
			.catch( () => null );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first()
			.click();
		await editor.clickBlockOptionsMenuItem( 'Delete' );
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveCount( 0 );
		expect( await trashRequest ).toBeNull();
		expect( ( await readNote( requestUtils, noteId ) ).status ).toBe(
			'hold'
		);

		await editor.saveDraft();
		const note = await readNote( requestUtils, noteId );
		expect( note.status ).toBe( 'approved' );
		expect( note.meta._wp_suggestion_status ).toBe( 'outdated' );

		await page.reload();
		await waitForEditor( page ).catch( () => {} );
		const reloadedSidebar = await openNotesSidebar( page );
		await expect(
			reloadedSidebar.getByText(
				'No longer applies - the text was removed.'
			)
		).toBeVisible();
		await reloadedSidebar.getByRole( 'button', { name: 'Reopen' } ).click();
		await expect
			.poll( async () => {
				const reopened = await readNote( requestUtils, noteId );
				return [ reopened.status, reopened.meta._wp_suggestion_status ];
			} )
			.toEqual( [ 'hold', 'pending' ] );
	} );

	test( 'undoing your own suggestion still withdraws it', async ( {
		editor,
		page,
		pageUtils,
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
		const mark = paragraph.locator( 'mark.wp-suggestion-add' );
		await expect( mark ).toHaveAttribute( 'data-suggestion-id', /\d/ );
		const noteId = Number(
			await mark.getAttribute( 'data-suggestion-id' )
		);
		// The collector acts on anchors it has seen, once the thread loaded.
		const sidebar = await openNotesSidebar( page );
		await expect(
			sidebar.getByRole( 'button', { name: 'Accept suggestion' } )
		).toBeVisible();

		await pageUtils.pressKeys( 'primary+z' );
		await expect( mark ).toHaveCount( 0 );

		await expect
			.poll(
				async () => ( await readNote( requestUtils, noteId ) ).status
			)
			.toBe( 'trash' );
	} );
} );
