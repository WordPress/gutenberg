/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { SECOND_USER } from './fixtures/collaboration-utils';

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';

test.describe( 'Collaboration with meta boxes', () => {
	test.describe( 'incompatible meta boxes', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-plugin-meta-box'
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-plugin-meta-box'
			);
		} );

		test( 'shows post-locked modal when meta boxes disable collaboration', async ( {
			collaborationUtils,
			requestUtils,
			admin,
			page,
		} ) => {
			// Create a draft post.
			const post = await requestUtils.createPost( {
				title: 'Meta Box Lock Test',
				status: 'draft',
				date_gmt: new Date().toISOString(),
			} );

			// User 1 (admin) opens the post.
			await admin.editPost( post.id );

			// Wait for collaboration runtime and entity record to be ready.
			await collaborationUtils.waitForEntityReady( page );

			// Wait for meta boxes to initialize and disable collaboration.
			// collaborationSupported starts as true, then the meta box hook
			// sets it to false once meta boxes are detected.
			await page.waitForFunction(
				( consent ) => {
					const privateApis = ( window as any ).wp.privateApis;
					const { unlock } =
						privateApis.__dangerousOptInToUnstableAPIsOnlyForCoreModules(
							consent,
							'@wordpress/core-data'
						);
					return (
						unlock(
							window.wp.data.select( 'core/editor' )
						).isCollaborationEnabledForCurrentPost() === false
					);
				},
				'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
				{ timeout: 15000 }
			);

			// Set up second browser context for User 2.
			const secondContext = await admin.browser.newContext( {
				baseURL: BASE_URL,
			} );
			const page2 = await secondContext.newPage();

			try {
				// Log in the second user.
				await page2.goto( '/wp-login.php' );
				await page2
					.locator( '#user_login' )
					.fill( SECOND_USER.username );
				await page2
					.locator( '#user_pass' )
					.fill( SECOND_USER.password );
				await page2.getByRole( 'button', { name: 'Log In' } ).click();
				await page2.waitForURL( '**/wp-admin/**' );

				// User 2 navigates to the same post.
				await page2.goto(
					`/wp-admin/post.php?post=${ post.id }&action=edit`
				);

				// Wait for wp.data to be available on User 2's page.
				await page2.waitForFunction(
					() => window?.wp?.data && window?.wp?.blocks,
					undefined,
					{ timeout: 15000 }
				);

				// Assert the post-locked modal appears.
				// Because collaboration is disabled (meta boxes), WordPress
				// falls back to standard post-locking. User 2 sees the
				// "This post is already being edited" modal.
				const modal = page2.getByRole( 'dialog', {
					name: 'This post is already being edited',
				} );
				await expect( modal ).toBeVisible( { timeout: 15000 } );

				// Assert the explanation about meta box incompatibility.
				await expect(
					modal.getByText(
						'Because this post uses plugins that aren\u2019t compatible with real-time collaboration, only one person can edit at a time.'
					)
				).toBeVisible();

				// Assert the "Take over" option is available.
				await expect(
					modal.getByRole( 'link', { name: 'Take over' } )
				).toBeVisible();
			} finally {
				await secondContext.close();
			}
		} );
	} );

	test.describe( 'RTC-compatible meta boxes', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-plugin-rtc-compatible-meta-box'
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-plugin-rtc-compatible-meta-box'
			);
		} );

		test( 'does not disable collaboration when all meta boxes are RTC-compatible', async ( {
			collaborationUtils,
			requestUtils,
			admin,
			page,
		} ) => {
			// Create a draft post.
			const post = await requestUtils.createPost( {
				title: 'RTC Compatible Meta Box Test',
				status: 'draft',
				date_gmt: new Date().toISOString(),
			} );

			// User 1 (admin) opens the post.
			await admin.editPost( post.id );

			// Wait for collaboration runtime and entity record to be ready.
			await collaborationUtils.waitForEntityReady( page );

			// Verify collaboration remains enabled. The RTC-compatible meta
			// box should not trigger the incompatibility lock-out.
			await page.waitForFunction(
				( consent ) => {
					const privateApis = ( window as any ).wp.privateApis;
					const { unlock } =
						privateApis.__dangerousOptInToUnstableAPIsOnlyForCoreModules(
							consent,
							'@wordpress/core-data'
						);
					return (
						unlock(
							window.wp.data.select( 'core/editor' )
						).isCollaborationEnabledForCurrentPost() === true
					);
				},
				'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
				{ timeout: 15000 }
			);

			// Verify a second user can join without seeing the lock modal.
			const { page: page2 } = await collaborationUtils.joinUser(
				post.id,
				SECOND_USER
			);

			// The post-locked modal should not appear.
			const modal = page2.getByRole( 'dialog', {
				name: 'This post is already being edited',
			} );
			await expect( modal ).toBeHidden();
		} );
	} );
} );
