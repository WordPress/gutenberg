/**
 * Internal dependencies
 */
import {
	newPost,
	publishPost,
} from '../support/utils';

describe( 'Publishing', () => {
	describe( 'a post', () => {
		beforeEach( async () => {
			await newPost();
		} );

		it( 'should publish a post and close the panel once we start editing again', async () => {
			await page.type( '.editor-post-title__input', 'E2E Test Post' );

			await publishPost();

			// The post-publishing panel is visible.
			expect( await page.$( '.editor-post-publish-panel' ) ).not.toBeNull();

			// Start editing again.
			await page.type( '.editor-post-title__input', ' (Updated)' );

			// The post-publishing panel is not visible anymore.
			expect( await page.$( '.editor-post-publish-panel' ) ).toBeNull();
		} );
	} );

	describe( 'a page', () => {
		beforeEach( async () => {
			await newPost( 'page' );
		} );

		it( 'should publish a page and close the panel once we start editing again', async () => {
			await page.type( '.editor-post-title__input', 'E2E Test Page' );

			await publishPost();

			// The post-publishing panel is visible.
			expect( await page.$( '.editor-post-publish-panel' ) ).not.toBeNull();

			// Start editing the page again.
			await page.type( '.editor-post-title__input', ' (Updated)' );

			// The post-publishing panel is not visible anymore.
			expect( await page.$( '.editor-post-publish-panel' ) ).toBeNull();
		} );
	} );
} );
