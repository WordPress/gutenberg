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

export interface UserCredentials {
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	password: string;
	roles: string[];
}

interface UserSession {
	user: UserCredentials;
	context: BrowserContext;
	page: Page;
	editor: Editor;
}

export const SECOND_USER: UserCredentials = {
	username: 'collaborator',
	email: 'collaborator@example.com',
	firstName: 'Test',
	lastName: 'Collaborator',
	password: 'password',
	roles: [ 'editor' ],
};

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';

export default class CollaborationUtils {
	private admin: Admin;
	private editor: Editor;
	private requestUtils: RequestUtils;
	private primaryPage: Page;
	private sessions: UserSession[] = [];

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
	 * Navigate the primary user (admin) to a post and wait for
	 * collaboration to be ready.
	 *
	 * @param postId The post ID to open.
	 */
	async openPost( postId: number ) {
		await this.admin.visitAdminPage(
			'post.php',
			`post=${ postId }&action=edit`
		);
		await this.editor.setPreferences( 'core/edit-post', {
			welcomeGuide: false,
			fullscreenMode: false,
		} );
		await this.waitForCollaborationReady( this.primaryPage );
	}

	/**
	 * Log in an additional user and open the same post in a new
	 * browser context. Returns the new user's page and editor.
	 *
	 * Can be called multiple times to add N users to a session.
	 *
	 * @param postId The post ID to open.
	 * @param user   Credentials for the user to join.
	 * @return The joined user's page and editor.
	 */
	async joinUser(
		postId: number,
		user: UserCredentials
	): Promise< { page: Page; editor: Editor } > {
		const context = await this.admin.browser.newContext( {
			baseURL: BASE_URL,
		} );
		const newPage = await context.newPage();

		// Log in via the WordPress login form.
		await newPage.goto( '/wp-login.php' );
		await newPage.locator( '#user_login' ).fill( user.username );
		await newPage.locator( '#user_pass' ).fill( user.password );
		await newPage.getByRole( 'button', { name: 'Log In' } ).click();
		await newPage.waitForURL( '**/wp-admin/**' );

		// Navigate to the post editor.
		await newPage.goto( `/wp-admin/post.php?post=${ postId }&action=edit` );

		// Dismiss welcome guide.
		await newPage.waitForFunction(
			() => window?.wp?.data && window?.wp?.blocks
		);
		await newPage.evaluate( () => {
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-post', 'welcomeGuide', false );
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-post', 'fullscreenMode', false );
		} );

		const newEditor = new Editor( { page: newPage } );

		await this.waitForCollaborationReady( newPage );

		this.sessions.push( {
			user,
			context,
			page: newPage,
			editor: newEditor,
		} );

		return { page: newPage, editor: newEditor };
	}

	/**
	 * Wait for all current participants (primary + joined users) to
	 * discover each other via the awareness protocol, then wait for
	 * sync cycles to complete.
	 *
	 * @param [options]         Optional settings.
	 * @param [options.timeout] Maximum wait time in ms. Defaults to a
	 *                          value that scales with the number of users.
	 */
	async waitForMutualDiscovery( { timeout }: { timeout?: number } = {} ) {
		const pages = this.allPages;
		const resolvedTimeout = timeout ?? 10000 + pages.length * 2500;

		await Promise.all(
			pages.map( ( pg ) =>
				pg
					.getByRole( 'button', { name: /Collaborators list/ } )
					.waitFor( { timeout: resolvedTimeout } )
			)
		);

		await Promise.all( pages.map( ( pg ) => this.waitForSyncCycle( pg ) ) );
	}

