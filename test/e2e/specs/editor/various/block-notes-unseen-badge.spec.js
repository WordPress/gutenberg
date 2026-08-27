const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Serializes `count` paragraphs, each anchoring one of the given note ids.
 *
 * The editor only treats a thread as belonging to a block when the block's
 * metadata carries its note id, so seeded notes need matching post content.
 *
 * @param {number[]} noteIds Note thread ids, one per paragraph.
 * @return {string} Serialized post content.
 */
function contentWithNotes( noteIds ) {
	return noteIds
		.map(
			( noteId, index ) =>
				`<!-- wp:paragraph {"metadata":{"noteId":[${ noteId }]}} -->\n<p>Paragraph ${
					index + 1
				}</p>\n<!-- /wp:paragraph -->`
		)
		.join( '\n\n' );
}

test.use( {
	notesUtils: async ( { requestUtils }, use ) => {
		await use( new NotesUtils( { requestUtils } ) );
	},
} );

test.describe( 'Notes: unseen badge', () => {
	/** @type {number} */
	let collaboratorId;

	test.beforeAll( async ( { requestUtils } ) => {
		// Clear any collaborator left behind by an interrupted run, which
		// would otherwise make the username collide.
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
		// The badge's "last seen" timestamps live in the persisted
		// preferences, which otherwise leak from one test into the next.
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

	test( 'counts a collaborator’s note, then clears for good once the sidebar is opened', async ( {
		admin,
		page,
		notesUtils,
	} ) => {
		const { postId } = await notesUtils.createPostWithNotes( [
			{ author: collaboratorId, content: 'Please rework this' },
		] );

		await admin.editPost( postId );

		const toggle = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes' } );
		const badge = page.locator( '.interface-complementary-area__badge' );

		await expect( badge ).toHaveText( '1' );
		// The exact count is what assistive technology is given.
		await expect( toggle ).toHaveAccessibleName( 'All notes, 1 unseen' );

		// Opening the sidebar marks the notes as seen.
		await toggle.click();
		await expect( badge ).toBeHidden();
		await expect( toggle ).toHaveAccessibleName( 'All notes' );

		// And it stays cleared across a reload, because the timestamp is
		// persisted rather than held in memory.
		await admin.editPost( postId );
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'All notes' } )
		).toBeVisible();
		await expect( badge ).toBeHidden();

		// New activity from the collaborator brings the badge back.
		await notesUtils.addNoteToPost( postId, {
			author: collaboratorId,
			content: 'One more thing',
		} );
		await admin.editPost( postId );
		await expect( badge ).toHaveText( '1' );
	} );

	test( 'never counts the current user’s own notes', async ( {
		admin,
		page,
		notesUtils,
	} ) => {
		const { postId } = await notesUtils.createPostWithNotes( [
			{ content: 'A note to self' },
			{ author: collaboratorId, content: 'A note from a collaborator' },
		] );

		await admin.editPost( postId );

		// Two open threads, one of them the admin's own: the badge counts one.
		await expect(
			page.locator( '.interface-complementary-area__badge' )
		).toHaveText( '1' );
	} );

	test( 'truncates counts above nine while announcing the exact number', async ( {
		admin,
		page,
		notesUtils,
	} ) => {
		const { postId } = await notesUtils.createPostWithNotes(
			Array.from( { length: 12 }, ( _, index ) => ( {
				author: collaboratorId,
				content: `Note ${ index + 1 }`,
			} ) )
		);

		await admin.editPost( postId );

		await expect(
			page.locator( '.interface-complementary-area__badge' )
		).toHaveText( '9+' );
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'All notes' } )
		).toHaveAccessibleName( 'All notes, 12 unseen' );
	} );

	test( 'clears when a thread is selected without opening the sidebar', async ( {
		admin,
		page,
		notesUtils,
	} ) => {
		const { postId } = await notesUtils.createPostWithNotes( [
			{ author: collaboratorId, content: 'Worth a second look' },
		] );

		/*
		 * The floating panel collapses itself on a narrow canvas, and the
		 * default 1280px window minus the admin menu and the settings sidebar
		 * lands under that threshold. Widen so the panel this test is about
		 * actually renders.
		 */
		await page.setViewportSize( { width: 1500, height: 900 } );
		await admin.editPost( postId );

		const badge = page.locator( '.interface-complementary-area__badge' );
		await expect( badge ).toHaveText( '1' );

		const toggle = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes' } );
		await expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );

		/*
		 * Closing the settings sidebar leaves no complementary area active,
		 * which is what lets the floating notes panel put itself up. Read the
		 * note there and never touch "All notes": selecting the thread is what
		 * proves the note was read.
		 */
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Close Settings' } )
			.click();

		const thread = page
			.getByRole( 'treeitem', { name: /Worth a second look/ } )
			.first();
		await expect( thread ).toBeVisible();

		// The panel showing up is not the user doing anything, so the note is
		// readable on screen and still counted.
		await expect( badge ).toHaveText( '1' );

		// Selecting the thread is the act that counts.
		await thread.click();
		await expect( badge ).toBeHidden();

		// The sidebar was never opened, and the clear survives a reload.
		await admin.editPost( postId );
		await expect( toggle ).toBeVisible();
		await expect( badge ).toBeHidden();
	} );

	test( 'starting a new note of your own does not clear the badge', async ( {
		admin,
		page,
		editor,
		notesUtils,
	} ) => {
		const { postId } = await notesUtils.createPostWithNotes( [
			{ author: collaboratorId, content: 'Still needs reading' },
		] );

		await admin.editPost( postId );

		const badge = page.locator( '.interface-complementary-area__badge' );
		await expect( badge ).toHaveText( '1' );

		// Authoring a note selects the 'new' form, which is not reading
		// anybody else's note.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first()
			.click();
		await editor.clickBlockOptionsMenuItem( 'Add note' );
		await expect(
			page.getByRole( 'textbox', { name: 'New note', exact: true } )
		).toBeFocused();

		await expect( badge ).toHaveText( '1' );
	} );

	test( 'does not count resolved threads', async ( {
		admin,
		page,
		notesUtils,
	} ) => {
		const { postId, noteIds } = await notesUtils.createPostWithNotes( [
			{ author: collaboratorId, content: 'Already handled' },
			{ author: collaboratorId, content: 'Still open' },
		] );
		await notesUtils.resolveNote( noteIds[ 0 ] );

		await admin.editPost( postId );

		// Both threads are unseen; only the open one is counted.
		await expect(
			page.locator( '.interface-complementary-area__badge' )
		).toHaveText( '1' );
	} );
} );

