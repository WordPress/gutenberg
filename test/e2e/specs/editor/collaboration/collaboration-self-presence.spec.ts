/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - self presence', () => {
	test( 'Self user appears in popover with "You" label when preference is enabled', async ( {
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

		// Enable the preference.
		await page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core', 'showCollaborationCursor', true );
		} );

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

	test( 'Self user does not appear in popover when preference is disabled', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Self Presence Test - Disabled',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		// Ensure the preference is off.
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

		// The "You" label should NOT be present.
		await expect(
			page.locator( '.editor-collaborators-presence__list-item', {
				hasText: 'You',
			} )
		).toHaveCount( 0 );
	} );
} );
