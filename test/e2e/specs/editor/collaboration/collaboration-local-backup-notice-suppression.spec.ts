/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

const NOTICE_TEXT =
	'The backup of this post in your browser is different from the version below.';

async function getCurrentPostId( page: Page ): Promise< number > {
	return page.evaluate( () =>
		( window as any ).wp.data.select( 'core/editor' ).getCurrentPostId()
	);
}

function backupStorageKey( postId: number ): string {
	return `wp-autosave-block-editor-post-${ postId }`;
}

test.describe( 'Collaboration - browser backup notice suppression', () => {
	// The editor keeps a sessionStorage backup of unsaved changes. In RTC,
	// those changes also live in the shared document, so after an event that
	// legitimately moves the post past them (e.g. restoring an older revision
	// from another session), the backup is stale: offering to restore it would
	// resurrect reverted content for every collaborator. The backup records a
	// CRDT snapshot of the shared document it captured. On load, the shared
	// document is verified against that snapshot; when it provably contains
	// everything the backup did, the backup is redundant and is cleared
	// without a notice. When the backup has no snapshot, or the document does
	// not contain it, the notice must still appear, because the backup may be
	// the only copy of the content.
	test( 'clears the backup without a notice when the shared document contains it', async ( {
		collaborationUtils,
		editor,
		page,
		requestUtils,
	} ) => {
		test.setTimeout( 120_000 );

		const baseMarker = 'rtc-backup-suppression-base';
		const backupMarker = 'rtc-backup-suppression-backup';
		const laterMarker = 'rtc-backup-suppression-later';
		const baseContent = `<!-- wp:paragraph -->\n<p>${ baseMarker }</p>\n<!-- /wp:paragraph -->`;

		const post = await requestUtils.createPost( {
			title: 'RTC browser backup notice suppression',
			status: 'draft',
			content: baseContent,
			date_gmt: new Date( Date.now() - 60 * 60 * 1000 ).toISOString(),
		} );

		// Open a two-user session. The sync update queue is paused in solo
		// sessions, so a second collaborator is required for the edits below
		// to reach the sync backend and be there on reload.
		await collaborationUtils.openCollaborativeSession( post.id );
		await collaborationUtils.waitForEntityReady( page, {
			timeout: 30_000,
		} );

		const postId = await getCurrentPostId( page );
		expect( postId ).toBe( post.id );

		// Make an edit, then write the browser backup for it.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: backupMarker },
		} );
		await page.evaluate( () =>
			( window as any ).wp.data
				.dispatch( 'core/editor' )
				.autosave( { local: true } )
		);

		// The backup captured the shared document state as a CRDT snapshot.
		const backup = await page.evaluate(
			( key ) => window.sessionStorage.getItem( key ),
			backupStorageKey( postId )
		);
		expect( backup ).not.toBeNull();
		const parsedBackup = JSON.parse( backup as string );
		expect( parsedBackup.content ).toContain( backupMarker );
		expect( parsedBackup.crdt_snapshot ).toBeTruthy();

		// Make a further edit after the backup. The backup content now
		// matches no state the editor can show after reload, so only the
		// snapshot check (not the content-equality check) can legitimately
		// clear the backup. This keeps the test meaningful regardless of how
		// far sync has progressed when the notice decision runs.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: laterMarker },
		} );

		// Let the edits propagate to the sync backend.
		await collaborationUtils.waitForSyncCycle( page, 3, {
			timeout: 30_000,
		} );

		// Revert the post to its base content from outside the session. This
		// stands in for restoring an older revision from another browser: the
		// post moves past the backed-up changes without this tab saving.
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/posts/${ postId }`,
			data: { content: baseContent },
		} );

		// Reload. The shared document still contains everything the backup
		// captured, so the backup is redundant: no notice, and the backup is
		// ejected from storage.
		await page.reload();
		await collaborationUtils.waitForCollaborationReady( page, {
			timeout: 30_000,
		} );
		await collaborationUtils.waitForEntityReady( page, {
			timeout: 30_000,
		} );

		// No server autosave exists, so the "more recent autosave" settings
		// flag cannot be what suppresses the backup notice below.
		const autosaveSetting = await page.evaluate(
			() =>
				( window as any ).wp.data
					.select( 'core/editor' )
					.getEditorSettings().autosave
		);
		expect( autosaveSetting ).toBeUndefined();

		// Wait for a sync cycle so the deferred notice decision has run.
		await collaborationUtils.waitForSyncCycle( page, 1, {
			timeout: 30_000,
		} );

		// Outwait the decision's fail-open deadline
		// (SNAPSHOT_STATUS_SYNC_WAIT_MS in the editor provider) so that
		// asserting absence below is meaningful. Without this, the assertion
		// could pass before a wrongly triggered fail-open shows the notice.
		// eslint-disable-next-line no-restricted-syntax, playwright/no-wait-for-timeout
		await page.waitForTimeout( 3_500 );

		await expect(
			page.locator( '.components-notice__content' ).filter( {
				hasText: NOTICE_TEXT,
			} )
		).toHaveCount( 0 );

		// The redundant backup was ejected from storage, proving the shared
		// document was found to contain the snapshot rather than the notice
		// merely not rendering.
		const backupAfterReload = await page.evaluate(
			( key ) => window.sessionStorage.getItem( key ),
			backupStorageKey( postId )
		);
		expect( backupAfterReload ).toBeNull();
	} );

	test( 'still shows the notice when the backup has no snapshot', async ( {
		collaborationUtils,
		page,
		requestUtils,
	} ) => {
		test.setTimeout( 120_000 );

		const post = await requestUtils.createPost( {
			title: 'RTC browser backup notice fail-open',
			status: 'draft',
			content:
				'<!-- wp:paragraph -->\n<p>rtc-backup-fail-open-base</p>\n<!-- /wp:paragraph -->',
			date_gmt: new Date( Date.now() - 60 * 60 * 1000 ).toISOString(),
		} );

		await collaborationUtils.openPost( post.id );
		await collaborationUtils.waitForEntityReady( page, {
			timeout: 30_000,
		} );

		const postId = await getCurrentPostId( page );

		// Seed a backup without a CRDT snapshot, as written by an editor
		// without collaboration (or by an older version of the editor). There
		// is no evidence the backed-up content is in the shared document, so
		// the editor must fall back to showing the notice. This also guards
		// against regressing into a blanket suppression under RTC.
		await page.evaluate(
			( { key, content } ) => {
				window.sessionStorage.setItem(
					key,
					JSON.stringify( {
						post_title: 'RTC browser backup notice fail-open',
						content,
						excerpt: '',
					} )
				);
			},
			{
				key: backupStorageKey( postId ),
				content:
					'<!-- wp:paragraph -->\n<p>rtc-backup-unsynced-content</p>\n<!-- /wp:paragraph -->',
			}
		);

		await page.reload();
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
