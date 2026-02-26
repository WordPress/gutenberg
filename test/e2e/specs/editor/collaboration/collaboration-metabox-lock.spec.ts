/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { SECOND_USER } from './fixtures/collaboration-utils';

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';

test.describe( 'Collaboration with meta boxes', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-plugin-meta-box' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-plugin-meta-box' );
	} );

	test( 'shows post-locked modal when meta boxes disable collaboration', async ( {
		collaborationUtils,
		requestUtils,
		admin,
		editor,
		page,
	} ) => {
		// Ensure collaboration is enabled (the fixture enables it, but
		// be explicit to match the pattern of other collaboration tests).
		await collaborationUtils.setCollaboration( true );

		// Create a draft post.
		const post = await requestUtils.createPost( {
			title: 'Meta Box Lock Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		// User 1 (admin) opens the post.
		await admin.visitAdminPage(
			'post.php',
			`post=${ post.id }&action=edit`
		);
		await editor.setPreferences( 'core/edit-post', {
			welcomeGuide: false,
			fullscreenMode: false,
		} );

		// Wait for meta boxes to initialize and disable collaboration.
		// collaborationSupported starts as true, then the meta box hook
		// sets it to false once meta boxes are detected.
		await page.waitForFunction(
			() =>
				window?.wp?.data
					?.select( 'core/editor' )
					?.isCollaborationEnabledForCurrentPost?.() === false,
			{ timeout: 15000 }
		);

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
			// Because collaboration is disabled (meta boxes), WordPress
			// falls back to standard post-locking. User 2 sees the
			// "This post is already being edited" modal.
			const modal = page2.getByRole( 'dialog', {
				name: 'This post is already being edited',
			} );
			await expect( modal ).toBeVisible( { timeout: 15000 } );

			// Assert the explanation about meta box incompatibility.
			await expect(
				modal.getByText(
					'Because this post uses plugins that aren\u2019t compatible with real-time collaboration, only one person can edit at a time.'
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
