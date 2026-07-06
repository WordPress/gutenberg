/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { SECOND_USER } from './fixtures/collaboration-utils';

const SECOND_USER_DISPLAY_NAME = `${ SECOND_USER.firstName } ${ SECOND_USER.lastName }`;

test.describe( 'Collaboration - Notification preferences', () => {
	test( 'Collaboration notification toggles are visible in Preferences', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Notification Preferences Test - Toggles',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openPost( post.id );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Preferences' } ).click();
		await page.getByRole( 'tab', { name: 'General' } ).click();

		await expect(
			page.getByRole( 'checkbox', { name: 'Collaborator joined' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'checkbox', { name: 'Collaborator left' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'checkbox', { name: 'Post updated' } )
		).toBeVisible();
	} );

	test( 'Shows a snackbar notice when a collaborator joins the post', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Notification Preferences Test - Join Snackbar',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		// Opens the post as admin first, then joins the second user, so the
		// second user's `enteredAt` is after admin's - which is what makes
		// the admin editor show the join notice.
		await collaborationUtils.openCollaborativeSession( post.id );

		// Scope to the last snackbar so a stray/earlier snackbar can't
		// cause a Playwright strict-mode violation on this locator.
		await expect( page.getByTestId( 'snackbar' ).last() ).toContainText(
			`${ SECOND_USER_DISPLAY_NAME } has joined the post.`,
			{ timeout: 10000 }
		);
	} );
} );
