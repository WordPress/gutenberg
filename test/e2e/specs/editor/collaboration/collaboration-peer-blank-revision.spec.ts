/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { SECOND_USER } from './fixtures/collaboration-utils';

type RestRevision = {
	id: number;
	author: number;
	modified_gmt: string;
	content?: { raw?: string };
};

async function getCurrentPostId( page: Page ): Promise< number > {
	return page.evaluate( () =>
		( window as any ).wp.data.select( 'core/editor' ).getCurrentPostId()
	);
}

async function autosaveAndSettle( page: Page ): Promise< void > {
	await page.evaluate( () =>
		( window as any ).wp.data.dispatch( 'core/editor' ).autosave()
	);
	await page.waitForFunction(
		() =>
			! ( window as any ).wp.data
				.select( 'core/editor' )
				.isAutosavingPost(),
		undefined,
		{ timeout: 30_000 }
	);
}

test.describe( 'Collaboration - peer blank revision', () => {
	// A per-user autosave revision that is byte-identical to the previous
	// revision renders with an empty Content diff on revision.php (a "blank"
	// revision). This happens under RTC because the parent draft is not updated,
	// so a peer autosave whose content matches the latest shared revision (but
	// differs from the stale parent) is still stored as another, identical,
	// revision. The autosave controller must compare against the latest revision,
	// not the stale parent, so it recognizes the peer autosave as redundant.
	test( 'a peer autosave matching the latest revision does not create a blank revision', async ( {
		collaborationUtils,
		page,
		requestUtils,
	} ) => {
		test.setTimeout( 120_000 );

		const marker = 'peer-blank-revision-content';
		const content = `<!-- wp:paragraph -->\n<p>${ marker }</p>\n<!-- /wp:paragraph -->`;

		// Draft authored by admin, backdated so post_modified is deterministically
		// older than the revisions we create below.
		const post = await requestUtils.createPost( {
			title: 'Peer blank revision',
			status: 'draft',
			content,
			date_gmt: new Date( Date.now() - 60 * 60 * 1000 ).toISOString(),
		} );

		// Admin (author) opens, then a second peer joins the session.
		await collaborationUtils.openPost( post.id );
		await collaborationUtils.waitForEntityReady( page, {
			timeout: 30_000,
		} );

		const { page: peerPage } = await collaborationUtils.joinUser(
			post.id,
			SECOND_USER
		);
		await collaborationUtils.waitForMutualDiscovery();
		await collaborationUtils.waitForEntityReady( peerPage, {
			timeout: 30_000,
		} );

		const postId = await getCurrentPostId( page );

		// Admin edits the shared document. Under RTC this does NOT touch the
		// parent post: the edit stays in the CRDT and the autosave below is stored
		// as a revision, leaving the parent draft stale.
		await page.evaluate( () =>
			( window as any ).wp.data
				.dispatch( 'core/block-editor' )
				.insertBlock(
					( window as any ).wp.blocks.createBlock( 'core/paragraph', {
						content: 'edited-in-collab',
					} )
				)
		);
		await collaborationUtils.waitForSyncCycle( peerPage, 2 );

		// Admin autosaves, creating the first revision (differs from stale parent).
		await autosaveAndSettle( page );

		// The peer's CRDT now matches the admin's latest content but not the stale
		// parent. Its autosave must be recognized as redundant against the latest
		// revision rather than stored as another identical revision.
		await autosaveAndSettle( peerPage );

		const revisions = await requestUtils.rest< RestRevision[] >( {
			path: `/wp/v2/posts/${ postId }/revisions`,
			params: { context: 'edit', per_page: 50 },
		} );

		// Ordered oldest -> newest. A "blank" revision is one whose content is
		// byte-identical to the revision immediately before it.
		const ordered = [ ...revisions ].sort( ( a, b ) =>
			String( a.modified_gmt ).localeCompare( String( b.modified_gmt ) )
		);
		const blankRevisions = ordered.filter(
			( rev, i ) =>
				i > 0 &&
				( rev.content?.raw ?? '' ).trim() ===
					( ordered[ i - 1 ].content?.raw ?? '' ).trim()
		);

		expect( blankRevisions ).toHaveLength( 0 );
	} );
} );
