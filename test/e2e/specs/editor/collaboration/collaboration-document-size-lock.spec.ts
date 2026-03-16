/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { SECOND_USER } from './fixtures/collaboration-utils';

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';

test.describe( 'Collaboration with large documents', () => {
	test( 'shows post-locked modal when document size limit is exceeded', async ( {
		collaborationUtils,
		requestUtils,
		admin,
		editor,
		page,
	} ) => {
		// Create a draft post with content exceeding MAX_UPDATE_SIZE_IN_BYTES (1 MB).
		// When the editor loads this post, the Yjs document initialization
		// produces an update larger than the limit, triggering the polling
		// manager to emit 'document-size-limit-exceeded' and unregister
		// the room.
		const largeContent =
			'<!-- wp:paragraph -->\n<p>' +
			'x'.repeat( 1.1 * 1024 * 1024 ) +
			'</p>\n<!-- /wp:paragraph -->';
		const post = await requestUtils.createPost( {
			title: 'Document Size Lock Test',
			content: largeContent,
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		const postRoom = `postType/post:${ post.id }`;

		// User 1 (admin) opens the large post.
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

		// Wait for collaboration to be disabled. The large content
		// triggers the size check in onDocUpdate, which emits the
		// 'document-size-limit-exceeded' status and unregisters the room.
		await page.waitForFunction(
			() =>
				window?.wp?.data
					?.select( 'core/editor' )
					?.isCollaborationEnabledForCurrentPost?.() === false,
			{ timeout: 15000 }
		);

		// Verify the sync connection status is 'document-size-limit-exceeded'.
		const syncStatus = await page.evaluate( () => {
			return window.wp.data.select( 'core' ).getSyncConnectionStatus();
		} );
		expect( syncStatus ).toEqual( {
			status: 'document-size-limit-exceeded',
		} );

		// Verify that the post's entity room is no longer included in
		// sync polling requests. Race between the next sync response and
		// a timeout — if a response arrives, assert it doesn't contain
		// the post's room; if the timeout wins, polling has stopped
		// entirely. Either outcome confirms the room was unregistered.
		const POLL_TIMEOUT = 3000;
		const nextSyncResponse = page.waitForResponse(
			( res ) => res.url().includes( 'wp-sync' ) && res.status() === 200
		);
		const timeout = new Promise< 'timeout' >( ( resolve ) =>
			setTimeout( () => resolve( 'timeout' ), POLL_TIMEOUT )
		);
		const result = await Promise.race( [ nextSyncResponse, timeout ] );

		if ( result !== 'timeout' ) {
			const body = await result.text();
			expect( body ).not.toContain( postRoom );
		}

		// Set up second browser context for User 2.
		const secondContext = await admin.browser.newContext( {
			baseURL: BASE_URL,
		} );
		const page2 = await secondContext.newPage();

		try {
			// Log in the second user.
			await page2.goto( '/wp-login.php' );
			await page2.locator( '#user_login' ).fill( SECOND_USER.username );
			await page2.locator( '#user_pass' ).fill( SECOND_USER.password );
			await page2.getByRole( 'button', { name: 'Log In' } ).click();
			await page2.waitForURL( '**/wp-admin/**' );

			// User 2 navigates to the same post.
			await page2.goto(
				`/wp-admin/post.php?post=${ post.id }&action=edit`
			);

			// Wait for wp.data to be available on User 2's page.
			await page2.waitForFunction(
				() => window?.wp?.data && window?.wp?.blocks,
				{ timeout: 15000 }
			);

			// Assert the post-locked modal appears.
			// Because collaboration is disabled (document too large),
			// WordPress falls back to standard post-locking. User 2
			// sees the "This post is already being edited" modal.
			const modal = page2.getByRole( 'dialog', {
				name: 'This post is already being edited',
			} );
			await expect( modal ).toBeVisible( { timeout: 15000 } );

			// Assert the explanation about document size limit.
			await expect(
				modal.getByText(
					'Because this post is too large for real-time collaboration, only one person can edit at a time.'
				)
			).toBeVisible();

			// Assert the "Take over" option is available.
			await expect(
				modal.getByRole( 'link', { name: 'Take over' } )
			).toBeVisible();
		} finally {
			await secondContext.close();
		}
	} );
} );
