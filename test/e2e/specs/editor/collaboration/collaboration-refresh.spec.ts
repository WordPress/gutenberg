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

		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Saved content from User A' );

		await editor.saveDraft();

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

		// User B adds content below the existing paragraph.
		await editor2.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.last()
			.click();
		await page2.keyboard.press( 'End' );
		await page2.keyboard.press( 'Enter' );
		await page2.keyboard.type( 'Content from User B' );

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

		// Step 4: User A adds new content after refresh.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.last()
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'After refresh from User A' );

		// User B should see User A's new content.
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
