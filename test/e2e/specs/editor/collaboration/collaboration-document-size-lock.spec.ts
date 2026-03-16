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
		// User 2 loads a 1 MB+ post which is slow to initialize.
		test.slow();

		// Create a small draft post — the large content is inserted via
		// the block editor API after the editor has loaded, so User 1's
		// page renders quickly.
		const post = await requestUtils.createPost( {
			title: 'Document Size Lock Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		const postRoom = `postType/post:${ post.id }`;

		// User 1 (admin) opens the post.
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

		// Insert a paragraph block with content exceeding 1 MB
		// (MAX_UPDATE_SIZE_IN_BYTES). This triggers the polling
		// manager's onDocUpdate size check, which emits
		// 'document-size-limit-exceeded' and unregisters the room.
		await page.evaluate( () => {
			const largeContent = 'x'.repeat( 1.01 * 1024 * 1024 );
			window.wp.data.dispatch( 'core/block-editor' ).insertBlock(
				window.wp.blocks.createBlock( 'core/paragraph', {
					content: largeContent,
				} )
			);
		} );

		// Wait for collaboration to be disabled. This confirms the full
		// code path ran: onDocUpdate detected the oversized update,
		// emitted the status, and unregistered the room.
		await page.waitForFunction(
			() =>
				window?.wp?.data
					?.select( 'core/editor' )
					?.isCollaborationEnabledForCurrentPost?.() === false,
			{ timeout: 15000 }
		);

		// Verify the sync connection status is 'disconnected' with
		// a 'document-size-limit-exceeded' error code.
		const syncStatus = await page.evaluate( () => {
			const status = window.wp.data
				.select( 'core' )
				.getSyncConnectionStatus();
			return {
				status: status?.status,
				errorCode: status?.error?.code,
			};
		} );
		expect( syncStatus ).toEqual( {
			status: 'disconnected',
			errorCode: 'document-size-limit-exceeded',
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

		// Save the large content to the database so User 2 loads it.
		await editor.saveDraft();

		// Navigate User 1 away to free up resources for User 2's
		// heavy page load. The post lock persists in the database.
		await page.goto( 'about:blank' );

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

			// User 2 navigates to the same post. The large content
			// from the database triggers the size limit during Yjs
			// initialization, disabling collaboration on their page too.
			await page2.goto(
				`/wp-admin/post.php?post=${ post.id }&action=edit`
			);

			// Assert the post-locked modal appears.
			// Because collaboration is disabled (document too large),
			// WordPress falls back to standard post-locking. User 2
			// sees the "This post is already being edited" modal.
			const modal = page2.getByRole( 'dialog', {
				name: 'This post is already being edited',
			} );
			await expect( modal ).toBeVisible( { timeout: 60000 } );

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