	/**
	 * Convenience method: open a two-user collaborative session.
	 *
	 * Equivalent to calling `openPost`, `joinUser` with SECOND_USER,
	 * and `waitForMutualDiscovery` in sequence.
	 *
	 * @param postId The post ID to collaboratively edit.
	 */
	async openCollaborativeSession( postId: number ) {
		await this.openPost( postId );
		await this.joinUser( postId, SECOND_USER );
		await this.waitForMutualDiscovery();
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
	 * @param page              The Playwright page to wait on.
	 * @param [options]         Optional settings.
	 * @param [options.timeout] Maximum wait time in ms (default 15000).
	 */
	async waitForCollaborationReady(
		page: Page,
		{ timeout = 15000 }: { timeout?: number } = {}
	) {
		await page.waitForFunction(
			() =>
				( window as any )._wpCollaborationEnabled === true &&
				window?.wp?.data &&
				window?.wp?.blocks,
			{ timeout }
		);
	}

	/**
	 * Wait for sync polling cycles to complete on the given page.
	 *
	 * Note: The sync endpoint URL is URL-encoded in wp-env
	 * (rest_route=%2Fwp-sync%2Fv1%2Fupdates), so we match the
	 * encoded form.
	 *
	 * @param page              The Playwright page to wait on.
	 * @param cycles            Number of sync responses to wait for (default 3).
	 * @param [options]         Optional settings.
	 * @param [options.timeout] Maximum wait time per cycle in ms (default 10000).
	 */
	async waitForSyncCycle(
		page: Page,
		cycles = 3,
		{ timeout = 10000 }: { timeout?: number } = {}
	) {
		for ( let i = 0; i < cycles; i++ ) {
			await page.waitForResponse(
				( response ) =>
					response.url().includes( 'wp-sync' ) &&
					response.status() === 200,
				{ timeout }
			);
		}
	}

	/**
	 * All pages in the session: primary user followed by joined users
	 * in the order they joined.
	 */
	get allPages(): Page[] {
		return [ this.primaryPage, ...this.sessions.map( ( s ) => s.page ) ];
	}

	/**
	 * All editors in the session: primary user followed by joined users
	 * in the order they joined.
	 */
	get allEditors(): Editor[] {
		return [ this.editor, ...this.sessions.map( ( s ) => s.editor ) ];
	}

	/**
	 * Get a joined user's page by index (0-based, in join order).
	 *
	 * @param index Index of the joined user.
	 */
	getPage( index: number ): Page {
		if ( index < 0 || index >= this.sessions.length ) {
			throw new Error(
				`No session at index ${ index }. ${ this.sessions.length } user(s) have joined.`
			);
		}
		return this.sessions[ index ].page;
	}

	/**
	 * Get a joined user's editor by index (0-based, in join order).
	 *
	 * @param index Index of the joined user.
	 */
	getEditor( index: number ): Editor {
		if ( index < 0 || index >= this.sessions.length ) {
			throw new Error(
				`No session at index ${ index }. ${ this.sessions.length } user(s) have joined.`
			);
		}
		return this.sessions[ index ].editor;
	}

	/**
	 * Get the second user's Page instance.
	 * Backward-compatible accessor for two-user tests.
	 */
	get page2(): Page {
		if ( this.sessions.length === 0 ) {
			throw new Error(
				'Second page not available. Call openCollaborativeSession() or joinUser() first.'
			);
		}
		return this.sessions[ 0 ].page;
	}

	/**
	 * Get the second user's Editor instance.
	 * Backward-compatible accessor for two-user tests.
	 */
	get editor2(): Editor {
		if ( this.sessions.length === 0 ) {
			throw new Error(
				'Second editor not available. Call openCollaborativeSession() or joinUser() first.'
			);
		}
		return this.sessions[ 0 ].editor;
	}

	/**
	 * Clean up: close all secondary browser contexts and delete test users.
	 */
	async teardown() {
		for ( const session of this.sessions ) {
			await session.context.close();
		}
		this.sessions = [];
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

	const optionName = 'wp_collaboration_enabled';
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

	// Temporary addition to bridge the short time when this is change is merged in
	// Gutenberg but not in core.
	formData.wp_enable_real_time_collaboration = optionValue;

	await requestUtils.request.post( '/wp-admin/options.php', {
		form: formData,
		failOnStatusCode: true,
	} );
}