class NotesUtils {
	/** @type {import('@wordpress/e2e-test-utils-playwright').RequestUtils} */
	#requestUtils;

	constructor( { requestUtils } ) {
		this.#requestUtils = requestUtils;
	}

	/**
	 * Creates a note on a post, mirroring what the editor sends.
	 *
	 * `status: 'hold'` is not optional: the comments controller stores a note
	 * as approved - that is, resolved - when no status is given.
	 *
	 * @param {number}  postId       Post to attach the note to.
	 * @param {Object}  note         Note to create.
	 * @param {?number} note.author  Author id. Defaults to the requesting user.
	 * @param {string}  note.content Note body.
	 * @return {Promise<Object>} The created note.
	 */
	async addNoteToPost( postId, { author, content } ) {
		return this.#requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/comments',
			data: {
				post: postId,
				type: 'note',
				status: 'hold',
				content,
				...( author ? { author } : {} ),
			},
		} );
	}

	/**
	 * Creates a post carrying one anchored note per entry.
	 *
	 * The post is created first because a note needs a post to hang off, then
	 * its content is rewritten so every block points at the note it owns.
	 *
	 * @param {Array} notes Notes to seed.
	 * @return {Promise<{postId: number, noteIds: number[]}>} The new post and its note ids.
	 */
	async createPostWithNotes( notes ) {
		const post = await this.#requestUtils.createPost( {
			title: 'Notes badge',
			content: '',
			status: 'draft',
		} );

		const noteIds = [];
		for ( const note of notes ) {
			const created = await this.addNoteToPost( post.id, note );
			noteIds.push( created.id );
		}

		await this.#requestUtils.rest( {
			method: 'PUT',
			path: `/wp/v2/posts/${ post.id }`,
			data: { content: contentWithNotes( noteIds ) },
		} );

		return { postId: post.id, noteIds };
	}

	/**
	 * Resolves one note thread the way the sidebar does, by flipping the
	 * thread root to approved.
	 *
	 * @param {number} noteId Thread root to resolve.
	 */
	async resolveNote( noteId ) {
		await this.#requestUtils.rest( {
			method: 'PUT',
			path: `/wp/v2/comments/${ noteId }`,
			data: { status: 'approved' },
		} );
	}
}
