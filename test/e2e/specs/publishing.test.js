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

		it( 'Should publish a post and close the panel once we start editing again', async () => {
			await page.type( '.editor-post-title__input', 'E2E Test Post' );

			await publishPost();

			// The post publish panel is visible
			expect( await page.$( '.editor-post-publish-panel' ) ).not.toBeNull();

			// Start editing again
			await page.type( '.editor-post-title__input', ' (Updated)' );

			// The post publish panel is not visible anymore
			expect( await page.$( '.editor-post-publish-panel' ) ).toBeNull();
		} );
	} );

	describe( 'a page', () => {
		beforeEach( async () => {
			await newPost( 'page' );
		} );

		it( 'Should publish a page and close the panel once we start editing again', async () => {
			await page.type( '.editor-post-title__input', 'E2E Test Post' );

			await publishPost();

			// The post publish panel is visible
			expect( await page.$( '.editor-post-publish-panel' ) ).not.toBeNull();

			// Start editing again
			await page.type( '.editor-post-title__input', ' (Updated)' );

			// The post publish panel is not visible anymore
			expect( await page.$( '.editor-post-publish-panel' ) ).toBeNull();
		} );
	} );
} );
