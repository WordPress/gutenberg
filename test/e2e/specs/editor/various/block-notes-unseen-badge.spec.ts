import {
	test,
	expect,
	type RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';

type SeedNote = { author?: number; content: string };

/**
 * Creates a draft post with one paragraph anchoring each note.
 *
 * Notes need `status: 'hold'`, otherwise the endpoint stores them resolved.
 *
 * @param requestUtils Request utils.
 * @param notes        Notes to seed.
 * @return Post id.
 */
async function createPostWithNotes(
	requestUtils: RequestUtils,
	notes: SeedNote[]
): Promise< number > {
	const post: { id: number } = await requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/posts',
		data: { title: 'Notes badge', status: 'draft' },
	} );
	const noteIds: number[] = [];
	for ( const note of notes ) {
		noteIds.push( ( await addNote( requestUtils, post.id, note ) ).id );
	}
	await requestUtils.rest( {
		method: 'PUT',
		path: `/wp/v2/posts/${ post.id }`,
		data: {
			content: noteIds
				.map(
					( id ) =>
						`<!-- wp:paragraph {"metadata":{"noteId":[${ id }]}} -->\n<p>Paragraph ${ id }</p>\n<!-- /wp:paragraph -->`
				)
				.join( '\n\n' ),
		},
	} );
	return post.id;
}

function addNote(
	requestUtils: RequestUtils,
	postId: number,
	{ author, content }: SeedNote
): Promise< { id: number } > {
	return requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/comments',
		data: { post: postId, type: 'note', status: 'hold', content, author },
	} );
}

