/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

/**
 * WordPress dependencies
 */
import type { Editor } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import {
	SECOND_USER,
	applyFastSyncTimings,
} from './fixtures/collaboration-utils';
import type { UserCredentials } from './fixtures/collaboration-utils';

const THIRD_USER: UserCredentials = {
	username: 'chaos_user',
	email: 'chaos@example.com',
	firstName: 'Chaos',
	lastName: 'Tester',
	password: 'password',
	roles: [ 'editor' ],
};

const INITIAL_PARAGRAPH =
	'Our team gathers every Teusday morning. We share progres on thier projects.';

const INITIAL_CONTENT = `<!-- wp:paragraph -->\n<p>${ INITIAL_PARAGRAPH }</p>\n<!-- /wp:paragraph -->`;

// Match both URL forms: pretty permalinks (`/wp-json/wp-sync/v1/updates`)
// and the default rest_route query string
// (`/index.php?rest_route=%2Fwp-sync%2Fv1%2Fupdates`). The encoded form
// trips up the equivalent glob pattern, so use a predicate.
const SYNC_ROUTE = ( url: URL ): boolean =>
	url.href.includes( 'wp-sync%2Fv1%2Fupdates' ) ||
	url.pathname.includes( '/wp-sync/v1/updates' );

// Click the Edit Anyway path on the connection error modal so the user
// can keep editing locally while disconnected. Same flow as
// collaboration-edit-anyway.spec.ts.
async function dismissIntoOfflineMode( page: Page ) {
	const errorModal = page.getByRole( 'dialog', {
		name: 'Connection lost',
	} );
	// With fast filters the retry/dialog cascade collapses to under a
	// second; without them the with-collaborators schedule sums to ~15s.
	// Headroom keeps this resilient if the wp.hooks trap misses.
	await expect( errorModal ).toBeVisible( { timeout: 25_000 } );
	await errorModal.getByRole( 'button', { name: 'Edit Anyway' } ).click();

	const confirmModal = page.getByRole( 'dialog', {
		name: 'Edit while disconnected?',
	} );
	await expect( confirmModal ).toBeVisible();
	await confirmModal.getByRole( 'button', { name: 'Edit Anyway' } ).click();
	await expect( confirmModal ).toBeHidden();
}

// Save the offline user's draft. If the merge confirmation dialog surfaces
// (the server has CRDT changes the user has not seen), dismiss it by
// overwriting the server CRDT so the user's full local state survives the
// save. The bug investigation hypothesizes this is the path that triggers
// compaction-loss.
//
// `editor.saveDraft()` blocks until the "Draft saved" notice appears, but
// the notice never fires while the merge dialog is open. Race them: the
// dialog handler (if it shows up) clicks Save without merging; the saveDraft
// promise then resolves once the snackbar appears.
async function saveOverwritingServer( page: Page, ed: Editor ) {
	const mergeDialog = page.getByRole( 'dialog', {
		name: 'Merge server changes?',
	} );
	const handleMergeDialog = ( async () => {
		await mergeDialog.waitFor( { timeout: 5_000 } ).catch( () => {} );
		if ( await mergeDialog.isVisible() ) {
			await mergeDialog
				.getByRole( 'button', { name: 'Save without merging' } )
				.click();
		}
	} )();
	await Promise.all( [ ed.saveDraft(), handleMergeDialog ] );
}

// Concurrent edits exercising three different operations:
//   - Online fixes typos in-place (per-character replaces).
//   - Offline-1 prepends a new sentence.
//   - Offline-2 selects all and replaces wholesale.
// All three use real keyboard events so per-keystroke Y.js updates
// flow through the sync queue (offline) or push (online).
async function applyConcurrentEdits( {
	onlinePage,
	onlineEditor,
	pageOff1,
	editorOff1,
	pageOff2,
	editorOff2,
}: {
	onlinePage: Page;
	onlineEditor: Editor;
	pageOff1: Page;
	editorOff1: Editor;
	pageOff2: Page;
	editorOff2: Editor;
} ) {
	for ( const [ typo, fix ] of [
		[ 'Teusday', 'Tuesday' ],
		[ 'progres', 'progress' ],
		[ 'thier', 'their' ],
	] as const ) {
		await onlineEditor.canvas
			.getByText( typo, { exact: false } )
			.first()
			.dblclick();
		await onlinePage.keyboard.type( fix );
	}

	await editorOff1.canvas.getByText( /Our team gathers/ ).click();
	await pageOff1.keyboard.press( 'Home' );
	await pageOff1.keyboard.type( 'Mondays are quiet. ' );

	await editorOff2.canvas.getByText( /Our team gathers/ ).click();
	await pageOff2.keyboard.press( 'ControlOrMeta+a' );
	await pageOff2.keyboard.type( 'Weekly team check-in.' );
}

