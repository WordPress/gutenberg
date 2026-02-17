/**
 * External dependencies
 */
import type { Page, BrowserContext } from '@playwright/test';

/**
 * WordPress dependencies
 */
import {
	Editor,
	type Admin,
	type RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';

export const SECOND_USER = {
	username: 'collaborator',
	email: 'collaborator@example.com',
	firstName: 'Test',
	lastName: 'Collaborator',
	password: 'password',
	roles: [ 'editor' ] as string[],
};

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';

export default class CollaborationUtils {
	private admin: Admin;
	private editor: Editor;
	private requestUtils: RequestUtils;
	private primaryPage: Page;

	private secondContext: BrowserContext | null = null;
	private secondPage: Page | null = null;
	private secondEditor: Editor | null = null;

	constructor( {
		admin,
		editor,
		requestUtils,
		page,
	}: {
		admin: Admin;
		editor: Editor;
		requestUtils: RequestUtils;
		page: Page;
	} ) {
		this.admin = admin;
		this.editor = editor;
		this.requestUtils = requestUtils;
		this.primaryPage = page;
	}

	/**
	 * Set the real-time collaboration WordPress setting.
	 *
	 * Uses the form-based approach (similar to setGutenbergExperiments)
	 * because this setting is registered on admin_init in the "writing"
	 * group and is not exposed via /wp/v2/settings.
	 *
	 * @param enabled Whether to enable or disable collaboration.
	 */
	async setCollaboration( enabled: boolean ) {
		const response = await this.requestUtils.request.get(
			'/wp-admin/options-writing.php'
		);
		const html = await response.text();
		const nonce = html.match( /name="_wpnonce" value="([^"]+)"/ )![ 1 ];

		const formData: Record< string, string | number > = {
			option_page: 'writing',
			action: 'update',
			_wpnonce: nonce,
			_wp_http_referer: '/wp-admin/options-writing.php',
			submit: 'Save Changes',
			default_category: 1,
			default_post_format: 0,
		};

		if ( enabled ) {
			formData.enable_real_time_collaboration = 1;
		}

		await this.requestUtils.request.post( '/wp-admin/options.php', {
			form: formData,
			failOnStatusCode: true,
		} );
	}

	/**
	 * Open a collaborative editing session where both the primary user (admin)
	 * and the second user (collaborator) are editing the same post.
	 *
	 * @param postId The post ID to collaboratively edit.
	 */
	async openCollaborativeSession( postId: number ) {
		// Create a second browser context with the same baseURL.
		this.secondContext = await this.admin.browser.newContext( {
			baseURL: BASE_URL,
		} );
		this.secondPage = await this.secondContext.newPage();

		// Login the second user via the WordPress login form.
		await this.secondPage.goto( '/wp-login.php' );
		await this.secondPage
			.locator( '#user_login' )
			.fill( SECOND_USER.username );
		await this.secondPage
			.locator( '#user_pass' )
			.fill( SECOND_USER.password );
		await this.secondPage.getByRole( 'button', { name: 'Log In' } ).click();
		await this.secondPage.waitForURL( '**/wp-admin/**' );

		// Navigate User 1 (admin) to the post editor.
		await this.admin.visitAdminPage(
			'post.php',
			`post=${ postId }&action=edit`
		);
		await this.editor.setPreferences( 'core/edit-post', {
			welcomeGuide: false,
			fullscreenMode: false,
		} );

		// Wait for collaboration to be enabled on User 1's page.
		await this.waitForCollaborationReady( this.primaryPage );

		// Navigate User 2 to the same post editor.
		await this.secondPage.goto(
			`/wp-admin/post.php?post=${ postId }&action=edit`
		);

		// Dismiss welcome guide for User 2.
		await this.secondPage.waitForFunction(
			() => window?.wp?.data && window?.wp?.blocks
		);
		await this.secondPage.evaluate( () => {
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-post', 'welcomeGuide', false );
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-post', 'fullscreenMode', false );
		} );

		// Create an Editor instance for the second page.
		this.secondEditor = new Editor( { page: this.secondPage } );

		// Wait for collaboration to be enabled on User 2's page.
		await this.waitForCollaborationReady( this.secondPage );

		// Wait for both users to discover each other via awareness.
		// The collaborator count button appears when another user is
		// detected through the sync polling.
		await Promise.all( [
			this.primaryPage
				.getByRole( 'button', { name: /Collaborators list/ } )
				.waitFor( { timeout: 15000 } ),
			this.secondPage
				.getByRole( 'button', { name: /Collaborators list/ } )
				.waitFor( { timeout: 15000 } ),
		] );

		// Allow a full round of polling after awareness is established
		// so both CRDT docs are synchronized.
		await Promise.all( [
			this.waitForSyncCycle( this.primaryPage ),
			this.waitForSyncCycle( this.secondPage ),
		] );
	}

	/**
	 * Wait for the collaboration runtime to be ready on a page.
	 * Checks that `window._wpCollaborationEnabled` is true and wp.data is loaded.
	 *
	 * @param page The Playwright page to wait on.
	 */
	private async waitForCollaborationReady( page: Page ) {
		await page.waitForFunction(
			() =>
				( window as any )._wpCollaborationEnabled === true &&
				window?.wp?.data &&
				window?.wp?.blocks,
			{ timeout: 15000 }
		);
	}

	/**
	 * Wait for sync polling cycles to complete on the given page.
	 *
	 * Note: The sync endpoint URL is URL-encoded in wp-env
	 * (rest_route=%2Fwp-sync%2Fv1%2Fupdates), so we match the
	 * encoded form.
	 *
	 * @param page   The Playwright page to wait on.
	 * @param cycles Number of sync responses to wait for (default 3).
	 */
	private async waitForSyncCycle( page: Page, cycles = 3 ) {
		for ( let i = 0; i < cycles; i++ ) {
			await page.waitForResponse(
				( response ) =>
					response.url().includes( 'wp-sync' ) &&
					response.status() === 200,
				{ timeout: 10000 }
			);
		}
	}

	/**
	 * Get the second user's Page instance.
	 */
	get page2(): Page {
		if ( ! this.secondPage ) {
			throw new Error(
				'Second page not available. Call openCollaborativeSession() first.'
			);
		}
		return this.secondPage;
	}

	/**
	 * Get the second user's Editor instance.
	 */
	get editor2(): Editor {
		if ( ! this.secondEditor ) {
			throw new Error(
				'Second editor not available. Call openCollaborativeSession() first.'
			);
		}
		return this.secondEditor;
	}

	/**
	 * Clean up: close second browser context, disable collaboration, delete test users.
	 */
	async teardown() {
		if ( this.secondContext ) {
			await this.secondContext.close();
			this.secondContext = null;
			this.secondPage = null;
			this.secondEditor = null;
		}
		await this.setCollaboration( false );
		await this.requestUtils.deleteAllUsers();
	}
}
