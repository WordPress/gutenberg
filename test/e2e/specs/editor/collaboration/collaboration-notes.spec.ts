/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - Notes Sync', () => {
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
	} );

	test( 'User A adds a note, User B sees it', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Notes Sync Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph --><p>Block with note</p><!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2 } = collaborationUtils;

		// User A inserts a block and adds a note.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Note target block' },
		} );

		await editor.clickBlockOptionsMenuItem( 'Add note' );
		await page
			.getByRole( 'textbox', { name: 'New note', exact: true } )
			.fill( 'Hello from User A' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Add note', exact: true } )
			.click();

		// Verify the note appears locally for User A first.
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: 'Note: Hello from User A' } )
		).toBeVisible();

		// Wait for sync to propagate the block metadata and the
		// collection save event to User B.
		await collaborationUtils.waitForSyncCycle( page );
		await collaborationUtils.waitForSyncCycle( page2 );

		// Open the All Notes sidebar on User B's page.
		const toggleButton = page2
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes', exact: true } );

		// The button may need a moment to appear after the note syncs.
		await expect( toggleButton ).toBeVisible( { timeout: 10000 } );
		const isExpanded = await toggleButton.getAttribute( 'aria-expanded' );
		if ( isExpanded === 'false' ) {
			await toggleButton.click();
		}

		// User B should see the note from User A.
		await expect(
			page2
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: 'Note: Hello from User A' } )
		).toBeVisible( { timeout: 10000 } );
	} );

	test( 'User B adds a note, User A sees it', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Notes Sync Test - B to A',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2 } = collaborationUtils;

		// User A inserts a block so both users have content.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Shared paragraph' },
		} );

		// Wait for the block to sync to User B.
		await collaborationUtils.waitForSyncCycle( page );
		await collaborationUtils.waitForSyncCycle( page2 );

		// User B clicks on the synced block in the canvas to select it.
		const page2Editor = collaborationUtils.editor2;
		await page2Editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Shared paragraph' } )
			.click();

		// User B adds a note using the block options menu.
		await page2Editor.clickBlockOptionsMenuItem( 'Add note' );
		await page2
			.getByRole( 'textbox', { name: 'New note', exact: true } )
			.fill( 'Note from User B' );
		await page2
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Add note', exact: true } )
			.click();

		// Verify the note appears locally for User B.
		await expect(
			page2
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: 'Note: Note from User B' } )
		).toBeVisible();

		// Wait for sync cycles.
		await collaborationUtils.waitForSyncCycle( page2 );
		await collaborationUtils.waitForSyncCycle( page );

		// Open notes sidebar on User A's page.
		const toggleButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes', exact: true } );
		await expect( toggleButton ).toBeVisible( { timeout: 10000 } );
		const isExpanded = await toggleButton.getAttribute( 'aria-expanded' );
		if ( isExpanded === 'false' ) {
			await toggleButton.click();
		}

		// User A should see the note from User B.
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: 'Note: Note from User B' } )
		).toBeVisible( { timeout: 10000 } );
	} );

	test( 'Note with reply syncs between users', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Notes Reply Sync Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2 } = collaborationUtils;

		// User A inserts a block and adds a note with a reply.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Block for reply test' },
		} );

		await editor.clickBlockOptionsMenuItem( 'Add note' );
		await page
			.getByRole( 'textbox', { name: 'New note', exact: true } )
			.fill( 'Main note' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Add note', exact: true } )
			.click();

		// Wait for note to be saved before adding a reply.
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: 'Note: Main note' } )
		).toBeVisible();

		// Add a reply.
		await page
			.getByRole( 'textbox', { name: 'Reply to' } )
			.fill( 'A reply to the note' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Reply', exact: true } )
			.click();

		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Reply added.' } )
		).toBeVisible();

		// Wait for sync cycles.
		await collaborationUtils.waitForSyncCycle( page );
		await collaborationUtils.waitForSyncCycle( page2 );

		// Open notes sidebar on User B's page.
		const toggleButton = page2
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes', exact: true } );
		await expect( toggleButton ).toBeVisible( { timeout: 10000 } );
		const isExpanded = await toggleButton.getAttribute( 'aria-expanded' );
		if ( isExpanded === 'false' ) {
			await toggleButton.click();
		}

		// User B should see the main note.
		const thread = page2
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'treeitem', { name: 'Note: Main note' } );
		await expect( thread ).toBeVisible( { timeout: 10000 } );

		// Expand the thread to see the reply.
		await thread.click();

		// User B should see both the main note content and the reply.
		await expect(
			page2.locator( '.editor-collab-sidebar-panel__user-comment' ).last()
		).toHaveText( 'A reply to the note', { timeout: 5000 } );
	} );
} );