test.describe( 'Collaboration - Chaos merge after offline reconnect', () => {
	// Tight per-test budget so failures surface within ~30 s rather than the
	// default 100 s. Login + open + concurrent edits + reconnect should fit.
	test.setTimeout( 90_000 );

	for ( const firstReconnect of [ 'offline1', 'offline2' ] as const ) {
		test( `three users converge after reconnect (${ firstReconnect } first)`, async ( {
			collaborationUtils,
			requestUtils,
			editor: onlineEditor,
			page: onlinePage,
		} ) => {
			// Create THIRD_USER inside the test body. The collaborationUtils
			// fixture runs `deleteAllUsers()` during setup, so creating this
			// user in `beforeEach` would race the fixture and lose the user
			// before the test starts.
			await requestUtils.createUser( THIRD_USER );

			const post = await requestUtils.createPost( {
				title: 'Chaos merge test',
				content: INITIAL_CONTENT,
				status: 'draft',
				date_gmt: new Date().toISOString(),
			} );

			// Apply fast sync timings to all three users' contexts before
			// any editor JS loads. The init script registers @wordpress/sync
			// polling-manager filters via a wp.hooks setter trap.
			await applyFastSyncTimings( onlinePage.context() );

			await collaborationUtils.openPost( post.id );

			const { page: pageOff1, editor: editorOff1 } =
				await collaborationUtils.joinUser( post.id, SECOND_USER, {
					applyFastSyncTimings: true,
				} );
			const { page: pageOff2, editor: editorOff2 } =
				await collaborationUtils.joinUser( post.id, THIRD_USER, {
					applyFastSyncTimings: true,
				} );

			await collaborationUtils.waitForMutualDiscovery();

			// Disconnect the two soon-to-be-offline users by aborting all
			// sync-endpoint requests on their pages.
			await pageOff1.route( SYNC_ROUTE, ( r ) => r.abort( 'failed' ) );
			await pageOff2.route( SYNC_ROUTE, ( r ) => r.abort( 'failed' ) );

			await Promise.all( [
				dismissIntoOfflineMode( pageOff1 ),
				dismissIntoOfflineMode( pageOff2 ),
			] );

			await applyConcurrentEdits( {
				onlinePage,
				onlineEditor,
				pageOff1,
				editorOff1,
				pageOff2,
				editorOff2,
			} );

			// Save each offline user once while still disconnected. This
			// exercises the prePersistPostType / _crdt_document snapshot
			// rewrite path that the bug investigation flags as part of
			// the divergence mechanism.
			await saveOverwritingServer( pageOff1, editorOff1 );
			await saveOverwritingServer( pageOff2, editorOff2 );

			const orderedReconnects: Array< [ Page, Editor ] > =
				firstReconnect === 'offline1'
					? [
							[ pageOff1, editorOff1 ],
							[ pageOff2, editorOff2 ],
					  ]
					: [
							[ pageOff2, editorOff2 ],
							[ pageOff1, editorOff1 ],
					  ];

			for ( const [ pg ] of orderedReconnects ) {
				await pg.unroute( SYNC_ROUTE );
				await collaborationUtils.waitForSyncCycle( pg, 5 );
			}

			// All three users must converge to the same serialized block
			// tree. Today this assertion fails: the second reconnecter
			// holds zombie characters (e.g. "esi") inside their
			// paragraph while the first reconnecter and the online user
			// agree on a clean merged document.
			await expect( async () => {
				const [ blocksOnline, blocksOff1, blocksOff2 ] =
					await Promise.all( [
						onlineEditor.getBlocks(),
						editorOff1.getBlocks(),
						editorOff2.getBlocks(),
					] );
				const serializedOnline = JSON.stringify( blocksOnline );
				expect( JSON.stringify( blocksOff1 ) ).toEqual(
					serializedOnline
				);
				expect( JSON.stringify( blocksOff2 ) ).toEqual(
					serializedOnline
				);
			} ).toPass( { timeout: 8_000 } );
		} );
	}
} );
