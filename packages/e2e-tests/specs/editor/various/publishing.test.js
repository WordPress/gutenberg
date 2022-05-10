/**
 * WordPress dependencies
 */
import {
	createNewPost,
	publishPost,
	publishPostWithPrePublishChecksDisabled,
	enablePrePublishChecks,
	disablePrePublishChecks,
	arePrePublishChecksEnabled,
	setBrowserViewport,
	openPublishPanel,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

describe( 'Publishing', () => {
	describe.each( [ 'post', 'page' ] )(
		'%s locking prevent saving',
		( postType ) => {
			beforeEach( async () => {
				await createNewPost( postType );
			} );

			it( `disables the publish button when a ${ postType } is locked`, async () => {
				await page.type(
					'.editor-post-title__input',
					'E2E Test Post lock check publish button'
				);
				await page.evaluate( () =>
					wp.data
						.dispatch( 'core/editor' )
						.lockPostSaving( 'futurelock' )
				);

				await openPublishPanel();

				expect(
					await page.$(
						'.editor-post-publish-button[aria-disabled="true"]'
					)
				).not.toBeNull();
			} );

			it( `disables the save shortcut when a ${ postType } is locked`, async () => {
				await page.type(
					'.editor-post-title__input',
					'E2E Test Post check save shortcut'
				);
				await page.evaluate( () =>
					wp.data
						.dispatch( 'core/editor' )
						.lockPostSaving( 'futurelock' )
				);
				await pressKeyWithModifier( 'primary', 'S' );

				expect( await page.$( '.editor-post-saved-state' ) ).toBeNull();
				expect(
					await page.$( '.editor-post-save-draft' )
				).not.toBeNull();
			} );
		}
	);

	describe.each( [ 'post', 'page' ] )( 'a %s', ( postType ) => {
		let werePrePublishChecksEnabled;

		beforeEach( async () => {
			await createNewPost( postType );
			werePrePublishChecksEnabled = await arePrePublishChecksEnabled();
			if ( ! werePrePublishChecksEnabled ) {
				await enablePrePublishChecks();
			}
		} );

		afterEach( async () => {
			if ( ! werePrePublishChecksEnabled ) {
				await disablePrePublishChecks();
			}
		} );

		it( `should publish the ${ postType } and close the panel once we start editing again.`, async () => {
			await page.type( '.editor-post-title__input', 'E2E Test Post' );

			await publishPost();

			// The post-publishing panel is visible.
			expect(
				await page.$( '.editor-post-publish-panel' )
			).not.toBeNull();

			// Start editing again.
			await page.type( '.editor-post-title__input', ' (Updated)' );

			// The post-publishing panel is not visible anymore.
			expect( await page.$( '.editor-post-publish-panel' ) ).toBeNull();
		} );
	} );

	describe.each( [ 'post', 'page' ] )(
		'a %s with pre-publish checks disabled',
		( postType ) => {
			let werePrePublishChecksEnabled;

			beforeEach( async () => {
				await createNewPost( postType );
				werePrePublishChecksEnabled = await arePrePublishChecksEnabled();
				if ( werePrePublishChecksEnabled ) {
					await disablePrePublishChecks();
				}
			} );

			afterEach( async () => {
				if ( werePrePublishChecksEnabled ) {
					await enablePrePublishChecks();
				}
			} );

			it( `should publish the ${ postType } without opening the post-publish sidebar.`, async () => {
				await page.type( '.editor-post-title__input', 'E2E Test Post' );

				// The "Publish" button should be shown instead of the "Publish..." toggle.
				expect(
					await page.$( '.editor-post-publish-panel__toggle' )
				).toBeNull();
				expect(
					await page.$( '.editor-post-publish-button' )
				).not.toBeNull();

				await publishPostWithPrePublishChecksDisabled();

				// The post-publishing panel should have been not shown.
				expect(
					await page.$( '.editor-post-publish-panel' )
				).toBeNull();
			} );
		}
	);

	describe.each( [ 'post', 'page' ] )(
		'a %s in small viewports',
		( postType ) => {
			let werePrePublishChecksEnabled;

			beforeEach( async () => {
				await createNewPost( postType );
				werePrePublishChecksEnabled = await arePrePublishChecksEnabled();
				if ( werePrePublishChecksEnabled ) {
					await disablePrePublishChecks();
				}
				await setBrowserViewport( 'small' );
			} );

			afterEach( async () => {
				await setBrowserViewport( 'large' );
				if ( werePrePublishChecksEnabled ) {
					await enablePrePublishChecks();
				}
			} );

			it( `should ignore the pre-publish checks and show the Publish... toggle instead of the Publish button`, async () => {
				expect(
					await page.$( '.editor-post-publish-panel__toggle' )
				).not.toBeNull();
				expect(
					await page.$( '.editor-post-publish-button' )
				).toBeNull();
			} );
		}
	);
} );
