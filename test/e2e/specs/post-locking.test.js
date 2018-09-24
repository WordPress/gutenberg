/**
 * Internal dependencies
 */
import {
	newPost,
	publishPost,
	newBrowserIncognitoPage,
	login,
	setTipsPreference,
} from '../support/utils';
import { newUser } from '../support/users';

describe( 'post locking', () => {
	beforeAll( async () => {
		await newPost();
		await newUser( 'test', 'password', 'test@local.dev', 'editor' );
	} );

	it( 'should show the post locking modal', async () => {
		// Create a post using the admin user.
		await newPost();
		await page.type( '.editor-post-title__input', 'E2E Test Post' );
		await publishPost();

		// Open the same page using a test user.
		const url = await page.url();
		const newPage = await newBrowserIncognitoPage();
		await newPage.goto( url );
		await login( 'test', 'password', newPage );

		// The locking modal should be shown
		await newPage.waitForXPath(
			'//*[contains(@class, "components-modal__header-heading")][contains(text(), "This post is already being edited.")]'
		);

		// Disable tips to avoid conflicting modals/popovers
		await setTipsPreference( false, newPage );

		// Take over edition of the post
		const takeOverButton = await newPage.waitForXPath( '//a[text()="Take Over"]' );
		await takeOverButton.click();

		// The take over modal should show up
		await page.waitForXPath(
			'//*[contains(@class, "components-modal__header-heading")][contains(text(), "Someone else has taken over this post.")]'
		);
	} );
} );
