import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

// Regression tests: a synced meta change dispatches a meta edit on peers.
// That edit must not freeze the peer's `meta._crdt_document` (which changes
// on every save), and the refetch after another user saves must clear meta
// edits whose own properties all match the refetched record — otherwise the
// peer's meta edit survives every save and marks the post dirty forever.
//
// These tests assert on the presence of the `meta` edit rather than
// `isEditedPostDirty()`: peers currently also carry a lazy `content`
// serializer edit whenever remote block updates arrive (see the closure
// injection in getPostChangesFromCRDTDoc), which keeps the record dirty
// independently of the meta bug fixed here.
test.describe( 'Collaboration - Peer meta edits after another user saves', () => {
	async function getEditKeys( page: Page ) {
		return page.evaluate( () => {
			const postId = window.wp.data
				.select( 'core/editor' )
				.getCurrentPostId();
			return Object.keys(
				window.wp.data
					.select( 'core' )
					.getEntityRecordEdits( 'postType', 'post', postId ) ?? {}
			);
		} );
	}

	async function editFootnotesMeta( page: Page, noteId: string ) {
		await page.evaluate( ( id ) => {
			window.wp.data.dispatch( 'core/editor' ).editPost( {
				meta: {
					footnotes: JSON.stringify( [
						{ id, content: `Note ${ id }` },
					] ),
				},
			} );
		}, noteId );
	}

	async function getEditedFootnotes( page: Page ) {
		return page.evaluate( () => {
			const postId = window.wp.data
				.select( 'core/editor' )
				.getCurrentPostId();
			return window.wp.data
				.select( 'core' )
				.getEditedEntityRecord( 'postType', 'post', postId )?.meta
				?.footnotes;
		} );
	}

	// Save via the store with a completion watcher instead of
	// `editor.saveDraft()`, so failures land on the assertions below instead
	// of inside a helper waiting for a saved indicator.
	async function saveAndWait( page: Page ) {
		await page.evaluate( () => {
			( window as any ).__e2eSaveSettled = new Promise( ( resolve ) => {
				const { select, subscribe } = window.wp.data;
				let sawSaving = false;
				const unsubscribe = subscribe( () => {
					if ( select( 'core/editor' ).isSavingPost() ) {
						sawSaving = true;
					} else if ( sawSaving ) {
						unsubscribe();
						resolve( true );
					}
				} );
			} );
			window.wp.data.dispatch( 'core/editor' ).savePost();
		} );
		await page.evaluate( () => ( window as any ).__e2eSaveSettled );
	}

	test( "peer's synced meta edit is cleared after the author saves", async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Peer meta edit test',
			content: '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );
		const { page2 } = collaborationUtils;

		// User A makes a meta change. Footnotes live in post meta, so this
		// stands in for any plugin writing post meta from the editor.
		await editFootnotesMeta( page, 'note-from-a' );

		// The meta change syncs to user B as an entity edit before A saves.
		await expect
			.poll( () => getEditedFootnotes( page2 ), { timeout: 10000 } )
			.toContain( 'note-from-a' );
		expect( await getEditKeys( page2 ) ).toContain( 'meta' );

		// User A saves. The save persists a new CRDT document in post meta,
		// and B refetches the record when the save marker syncs.
		await saveAndWait( page );

		// The regression: B's synced meta edit must be cleared by the
		// refetch. On the base branch it survives forever — the dispatched
		// edit froze B's stale `_crdt_document`, which can never match the
		// refetched record.
		await expect
			.poll( () => getEditKeys( page2 ), { timeout: 10000 } )
			.not.toContain( 'meta' );

		// B still sees the saved meta value.
		await expect
			.poll( () => getEditedFootnotes( page2 ) )
			.toContain( 'note-from-a' );
	} );

	test( "peer's own meta edit is cleared once the author has saved it", async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Peer own meta edit test',
			content: '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );
		const { page2 } = collaborationUtils;

		// User B makes a meta change and does not save.
		await editFootnotesMeta( page2, 'note-from-b' );
		expect( await getEditKeys( page2 ) ).toContain( 'meta' );

		// B's meta change syncs to A. While it is unsaved everywhere, both
		// clients hold a meta edit.
		await expect
			.poll( () => getEditedFootnotes( page ), { timeout: 10000 } )
			.toContain( 'note-from-b' );

		// A saves, persisting B's synced meta change.
		await saveAndWait( page );

		// Wait until B's refetch after A's save has landed: B's persisted
		// record carries the footnote.
		await expect
			.poll(
				() =>
					page2.evaluate( () => {
						const postId = window.wp.data
							.select( 'core/editor' )
							.getCurrentPostId();
						return window.wp.data
							.select( 'core' )
							.getEntityRecord( 'postType', 'post', postId )?.meta
							?.footnotes;
					} ),
				{ timeout: 10000 }
			)
			.toContain( 'note-from-b' );

		// B's meta edit was persisted by A's save, so it must no longer
		// count as a pending edit, and the value must survive. (Guards the
		// property-wise pruning against both under- and over-pruning.)
		await expect
			.poll( () => getEditKeys( page2 ), { timeout: 10000 } )
			.not.toContain( 'meta' );
		await expect
			.poll( () => getEditedFootnotes( page2 ) )
			.toContain( 'note-from-b' );
	} );
} );
