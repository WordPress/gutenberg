import {
	test,
	expect,
	type Editor,
	type Page,
	type RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';

type CreatedRecord = { id: number };

/**
 * Resolves when the editor finishes a POST to the autosaves endpoint.
 *
 * @param page Playwright page.
 */
function waitForAutosave( page: Page ) {
	return page.waitForResponse(
		( response ) =>
			response.request().method() === 'POST' &&
			decodeURIComponent( response.url() ).includes( '/autosaves' ) &&
			response.ok(),
		// Well below the 60 second autosave interval, so only an immediate
		// autosave satisfies it.
		{ timeout: 10_000 }
	);
}

async function addNote( editor: Editor, page: Page, content: string ) {
	await editor.clickBlockOptionsMenuItem( 'Add note' );
	await page
		.getByRole( 'textbox', { name: 'New note', exact: true } )
		.pressSequentially( content );
	await page
		.getByRole( 'region', { name: 'Editor settings' } )
		.getByRole( 'button', { name: 'Add note', exact: true } )
		.click();
	await expect(
		page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'treeitem', { name: `Note: ${ content }` } )
	).toBeVisible();
}

async function getFirstBlockNoteIds( editor: Editor ) {
	const [ block ] = await editor.getBlocks();
	return block?.attributes?.metadata?.noteId ?? [];
}

/**
 * Creates a backdated published post, so an autosave made during the test is
 * strictly newer than it. The editor discards autosaves that aren't.
 *
 * @param requestUtils Request utils.
 * @param content      Post content.
 */
function createPublishedPost( requestUtils: RequestUtils, content: string ) {
	return requestUtils.rest< CreatedRecord >( {
		method: 'POST',
		path: '/wp/v2/posts',
		data: {
			title: 'Unsaved note anchors',
			content,
			status: 'publish',
			date: '2024-01-01T00:00:00',
		},
	} );
}

function createNote( requestUtils: RequestUtils, postId: number ) {
	return requestUtils.rest< CreatedRecord >( {
		method: 'POST',
		path: '/wp/v2/comments',
		data: {
			post: postId,
			content: 'Anchored in the autosave',
			type: 'note',
			status: 'hold',
		},
	} );
}

const PARAGRAPH = '<!-- wp:paragraph --><p>Keep me attached</p><!-- /wp:paragraph -->';

function paragraphWithNote( noteId: number ) {
	return `<!-- wp:paragraph {"metadata":{"noteId":[${ noteId }]}} --><p>Keep me attached</p><!-- /wp:paragraph -->`;
}

test.describe( 'Block Notes: unsaved note anchors', () => {
	test.beforeEach( async ( { page } ) => {
		// Leaving a post with unsaved changes asks for confirmation.
		page.on( 'dialog', ( dialog ) => void dialog.accept() );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.deleteAllPosts();
	} );

	test( 'keeps a note attached after reloading an unsaved draft', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Keep me attached' },
		} );

		const autosave = waitForAutosave( page );
		await addNote( editor, page, 'Unsaved anchor note' );
		await autosave;

		await page.reload();
		await expect
			.poll( () => getFirstBlockNoteIds( editor ) )
			.toHaveLength( 1 );
	} );

	test( 'removes the anchor after deleting a note on an unsaved draft', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Keep me attached' },
		} );
		await addNote( editor, page, 'Note to delete' );
		await editor.saveDraft();

		// Saving collapses the thread, which hides its actions.
		const thread = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'treeitem', { name: 'Note: Note to delete' } );
		await thread.click();
		await thread.getByRole( 'button', { name: 'Actions' } ).click();
		await page.getByRole( 'menuitem', { name: 'Delete' } ).click();

		const autosave = waitForAutosave( page );
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Delete' } )
			.click();
		await autosave;

		await page.reload();
		await expect
			.poll( () => getFirstBlockNoteIds( editor ) )
			.toHaveLength( 0 );
	} );

	test( 're-attaches a note on a published post from the autosave', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await createPublishedPost( requestUtils, PARAGRAPH );
		const note = await createNote( requestUtils, post.id );
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/posts/${ post.id }/autosaves`,
			data: { content: paragraphWithNote( note.id ) },
		} );

		await admin.editPost( post.id );

		await expect
			.poll( () => getFirstBlockNoteIds( editor ) )
			.toEqual( [ note.id ] );
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Notes reattached from an autosave.' } )
		).toBeVisible();
	} );

	test( 're-attaches a note added in the editor after a reload', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await createPublishedPost( requestUtils, PARAGRAPH );
		await admin.editPost( post.id );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();

		const autosave = waitForAutosave( page );
		await addNote( editor, page, 'Published post note' );
		await autosave;

		await page.reload();
		await expect
			.poll( () => getFirstBlockNoteIds( editor ) )
			.toHaveLength( 1 );
	} );

	test( 'does not re-attach from an autosave older than the post', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		const post = await createPublishedPost( requestUtils, PARAGRAPH );
		const note = await createNote( requestUtils, post.id );
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/posts/${ post.id }/autosaves`,
			data: { content: paragraphWithNote( note.id ) },
		} );
		// Saving the post afterwards makes the autosave stale.
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/posts/${ post.id }`,
			data: { content: PARAGRAPH, date: new Date().toISOString() },
		} );

		await admin.editPost( post.id );
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toBeVisible();
		expect( await getFirstBlockNoteIds( editor ) ).toHaveLength( 0 );
	} );
} );
