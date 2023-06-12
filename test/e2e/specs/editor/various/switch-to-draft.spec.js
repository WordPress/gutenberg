/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/** @typedef {import('@playwright/test').Page} Page */
/** @typedef {import('@wordpress/e2e-test-utils-playwright').Admin} Admin */
/** @typedef {import('@wordpress/e2e-test-utils-playwright').RequestUtils} RequestUtils */

test.use( {
	switchToDraftUtils: async ( { page, admin, requestUtils }, use ) => {
		await use( new SwitchToDraftUtils( { page, admin, requestUtils } ) );
	},
} );

test.beforeAll( async ( { requestUtils } ) => {
	await Promise.all( [
		requestUtils.deleteAllPosts(),
		requestUtils.deleteAllPages(),
	] );
} );

test.afterAll( async ( { requestUtils } ) => {
	await Promise.all( [
		requestUtils.deleteAllPosts(),
		requestUtils.deleteAllPages(),
	] );
} );

test.describe( 'Clicking "Switch to draft" on a published/scheduled post/page', () => {
	[ 'schedule', 'publish' ].forEach( ( postStatus ) => {
		[ 'large', 'small' ].forEach( ( viewport ) => {
			[ 'post', 'page' ].forEach( ( postType ) => {
				test( `should switch a ${ postStatus }-ed ${ postType } to draft in a ${ viewport } viewport`, async ( {
					page,
					switchToDraftUtils,
					pageUtils,
					editor,
				} ) => {
					await pageUtils.setBrowserViewport( viewport );

					await switchToDraftUtils.createTestPost(
						postType,
						viewport,
						postStatus === 'schedule'
					);

					await editor.openDocumentSettingsSidebar();

					await switchToDraftUtils.switchToDraftButton.click();

					await page
						.getByRole( 'dialog' )
						.getByRole( 'button', { name: 'Cancel' } )
						.click();

					await expect
						.poll(
							switchToDraftUtils.getPostStatus,
							`should leave a ${ postStatus }-ed ${ postType } ${ postStatus }-ed if canceled`
						)
						.toBe(
							postStatus === 'schedule' ? 'future' : postStatus
						);

					await switchToDraftUtils.switchToDraftButton.click();

					await page
						.getByRole( 'dialog' )
						.getByRole( 'button', { name: 'OK' } )
						.click();

					await expect(
						page.getByRole( 'button', {
							name: 'Dismiss this notice',
						} )
					).toHaveText( `${ postType } reverted to draft.`, {
						ignoreCase: true,
					} );

					await expect
						.poll(
							switchToDraftUtils.getPostStatus,
							`should revert a ${ postStatus }-ed ${ postType } to a draft if confirmed`
						)
						.toBe( 'draft' );
				} );
			} );
		} );
	} );
} );

class SwitchToDraftUtils {
	/** @type {Page} */
	#page;
	/** @type {Admin} */
	#admin;
	/** @type {RequestUtils} */
	#requestUtils;

	constructor( { page, admin, requestUtils } ) {
		this.#page = page;
		this.#admin = admin;
		this.#requestUtils = requestUtils;

		this.switchToDraftButton = page.locator(
			'role=button[name="Switch to draft"i]'
		);
	}

	/**
	 * Create a test post.
	 *
	 * @param {'post' | 'page'}   postType    The post type.
	 * @param {'large' | 'small'} viewport    The viewport.
	 * @param {boolean}           isScheduled Whether the post is scheduled.
	 */
	createTestPost = async ( postType, viewport, isScheduled = false ) => {
		const payload = {
			title: `Switch scheduled ${ postType } to draft`,
			status: 'publish',
			content: `<!-- wp:paragraph -->
<p>This will be a scheduled ${ postType } edited in a ${ viewport } viewport</p>
<!-- /wp:paragraph -->`,
		};

		if ( isScheduled ) {
			const scheduledDate = new Date();
			scheduledDate.setMonth( scheduledDate.getMonth() + 1 );
			payload.date_gmt = scheduledDate.toISOString();
		}

		let id;
		if ( postType === 'post' ) {
			const post = await this.#requestUtils.createPost( payload );
			id = post.id;
		} else {
			const page = await this.#requestUtils.createPage( payload );
			id = page.id;
		}

		await this.#admin.visitAdminPage(
			'post.php',
			`post=${ id }&action=edit`
		);

		// Disable welcome guide and full screen mode.
		await this.#page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-post', 'welcomeGuide', false );
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-post', 'fullscreenMode', false );
		} );
	};

	getPostStatus = async () => {
		return await this.#page.evaluate( () =>
			window.wp.data
				.select( 'core/editor' )
				.getEditedPostAttribute( 'status' )
		);
	};
}
