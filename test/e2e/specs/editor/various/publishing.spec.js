/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const POST_TYPES = [ 'post', 'page' ];

test.describe( 'Publishing', () => {
	POST_TYPES.forEach( ( postType ) => {
		test.describe( `${ postType } locking prevent saving`, () => {
			test.beforeEach( async ( { admin } ) => {
				await admin.createNewPost( { postType } );
			} );

			test( `disables the publish button when a ${ postType } is locked`, async ( {
				editor,
				page,
			} ) => {
				await editor.canvas
					.getByRole( 'textbox', { name: 'Add title' } )
					.fill( 'E2E Test Post' );

				await page.evaluate( () =>
					window.wp.data
						.dispatch( 'core/editor' )
						.lockPostSaving( 'futurelock' )
				);

				// Open publish panel.
				await page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'Publish' } )
					.click();

				// Publish button should be disabled.
				await expect(
					page
						.getByRole( 'region', { name: 'Editor publish' } )
						.getByRole( 'button', { name: 'Publish', exact: true } )
				).toBeDisabled();
			} );

			test( `disables the save shortcut when a ${ postType } is locked`, async ( {
				editor,
				page,
				pageUtils,
			} ) => {
				await editor.canvas
					.getByRole( 'textbox', { name: 'Add title' } )
					.fill( 'E2E Test Post' );

				await page.evaluate( () =>
					window.wp.data
						.dispatch( 'core/editor' )
						.lockPostSaving( 'futurelock' )
				);

				await pageUtils.pressKeys( 'primary+s' );

				await expect(
					page
						.getByRole( 'region', { name: 'Editor top bar' } )
						.getByRole( 'button', { name: 'Save draft' } )
				).toBeEnabled();
			} );
		} );
	} );

	POST_TYPES.forEach( ( postType ) => {
		test.describe( `a ${ postType } with pre-publish checks disabled`, () => {
			test.beforeEach( async ( { admin, editor } ) => {
				await admin.createNewPost( { postType } );
				await editor.setPreferences( 'core', {
					isPublishSidebarEnabled: false,
				} );
			} );

			test.afterEach( async ( { editor } ) => {
				await editor.setPreferences( 'core', {
					isPublishSidebarEnabled: true,
				} );
			} );

			test( `should publish the ${ postType } without opening the post-publish sidebar`, async ( {
				editor,
				page,
			} ) => {
				await editor.canvas
					.getByRole( 'textbox', { name: 'Add title' } )
					.fill( 'E2E Test Post' );

				// Publish the post.
				await page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'Publish' } )
					.click();

				const publishPanel = page.getByRole( 'region', {
					name: 'Editor publish',
				} );

				// The pre-publishing panel should have been not shown.
				await expect(
					publishPanel.getByRole( 'button', {
						name: 'Publish',
						exact: true,
					} )
				).toBeHidden();

				// The post-publishing panel should have been not shown.
				await expect(
					publishPanel.getByRole( 'button', {
						name: 'View Post',
					} )
				).toBeHidden();

				await expect(
					page
						.getByRole( 'button', { name: 'Dismiss this notice' } )
						.filter( { hasText: 'published' } )
				).toBeVisible();
			} );
		} );
	} );

	POST_TYPES.forEach( ( postType ) => {
		test.describe( `a ${ postType } in small viewports`, () => {
			test.beforeEach( async ( { admin, editor, pageUtils } ) => {
				await admin.createNewPost( { postType } );
				await editor.setPreferences( 'core', {
					isPublishSidebarEnabled: false,
				} );
				await pageUtils.setBrowserViewport( 'small' );
			} );

			test.afterEach( async ( { editor, pageUtils } ) => {
				await editor.setPreferences( 'core', {
					isPublishSidebarEnabled: true,
				} );
				await pageUtils.setBrowserViewport( 'large' );
			} );

			test( 'should ignore the pre-publish checks and show the publish panel', async ( {
				editor,
				page,
			} ) => {
				await editor.canvas
					.getByRole( 'textbox', { name: 'Add title' } )
					.fill( 'E2E Test Post' );

				await page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'Publish' } )
					.click();

				await expect(
					page
						.getByRole( 'region', { name: 'Editor publish' } )
						.getByRole( 'button', { name: 'Publish', exact: true } )
				).toBeVisible();
			} );
		} );
	} );
} );
