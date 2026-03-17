/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - self presence', () => {
	test( 'Self user always appears in collaborators list with "You" label', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Self Presence Test - You Label',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		// Open the collaborators popover.
		const presenceButton = page.getByRole( 'button', {
			name: /Collaborators list/,
		} );
		await expect( presenceButton ).toBeVisible( { timeout: 10000 } );
		await presenceButton.click();

		// The current user should appear with the "You" label.
		await expect(
			page.locator( '.editor-collaborators-presence__list-item', {
				hasText: 'You',
			} )
		).toBeVisible();
	} );

	test( 'Self user remains in collaborators list when cursor preference is disabled', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Self Presence Test - Cursor Disabled',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		// Disable the own-cursor preference.
		await page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core', 'showCollaborationCursor', false );
		} );

		// Open the collaborators popover.
		const presenceButton = page.getByRole( 'button', {
			name: /Collaborators list/,
		} );
		await expect( presenceButton ).toBeVisible( { timeout: 10000 } );
		await presenceButton.click();

		// The "You" entry should still be visible — the preference only
		// controls the cursor overlay, not the collaborators list.
		await expect(
			page.locator( '.editor-collaborators-presence__list-item', {
				hasText: 'You',
			} )
		).toBeVisible();
	} );
} );
