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
	 * Wait for the editor to be fully ready: collaboration runtime enabled and
	 * the entity record resolver finished. Optionally skips the collaboration
	 * check (e.g. for the auto-draft test which checks collaboration separately).
	 *
	 * @param page                           The Playwright page to wait on.
	 * @param [options]                      Optional settings.
	 * @param [options.requireCollaboration] Whether to require _wpCollaborationEnabled (default true).
	 * @param [options.timeout]              Maximum wait time in ms (default 10000).
	 */
	async waitForEntityReady(
		page: Page,
		{
			requireCollaboration = true,
			timeout = 10000,
		}: { requireCollaboration?: boolean; timeout?: number } = {}
	) {
		await page.waitForFunction(
			( { requireCollab } ) => {
				const postId = ( window as any ).wp?.data
					?.select( 'core/editor' )
					?.getCurrentPostId();
				if ( ! postId ) {
					return false;
				}
				if (
					requireCollab &&
					( window as any )._wpCollaborationEnabled !== true
				) {
					return false;
				}
				return ( window as any ).wp.data
					.select( 'core' )
					.hasFinishedResolution( 'getEntityRecord', [
						'postType',
						'post',
						postId,
					] );
			},
			{ requireCollab: requireCollaboration },
			{ timeout }
		);
	}

	/**
	 * Wait for entity resolution AND for any triggered reconciliation save to
	 * settle. Use this after a page reload when a reconciliation save may be
	 * initiated synchronously upon entity resolution.
	 *
	 * @param page              The Playwright page to wait on.
	 * @param [options]         Optional settings.
	 * @param [options.timeout] Maximum wait time in ms (default 15000).
	 */
	async waitForEntityReadyAndSaveSettled(
		page: Page,
		{ timeout = 15000 }: { timeout?: number } = {}
	) {
		await page.waitForFunction(
			() => {
				const postId = ( window as any ).wp?.data
					?.select( 'core/editor' )
					?.getCurrentPostId();
				if ( ! postId ) {
					return false;
				}
				if ( ( window as any )._wpCollaborationEnabled !== true ) {
					return false;
				}
				if (
					! ( window as any ).wp.data
						.select( 'core' )
						.hasFinishedResolution( 'getEntityRecord', [
							'postType',
							'post',
							postId,
						] )
				) {
					return false;
				}
				// Entity is resolved; wait for any triggered reconciliation
				// save to settle before we read store values.
				return ! ( window as any ).wp.data
					.select( 'core/editor' )
					.isSavingPost();
			},
			{ timeout }
		);
	}

	/**
	 * Read the _crdt_document meta value from the currently loaded entity record.
	 *
	 * @param page The Playwright page to evaluate on.
	 */
	async getCrdtDocument( page: Page ): Promise< string | null > {
		return page.evaluate( () => {
			const postId = ( window as any ).wp.data
				.select( 'core/editor' )
				.getCurrentPostId();
			return (
				( window as any ).wp.data
					.select( 'core' )
					.getEntityRecord( 'postType', 'post', postId )?.meta
					?._crdt_document ?? null
			);
		} );
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
		await this.requestUtils.deleteAllUsers();
	}
}

/**
 * Set the real-time collaboration WordPress setting.
 *
 * Uses the form-based approach (similar to setGutenbergExperiments)
 * because this setting is registered on admin_init in the "writing"
 * group and is not exposed via /wp/v2/settings.
 *
 * @param requestUtils An instance of RequestUtils for making HTTP requests.
 * @param enabled      Whether to enable or disable collaboration.
 */
export async function setCollaboration(
	requestUtils: RequestUtils,
	enabled: boolean
): Promise< void > {
	const response = await requestUtils.request.get(
		'/wp-admin/options-writing.php'
	);
	const html = await response.text();
	const nonce = html.match( /name="_wpnonce" value="([^"]+)"/ )![ 1 ];

	const optionName = 'wp_enable_real_time_collaboration';
	const optionValue = enabled ? 1 : 0;

	const formData: Record< string, string | number > = {
		option_page: 'writing',
		action: 'update',
		_wpnonce: nonce,
		_wp_http_referer: '/wp-admin/options-writing.php',
		submit: 'Save Changes',
		default_category: 1,
		default_post_format: 0,
	};

	formData[ optionName ] = optionValue;

	await requestUtils.request.post( '/wp-admin/options.php', {
		form: formData,
		failOnStatusCode: true,
	} );
}
