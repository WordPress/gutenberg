/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { SECOND_USER } from './fixtures/collaboration-utils';
import type { UserCredentials } from './fixtures/collaboration-utils';

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';

// Additional users to fill the room up to the default connection limit (3).
const FILLER_USERS: UserCredentials[] = [
	{
		username: 'filler_editor_1',
		email: 'filler1@example.com',
		firstName: 'Filler',
		lastName: 'One',
		password: 'password',
		roles: [ 'editor' ],
	},
	{
		username: 'filler_editor_2',
		email: 'filler2@example.com',
		firstName: 'Filler',
		lastName: 'Two',
		password: 'password',
		roles: [ 'editor' ],
	},
];

test.describe( 'Sync connection error filter', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-sync-connection-error-filter'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-sync-connection-error-filter'
		);
	} );

	test( 'plugin can replace the default modal for connection-limit-exceeded', async ( {
		collaborationUtils,
		requestUtils,
		admin,
	} ) => {
		// Create filler users inside the test, after the fixture's
		// deleteAllUsers() has run.
		for ( const user of FILLER_USERS ) {
			await requestUtils.createUser( user );
		}

		const post = await requestUtils.createPost( {
			title: 'Sync Error Filter Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		// Admin opens the post (1st client).
		await collaborationUtils.openPost( post.id );

		// Two filler users join to reach the default limit of 3.
		await collaborationUtils.joinUser( post.id, FILLER_USERS[ 0 ] );
		await collaborationUtils.joinUser( post.id, FILLER_USERS[ 1 ] );
		await collaborationUtils.waitForMutualDiscovery();

		// The second user (4th client) opens the post, exceeding the
		// default connection limit. This triggers CONNECTION_LIMIT_EXCEEDED
		// on their first poll response.
		const fourthContext = await admin.browser.newContext( {
			baseURL: BASE_URL,
		} );
		const page4 = await fourthContext.newPage();

		try {
			await page4.goto( '/wp-login.php' );
			await page4.locator( '#user_login' ).fill( SECOND_USER.username );
			await page4.locator( '#user_pass' ).fill( SECOND_USER.password );
			await page4.getByRole( 'button', { name: 'Log In' } ).click();
			await page4.waitForURL( '**/wp-admin/**' );

			await page4.goto(
				`/wp-admin/post.php?post=${ post.id }&action=edit`
			);

			// The plugin's filter returns true for connection-limit-exceeded,
			// suppressing the default modal. The plugin renders its own modal.
			const customModal = page4.getByRole( 'dialog', {
				name: 'Collaboration limit reached',
			} );
			await expect( customModal ).toBeVisible( { timeout: 30000 } );

			// Verify the custom message.
			await expect(
				customModal.getByText(
					'Consider upgrading your hosting plan to increase the collaboration limits.'
				)
			).toBeVisible();

			// Verify the custom "Upgrade Plan" button.
			await expect(
				customModal.getByRole( 'link', { name: 'Upgrade Plan' } )
			).toBeVisible();

			// The default modal should NOT be visible.
			const defaultModal = page4.getByRole( 'dialog', {
				name: 'Too many editors connected',
			} );
			await expect( defaultModal ).toBeHidden();
		} finally {
			await fourthContext.close();
		}
	} );
} );
