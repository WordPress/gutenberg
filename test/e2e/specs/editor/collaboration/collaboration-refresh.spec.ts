/**
 * External dependencies
 */
import type { BrowserContext, Page } from '@playwright/test';

/**
 * WordPress dependencies
 */
import { Editor } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { SECOND_USER } from './fixtures/collaboration-utils';

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';

test.describe( 'Collaboration - Refresh', () => {
	let secondContext: BrowserContext;
	let page2: Page;
	let editor2: Editor;

	test.afterEach( async () => {
		await secondContext?.close();
	} );

	test( 'User A edits are synced to User B after User A refreshes', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
		admin,
	} ) => {
		// Destructuring collaborationUtils activates the fixture which
		// enables the collaboration setting and creates the second user.
		void collaborationUtils;

		const post = await requestUtils.createPost( {
			title: 'Refresh Sync Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		// Step 1: User A opens the post, adds content, and saves.
		await admin.visitAdminPage(
			'post.php',
			`post=${ post.id }&action=edit`
		);
		await editor.setPreferences( 'core/edit-post', {
			welcomeGuide: false,
			fullscreenMode: false,
		} );
		await page.waitForFunction(
			() =>
				( window as any )._wpCollaborationEnabled === true &&
				window?.wp?.data &&
				window?.wp?.blocks,
			{ timeout: 15000 }
		);

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Saved content from User A' },
		} );

		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).savePost()
		);

		await page.waitForTimeout( 3000 );

		// Step 2: User B loads the post and adds content.
		secondContext = await page
			.context()
			.browser()!
			.newContext( { baseURL: BASE_URL } );
		page2 = await secondContext.newPage();

		await page2.goto( '/wp-login.php' );
		await page2.locator( '#user_login' ).fill( SECOND_USER.username );
		await page2.locator( '#user_pass' ).fill( SECOND_USER.password );
		await page2.getByRole( 'button', { name: 'Log In' } ).click();
		await page2.waitForURL( '**/wp-admin/**' );

		await page2.goto( `/wp-admin/post.php?post=${ post.id }&action=edit` );
		await page2.waitForFunction(
			() => window?.wp?.data && window?.wp?.blocks
		);
		await page2.evaluate( () => {
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-post', 'welcomeGuide', false );
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-post', 'fullscreenMode', false );
		} );
		await page2.waitForFunction(
			() =>
				( window as any )._wpCollaborationEnabled === true &&
				window?.wp?.data &&
				window?.wp?.blocks,
			{ timeout: 15000 }
		);
		editor2 = new Editor( { page: page2 } );

		// Wait for both users to discover each other via awareness.
		await Promise.all( [
			page
				.getByRole( 'button', { name: /Collaborators list/ } )
				.waitFor( { timeout: 15000 } ),
			page2
				.getByRole( 'button', { name: /Collaborators list/ } )
				.waitFor( { timeout: 15000 } ),
		] );

		await page.waitForTimeout( 3000 );

		// User B adds content.
		await page2.evaluate( () => {
			const block = window.wp.blocks.createBlock( 'core/paragraph', {
				content: 'Content from User B',
			} );
			window.wp.data.dispatch( 'core/block-editor' ).insertBlock( block );
		} );

		// User A should see User B's content.
		await expect
			.poll(
				async () => {
					const blocks = await editor.getBlocks();
					return blocks.map(
						( b: { attributes: Record< string, unknown > } ) =>
							b.attributes.content
					);
				},
				{ timeout: 5000 }
			)
			.toContain( 'Content from User B' );

		await page.waitForTimeout( 3000 );

		// Step 3: User A refreshes the page.
		await page.reload( { waitUntil: 'load' } );

		// Wait for collaboration to re-initialize after refresh.
		await page.waitForFunction(
			() =>
				( window as any )._wpCollaborationEnabled === true &&
				window?.wp?.data &&
				window?.wp?.blocks,
			{ timeout: 15000 }
		);

		// Wait for both users to re-discover each other via awareness.
		await Promise.all( [
			page
				.getByRole( 'button', { name: /Collaborators list/ } )
				.waitFor( { timeout: 15000 } ),
			page2
				.getByRole( 'button', { name: /Collaborators list/ } )
				.waitFor( { timeout: 15000 } ),
		] );

		await page.waitForTimeout( 3000 );

		// Step 4: User A adds new content after refresh.
		await page.evaluate( () => {
			const block = window.wp.blocks.createBlock( 'core/paragraph', {
				content: 'After refresh from User A',
			} );
			window.wp.data.dispatch( 'core/block-editor' ).insertBlock( block );
		} );

		// User B should see User A's new content.
		// The bug in #75976 causes User A's post-refresh edits to be
		// invisible to User B despite the polling connection appearing active.
		await expect
			.poll(
				async () => {
					const blocks = await editor2.getBlocks();
					return blocks.map(
						( b: { attributes: Record< string, unknown > } ) =>
							b.attributes.content
					);
				},
				{ timeout: 5000 }
			)
			.toContain( 'After refresh from User A' );
	} );
} );
