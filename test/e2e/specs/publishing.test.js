/**
 * Internal dependencies
 */
import '../support/bootstrap';
import {
	newPost,
	newDesktopBrowserPage,
} from '../support/utils';

describe( 'Publishing', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
	} );

	beforeEach( async () => {
		await newPost();
	} );

	it( 'Should publish a post and close the panel once we start editing again', async () => {
		await page.type( '.editor-post-title__input', 'E2E Test Post' );

		// Opens the publish panel
		await page.click( '.editor-post-publish-panel__toggle' );

		// Disable reason: Wait for a second ( wait for the animation )
		// eslint-disable-next-line no-restricted-syntax
		await page.waitFor( 1000 );

		// Publish the post
		await page.click( '.editor-post-publish-button' );

		// A success notice should show up
		page.waitForSelector( '.notice-success' );

		// The post publish panel is visible
		expect( await page.$( '.editor-post-publish-panel' ) ).not.toBeNull();

		// Start editing again
		await page.type( '.editor-post-title__input', ' (Updated)' );

		// The post publish panel is not visible anymore
		expect( await page.$( '.editor-post-publish-panel' ) ).toBeNull();
	} );
} );
