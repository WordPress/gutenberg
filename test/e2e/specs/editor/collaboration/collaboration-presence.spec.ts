import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';
const HIDE_USER_ROUTES_PLUGIN = 'gutenberg-test-plugin-hide-user-rest-routes';
const HIDE_USER_ROUTES_COOKIE = 'gutenberg_test_hide_user_rest_routes';

async function hideCurrentUserRoutes( page: Page ) {
	await page.context().addCookies( [
		{
			name: HIDE_USER_ROUTES_COOKIE,
			value: '1',
			url: BASE_URL,
		},
	] );
}

test.describe( 'Collaboration - Presence', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( HIDE_USER_ROUTES_PLUGIN );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( HIDE_USER_ROUTES_PLUGIN );
	} );

	test( 'Collaborator avatars appear when two users are editing', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Presence Test - Avatars',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		// The collaborator presence button renders when other
		// collaborators are present.
		await expect(
			page.getByRole( 'button', { name: /Collaborators list/ } )
		).toBeVisible( { timeout: 10000 } );
	} );

	test( 'Collaborator name shows in the popover list', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Presence Test - Name',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		// Wait for the presence button to appear and click to open popover.
		const presenceButton = page.getByRole( 'button', {
			name: /Collaborators list/,
		} );
		await expect( presenceButton ).toBeVisible( { timeout: 10000 } );
		await presenceButton.click();

		// The popover should list the second collaborator by name.
		await expect(
			page.locator( '.editor-collaborators-presence__list-item-name', {
				hasText: 'Test Collaborator',
			} )
		).toBeVisible();
	} );

	test( 'A collaborator whose user profile request fails appears with a fallback name and initials avatar', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		await hideCurrentUserRoutes( page );
		const post = await requestUtils.createPost( {
			title: 'Presence Test - Fallback identity',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2 } = collaborationUtils;
		const presenceButton = page2.getByRole( 'button', {
			name: /Collaborators list/,
		} );
		await expect( presenceButton ).toBeVisible( { timeout: 10000 } );
		await presenceButton.click();

		const fallbackName = page2.locator(
			'.editor-collaborators-presence__list-item-name',
			{ hasText: 'Anonymous User' }
		);
		const fallbackItem = page2
			.locator( '.editor-collaborators-presence__list-item' )
			.filter( { has: fallbackName } );
		await expect( fallbackItem ).toBeVisible();

		const fallbackAvatar = fallbackItem.getByRole( 'img', {
			name: 'Anonymous User',
		} );
		await expect( fallbackAvatar ).toBeVisible();
		await expect( fallbackAvatar.locator( 'img' ) ).toHaveCount( 0 );
		await expect(
			fallbackAvatar.locator( '.editor-avatar__image' )
		).toHaveText( 'AU' );
	} );

	test( 'A collaborator whose user profile request fails can still exchange edits with a named collaborator', async ( {
		collaborationUtils,
		requestUtils,
		page,
		editor,
	} ) => {
		await hideCurrentUserRoutes( page );
		const post = await requestUtils.createPost( {
			title: 'Presence Test - Fallback collaboration',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2, page2 } = collaborationUtils;
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Edit from fallback collaborator' },
		} );
		await expect
			.poll( () => editor2.getBlocks(), { timeout: 5000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Edit from fallback collaborator',
					},
				},
			] );

		await page2.evaluate( () => {
			const block = window.wp.blocks.createBlock( 'core/paragraph', {
				content: 'Edit from named collaborator',
			} );
			window.wp.data.dispatch( 'core/block-editor' ).insertBlock( block );
		} );
		await expect
			.poll( () => editor.getBlocks(), { timeout: 5000 } )
			.toMatchObject( [
				{
					attributes: {
						content: 'Edit from fallback collaborator',
					},
				},
				{
					attributes: { content: 'Edit from named collaborator' },
				},
			] );
	} );
} );
