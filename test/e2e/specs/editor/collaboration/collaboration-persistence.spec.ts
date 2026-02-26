/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - CRDT persistence', () => {
	test( 'persists CRDT document when loading existing post without one', async ( {
		admin,
		collaborationUtils,
		editor,
		page,
		requestUtils,
	} ) => {
		// Create a draft post — it will not have _crdt_document meta.
		const post = await requestUtils.createPost( {
			title: 'Persistence Test - Draft',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		// Open the post in the editor.
		await admin.visitAdminPage(
			'post.php',
			`post=${ post.id }&action=edit`
		);
		await editor.setPreferences( 'core/edit-post', {
			welcomeGuide: false,
			fullscreenMode: false,
		} );

		// Wait for collaboration runtime and entity record to be ready.
		await collaborationUtils.waitForEntityReady( page );

		const persistedCrdtDoc =
			await collaborationUtils.getCrdtDocument( page );
		expect( persistedCrdtDoc ).toBeTruthy();

		// Refresh the page and verify the CRDT document is loaded from the
		// persisted meta and no reconciliation save is triggered.
		await page.reload();
		await collaborationUtils.waitForEntityReady( page );

		const reloadedCrdtDoc =
			await collaborationUtils.getCrdtDocument( page );

		// No invalidations should occur on reload, so the CRDT document should
		// be identical to the one persisted before reload.
		expect( reloadedCrdtDoc ).toBe( persistedCrdtDoc );
	} );

	test( 'does not save CRDT document for auto-draft posts', async ( {
		admin,
		collaborationUtils,
		editor,
		page,
	} ) => {
		// Navigate to create a new post (auto-draft).
		await admin.visitAdminPage( 'post-new.php' );
		await editor.setPreferences( 'core/edit-post', {
			welcomeGuide: false,
			fullscreenMode: false,
		} );

		// Wait for collaboration runtime to initialize separately first, then
		// wait for the entity record resolver to finish.
		await page.waitForFunction(
			() => ( window as any )._wpCollaborationEnabled === true,
			{ timeout: 5000 }
		);
		await collaborationUtils.waitForEntityReady( page, {
			requireCollaboration: false,
		} );

		const persistedCrdtDoc =
			await collaborationUtils.getCrdtDocument( page );
		expect( persistedCrdtDoc ).toBeFalsy();
	} );
} );