test.describe( 'Notes: unseen badge', () => {
	let collaboratorId: number;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllUsers();
		const collaborator = await requestUtils.createUser( {
			username: 'notes-collaborator',
			email: 'notes-collaborator@example.com',
			password: 'notes-collaborator-password',
			roles: [ 'editor' ],
		} );
		collaboratorId = collaborator.id;
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		// The "last seen" timestamps live in the persisted preferences.
		await requestUtils.resetPreferences();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllUsers();
		await requestUtils.resetPreferences();
	} );

	test( 'flags a collaborator’s note until the sidebar is opened', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const postId = await createPostWithNotes( requestUtils, [
			{ content: 'A note to self' },
			{ author: collaboratorId, content: 'Please rework this' },
		] );
		await admin.editPost( postId );

		const toggle = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes' } );
		const badge = page.locator( '.interface-complementary-area__badge' );

		await expect( badge ).toBeVisible();
		await expect( toggle ).toHaveAccessibleName(
			'All notes, new activity'
		);

		await toggle.click();
		await expect( badge ).toBeHidden();
		await expect( toggle ).toHaveAccessibleName( 'All notes' );

		// The cleared state persists across a reload.
		await admin.editPost( postId );
		await expect( toggle ).toBeVisible();
		await expect( badge ).toBeHidden();

		// New activity from the collaborator brings it back.
		await addNote( requestUtils, postId, {
			author: collaboratorId,
			content: 'One more thing',
		} );
		await admin.editPost( postId );
		await expect( badge ).toBeVisible();
	} );

	test( 'clears when a thread is selected', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const postId = await createPostWithNotes( requestUtils, [
			{ author: collaboratorId, content: 'Worth a second look' },
		] );
		// Wide enough for the floating notes to render beside the canvas.
		await page.setViewportSize( { width: 1500, height: 900 } );
		await admin.editPost( postId );

		const badge = page.locator( '.interface-complementary-area__badge' );
		await expect( badge ).toBeVisible();

		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Close Settings' } )
			.click();
		const thread = page
			.getByRole( 'treeitem', { name: /Worth a second look/ } )
			.first();
		await expect( thread ).toBeVisible();
		// The floating note being on screen does not count as seen.
		await expect( badge ).toBeVisible();

		await thread.click();
		await expect( badge ).toBeHidden();
	} );

	test( 'flags each unseen thread until it is selected', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const postId = await createPostWithNotes( requestUtils, [
			{ content: 'A note to self' },
			{ author: collaboratorId, content: 'First question' },
			{ author: collaboratorId, content: 'Second question' },
		] );
		await admin.editPost( postId );
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes' } )
			.click();

		const sidebar = page.getByRole( 'region', { name: 'Editor settings' } );
		const ownThread = sidebar.getByRole( 'treeitem', {
			name: /A note to self/,
		} );
		const firstThread = sidebar.getByRole( 'treeitem', {
			name: /First question/,
		} );
		const secondThread = sidebar.getByRole( 'treeitem', {
			name: /Second question/,
		} );

		// Opening the sidebar advances "last seen", but the flags stay.
		await expect( firstThread ).toHaveAccessibleName( /, new activity$/ );
		await expect( secondThread ).toHaveAccessibleName( /, new activity$/ );
		await expect( ownThread ).not.toHaveAccessibleName( /new activity/ );

		// A 6px dot sits after the note's date and stays put on hover.
		const dot = firstThread.locator(
			'time + .editor-collab-sidebar-panel__unseen-dot'
		);
		await expect( dot ).toHaveCSS( 'width', '6px' );
		await expect( dot ).toHaveCSS( 'height', '6px' );
		await expect( dot ).toHaveText( '' );
		await firstThread.hover();
		await expect( dot ).toHaveCSS( 'width', '6px' );

		await firstThread.click();
		await expect( firstThread ).not.toHaveAccessibleName( /new activity/ );
		await expect( secondThread ).toHaveAccessibleName( /, new activity$/ );
	} );

	test( 'keeps the flags when the sidebar unmounts for the code editor', async ( {
		admin,
		page,
		pageUtils,
		requestUtils,
	} ) => {
		const postId = await createPostWithNotes( requestUtils, [
			{ author: collaboratorId, content: 'First question' },
		] );
		await admin.editPost( postId );
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes' } )
			.click();
		const thread = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'treeitem', { name: /First question/ } );
		await expect( thread ).toHaveAccessibleName( /, new activity$/ );

		await pageUtils.pressKeys( 'secondary+M' );
		await expect( thread ).toBeHidden();
		await pageUtils.pressKeys( 'secondary+M' );
		await expect( thread ).toHaveAccessibleName( /, new activity$/ );
	} );

	test( 'does not count a thread selected while notes are hidden', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const postId = await createPostWithNotes( requestUtils, [
			{ author: collaboratorId, content: 'First question' },
		] );
		await page.setViewportSize( { width: 1500, height: 900 } );
		await admin.editPost( postId );
		await page.evaluate( () =>
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core', 'notesDisplayMode', 'hidden' )
		);

		// Selecting the block selects its thread, which is not on screen.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.click();

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes' } )
			.click();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: /First question/ } )
		).toHaveAccessibleName( /, new activity$/ );
	} );

	test( 'does not flag a reply to the open thread, or a resolved thread', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const postId = await createPostWithNotes( requestUtils, [
			{ author: collaboratorId, content: 'First question' },
			{ author: collaboratorId, content: 'Second question' },
		] );
		await admin.editPost( postId );
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes' } )
			.click();

		const sidebar = page.getByRole( 'region', { name: 'Editor settings' } );
		const firstThread = sidebar.getByRole( 'treeitem', {
			name: /First question/,
		} );
		const secondThread = sidebar.getByRole( 'treeitem', {
			name: /Second question/,
		} );
		await firstThread.click();
		await expect( firstThread ).not.toHaveAccessibleName( /new activity/ );
		await expect( secondThread ).toHaveAccessibleName( /, new activity$/ );

		// The collaborator replies to the open thread and resolves the other.
		const notes: { id: number; content: { rendered: string } }[] =
			await requestUtils.rest( {
				path: '/wp/v2/comments',
				params: { post: postId, type: 'note', status: 'all' },
			} );
		const noteId = ( content: string ) =>
			notes.find( ( note ) => note.content.rendered.includes( content ) )!
				.id;
		await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/comments',
			data: {
				post: postId,
				type: 'note',
				status: 'hold',
				content: 'A late reply',
				author: collaboratorId,
				parent: noteId( 'First question' ),
			},
		} );
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/comments/${ noteId( 'Second question' ) }`,
			data: { status: 'approved' },
		} );
		await page.evaluate( () =>
			window.wp.data
				.dispatch( 'core' )
				.invalidateResolutionForStoreSelector( 'getEntityRecords' )
		);

		await expect( firstThread.getByText( 'A late reply' ) ).toBeVisible();
		await expect( firstThread ).not.toHaveAccessibleName( /new activity/ );
		await expect( secondThread ).not.toHaveAccessibleName( /new activity/ );
	} );

	test( 'flags a minimized thread until it is expanded', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const postId = await createPostWithNotes( requestUtils, [
			{ author: collaboratorId, content: 'First question' },
		] );
		await page.setViewportSize( { width: 1500, height: 900 } );
		await admin.editPost( postId );
		await page.evaluate( () =>
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core', 'notesDisplayMode', 'minimized' )
		);
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Close Settings' } )
			.click();

		const thread = page
			.getByRole( 'region', { name: 'Notes' } )
			.getByRole( 'treeitem', { name: /First question/ } );
		// The name and date are hidden, so the dot sits on the avatar pill.
		const getAvatarDotWidth = () =>
			thread.evaluate(
				( element ) => getComputedStyle( element, '::after' ).width
			);
		await expect( thread.locator( 'time' ) ).toBeHidden();
		await expect.poll( getAvatarDotWidth ).toBe( '6px' );

		// Selecting the block highlights the pill without expanding it.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await expect( thread ).toHaveAttribute( 'aria-expanded', 'true' );
		await expect( thread ).toHaveAccessibleName( /, new activity$/ );

		await thread.click();
		await expect( thread ).not.toHaveAccessibleName( /new activity/ );
	} );

	test( 'starting a note of your own does not clear the badge', async ( {
		admin,
		page,
		editor,
		requestUtils,
	} ) => {
		const postId = await createPostWithNotes( requestUtils, [
			{ author: collaboratorId, content: 'Still needs reading' },
		] );
		await admin.editPost( postId );

		const badge = page.locator( '.interface-complementary-area__badge' );
		await expect( badge ).toBeVisible();

		// A fresh block: selecting the noted one would select its thread.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'My paragraph' },
		} );
		await editor.clickBlockOptionsMenuItem( 'Add note' );
		await expect(
			page.getByRole( 'textbox', { name: 'New note', exact: true } )
		).toBeFocused();
		await expect( badge ).toBeVisible();
	} );
} );
