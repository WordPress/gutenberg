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
