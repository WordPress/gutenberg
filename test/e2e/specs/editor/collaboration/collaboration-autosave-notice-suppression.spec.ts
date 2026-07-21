/**
 * External dependencies
 */
import type { Page, Response } from '@playwright/test';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

const NOTICE_TEXT =
	'There is an autosave of this post that is more recent than the version below.';

type RestPost = {
	id: number;
	modified_gmt?: string;
};

async function getCurrentPostId( page: Page ): Promise< number > {
	return page.evaluate( () =>
		( window as any ).wp.data.select( 'core/editor' ).getCurrentPostId()
	);
}

function isAutosaveResponse( response: Response, postId: number ): boolean {
	if ( response.request().method() !== 'POST' ) {
		return false;
	}

	const url = new URL( response.url() );
	const route = `/wp/v2/posts/${ postId }/autosaves`;

	return (
		url.pathname.includes( `/wp-json${ route }` ) ||
		url.searchParams.get( 'rest_route' ) === route
	);
}

test.describe( 'Collaboration - autosave notice suppression', () => {
	// In RTC, autosaves are stored as per-user revisions and the parent post
	// stays stale, so WordPress core flags "a more recent autosave" on nearly
	// every load. When the autosaving client is synced, it records an
	// author-keyed marker in the shared CRDT document, which lets a later load
	// verify that the autosaved content is already part of the shared
	// document and skip the recovery notice. When no marker made it to the
	// sync backend, the notice must still appear, because the autosave may be
	// the only copy of the content.
	test( 'does not show the notice when the autosave content is already in the shared document', async ( {
		collaborationUtils,
		editor,
		page,
		requestUtils,
	} ) => {
		test.setTimeout( 120_000 );

		const editMarker = 'rtc-autosave-suppression-edit';

		// Backdate the draft so its `post_modified` is deterministically older
		// than the autosave triggered below (autosave timestamps have
		// one-second resolution), without resorting to a wall-clock wait.
		const post = await requestUtils.createPost( {
			title: 'RTC autosave notice suppression',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>rtc-autosave-suppression-base</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date( Date.now() - 60 * 60 * 1000 ).toISOString(),
		} );

		// Open a two-user session. The sync update queue is paused in solo
		// sessions, so a second collaborator is required for the autosaved
		// content (and its marker) to reach the sync backend.
		await collaborationUtils.openCollaborativeSession( post.id );
		await collaborationUtils.waitForEntityReady( page, {
			timeout: 30_000,
		} );

		const postId = await getCurrentPostId( page );
		expect( postId ).toBe( post.id );

		// Make an edit so the autosave below stores a real revision.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: editMarker },
		} );

		// Trigger the autosave and wait for it to complete.
		const autosaveRequest = page.waitForResponse(
			( response ) => isAutosaveResponse( response, postId ),
			{ timeout: 30_000 }
		);
		await page.evaluate( () =>
			( window as any ).wp.data.dispatch( 'core/editor' ).autosave()
		);
		const autosaveResponse = await autosaveRequest;
		expect( autosaveResponse.status() ).toBe( 200 );
		await page.waitForFunction(
			() =>
				! ( window as any ).wp.data
					.select( 'core/editor' )
					.isAutosavingPost(),
			undefined,
			{ timeout: 30_000 }
		);

		// An autosave revision now exists and out-dates the parent post.
		// Without marker-based suppression, the next load would show the
		// recovery notice.
		const autosaves = await requestUtils.rest< RestPost[] >( {
			path: `/wp/v2/posts/${ postId }/autosaves`,
			params: { context: 'edit' },
		} );
		expect( autosaves.length ).toBeGreaterThan( 0 );

		// Let the autosave marker propagate to the sync backend.
		await collaborationUtils.waitForSyncCycle( page, 3, {
			timeout: 30_000,
		} );

		// Reload. The shared document contains the autosaved content and the
		// author's marker, so the notice must not appear.
		await page.reload();
		await collaborationUtils.waitForCollaborationReady( page, {
			timeout: 30_000,
		} );
		await collaborationUtils.waitForEntityReady( page, {
			timeout: 30_000,
		} );

		// The autosaved edit is available through the shared document.
		await expect( editor.canvas.getByText( editMarker ) ).toBeVisible( {
			timeout: 30_000,
		} );

		// Guard against a false pass: the autosave revision must still be
		// newer than the parent post, otherwise core would not flag an
		// autosave at all and the absence of the notice would prove nothing.
		const savedPost = await requestUtils.rest< RestPost >( {
			path: `/wp/v2/posts/${ postId }`,
			params: { context: 'edit' },
		} );
		const [ latestAutosave ] = await requestUtils.rest< RestPost[] >( {
			path: `/wp/v2/posts/${ postId }/autosaves`,
			params: { context: 'edit' },
		} );
		expect( latestAutosave.modified_gmt ?? '' ).not.toBe( '' );
		expect(
			( latestAutosave.modified_gmt ?? '' ) >
				( savedPost.modified_gmt ?? '' )
		).toBe( true );

		// Wait for a sync cycle so the deferred notice decision has run.
		await collaborationUtils.waitForSyncCycle( page, 1, {
			timeout: 30_000,
		} );

		// Outwait the notice's fail-open deadline
		// (AUTOSAVE_NOTICE_SYNC_WAIT_MS in the editor provider) so that
		// asserting absence below is meaningful. Without this, the assertion
		// could pass before a wrongly triggered fail-open shows the notice.
		// eslint-disable-next-line no-restricted-syntax, playwright/no-wait-for-timeout
		await page.waitForTimeout( 3_500 );

		await expect(
			page.locator( '.components-notice__content' ).filter( {
				hasText: NOTICE_TEXT,
			} )
		).toHaveCount( 0 );
	} );

	test( 'still shows the notice when the autosave did not reach the shared document', async ( {
		collaborationUtils,
		page,
		requestUtils,
	} ) => {
		test.setTimeout( 120_000 );

		const post = await requestUtils.createPost( {
			title: 'RTC autosave notice fail-open',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>rtc-autosave-fail-open-base</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date( Date.now() - 60 * 60 * 1000 ).toISOString(),
		} );

		// Create a newer autosave revision directly via REST, without an
		// editor client. No marker for it exists in the shared document, so
		// the editor must fall back to showing the recovery notice. This
		// guards against regressing into a blanket suppression under RTC.
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/posts/${ post.id }/autosaves`,
			data: {
				content:
					'<!-- wp:paragraph -->\n<p>rtc-autosave-unsynced-content</p>\n<!-- /wp:paragraph -->',
			},
		} );

		await collaborationUtils.openPost( post.id );
		await collaborationUtils.waitForEntityReady( page, {
			timeout: 30_000,
		} );

		await expect(
			page.locator( '.components-notice__content' ).filter( {
				hasText: NOTICE_TEXT,
			} )
		).toBeVisible( { timeout: 30_000 } );
	} );
} );
