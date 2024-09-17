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
					await page
						.getByRole( 'button', { name: 'Change status:' } )
						.click();
					await page.getByRole( 'radio', { name: 'Draft' } ).click();

					if ( viewport === 'small' ) {
						await page
							.getByRole( 'region', { name: 'Editor settings' } )
							.getByRole( 'button', { name: 'Close Settings' } )
							.click();
					}
					await page
						.getByRole( 'region', { name: 'Editor top bar' } )
						.getByRole( 'button', { name: 'Save', exact: true } )
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

		await this.#admin.editPost( id );
	};

	getPostStatus = async () => {
		return this.#page.evaluate( () =>
			window.wp.data
				.select( 'core/editor' )
				.getEditedPostAttribute( 'status' )
		);
	};
}
