import type { Page } from '@playwright/test';
import {
	test,
	expect,
	type Editor,
	type RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';

type CreatedRecord = { id: number };
type Post = { content: { raw: string } };

const PARAGRAPH =
	'<!-- wp:paragraph --><p>Keep me attached</p><!-- /wp:paragraph -->';

function createPublishedPost( requestUtils: RequestUtils ) {
	return requestUtils.rest< CreatedRecord >( {
		method: 'POST',
		path: '/wp/v2/posts',
		data: {
			title: 'Unsaved note anchors',
			content: PARAGRAPH,
			status: 'publish',
		},
	} );
}

function getSavedContent( requestUtils: RequestUtils, postId: number ) {
	return requestUtils
		.rest< Post >( {
			path: `/wp/v2/posts/${ postId }`,
			params: { context: 'edit' },
		} )
		.then( ( post ) => post.content.raw );
}

async function addNote( editor: Editor, page: Page, content: string ) {
	await editor.clickBlockOptionsMenuItem( 'Add note' );
	await page
		.getByRole( 'textbox', { name: 'New note', exact: true } )
		.fill( content );
	await page
		.getByRole( 'region', { name: /^(Notes|Editor settings)$/ } )
		.getByRole( 'button', { name: 'Add note', exact: true } )
		.click();
	await expect( getThread( page, content ) ).toBeVisible();
}

function getThread( page: Page, content: string ) {
	return page
		.getByRole( 'region', { name: /^(Notes|Editor settings)$/ } )
		.getByRole( 'treeitem', { name: `Note: ${ content }`, exact: true } );
}

// Orphaned notes only list in "All notes".
async function openAllNotes( page: Page ) {
	const toggle = page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'All notes', exact: true } );
	if ( ( await toggle.getAttribute( 'aria-expanded' ) ) === 'false' ) {
		await toggle.click();
	}
}

async function getFirstBlockNoteIds( editor: Editor ): Promise< number[] > {
	const [ block ] = await editor.getBlocks();
	const metadata = block?.attributes?.metadata as
		{ noteId?: number[] } | undefined;
	return metadata?.noteId ?? [];
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
		await editor.saveDraft();

		await addNote( editor, page, 'Unsaved anchor note' );

		await page.reload();
		await expect
			.poll( () => getFirstBlockNoteIds( editor ) )
			.toHaveLength( 1 );
		await openAllNotes( page );
		await expect( getThread( page, 'Unsaved anchor note' ) ).toBeVisible();
	} );

	test( 'drops the snapshot once the post is saved', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Keep me attached' },
		} );
		await editor.saveDraft();
		await addNote( editor, page, 'Saved anchor note' );
		const [ noteId ] = await getFirstBlockNoteIds( editor );
		const getSnapshot = () =>
			requestUtils
				.rest< { meta: { _wp_note_anchor: unknown[] } } >( {
					path: `/wp/v2/comments/${ noteId }`,
					params: { context: 'edit' },
				} )
				.then( ( note ) => note.meta._wp_note_anchor );

		expect( await getSnapshot() ).toHaveLength( 1 );
		// The first save's notice is still up, so wait for the request itself.
		const saved = page.waitForResponse(
			( response ) =>
				response.request().method() === 'POST' &&
				response.url().includes( '/wp/v2/posts/' )
		);
		await editor.saveDraft();
		await saved;
		expect( await getSnapshot() ).toHaveLength( 0 );
	} );

	test( 'keeps a note attached on a published post without updating it', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await createPublishedPost( requestUtils );
		await admin.editPost( post.id );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();

		await addNote( editor, page, 'Published post note' );

		// Adding the note doesn't update the post.
		expect( await getSavedContent( requestUtils, post.id ) ).toBe(
			PARAGRAPH
		);

		await page.reload();
		await expect
			.poll( () => getFirstBlockNoteIds( editor ) )
			.toHaveLength( 1 );
	} );

	test( 'does not save unrelated edits along with the note', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await createPublishedPost( requestUtils );
		await admin.editPost( post.id );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Not ready to publish' },
		} );
		await editor.selectBlocks(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.first()
		);

		await addNote( editor, page, 'Note on a dirty post' );

		await page.reload();
		await expect
			.poll( () => getFirstBlockNoteIds( editor ) )
			.toHaveLength( 1 );
		expect( await editor.getBlocks() ).toHaveLength( 1 );
	} );

	test( 'restores an inline note marker after a reload', async ( {
		admin,
		editor,
		page,
		pageUtils,
		requestUtils,
	} ) => {
		const post = await createPublishedPost( requestUtils );
		await admin.editPost( post.id );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		// Select "Keep".
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'ArrowLeft' );
		await pageUtils.pressKeys( 'Shift+ArrowRight', { times: 4 } );

		await addNote( editor, page, 'Inline anchor note' );
		const mark = editor.canvas.locator( 'mark.wp-note' );
		await expect( mark ).toHaveAttribute( 'data-id', /^\d+$/ );
		const noteId = await mark.getAttribute( 'data-id' );

		await page.reload();
		await expect( editor.canvas.locator( 'mark.wp-note' ) ).toHaveText(
			'Keep'
		);
		await expect( editor.canvas.locator( 'mark.wp-note' ) ).toHaveAttribute(
			'data-id',
			noteId!
		);
	} );

	test( 'leaves the note orphaned when its block changed since', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await createPublishedPost( requestUtils );
		await admin.editPost( post.id );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();

		await addNote( editor, page, 'Note on a changed block' );

		// Someone else changes the block before this user comes back.
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/posts/${ post.id }`,
			data: {
				content:
					'<!-- wp:paragraph --><p>Rewritten</p><!-- /wp:paragraph -->',
			},
		} );

		await page.reload();
		await openAllNotes( page );
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', {
					name: 'Original block deleted. Note: Note on a changed block',
				} )
		).toBeVisible();
		expect( await getFirstBlockNoteIds( editor ) ).toHaveLength( 0 );
	} );
} );
