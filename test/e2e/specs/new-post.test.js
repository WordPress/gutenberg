/**
 * Internal dependencies
 */
import {
	newPost,
} from '../support/utils';

describe( 'new post', () => {
	beforeEach( async () => {
		await newPost();
	} );

	it( 'should focus the title if the title is empty', async () => {
		const activeElementClasses = await page.evaluate( () => {
			return Object.values( document.activeElement.classList );
		} );
		const activeElementTagName = await page.evaluate( () => {
			return document.activeElement.tagName.toLowerCase();
		} );

		expect( activeElementClasses ).toContain( 'editor-post-title__input' );
		expect( activeElementTagName ).toEqual( 'textarea' );
	} );

	it( 'should not focus the title if the title exists', async () => {
		// Enter a title for this post.
		await page.type( '.editor-post-title__input', 'Here is the title' );
		// Save the post as a draft.
		await page.click( '.editor-post-save-draft' );
		await page.waitForSelector( '.editor-post-saved-state.is-saved' );
		// Reload the browser so a post is loaded with a title.
		await page.reload();

		const activeElementClasses = await page.evaluate( () => {
			return Object.values( document.activeElement.classList );
		} );
		const activeElementTagName = await page.evaluate( () => {
			return document.activeElement.tagName.toLowerCase();
		} );

		expect( activeElementClasses ).not.toContain( 'editor-post-title__input' );
		// The document body should be the `activeElement`, because nothing is
		// focused by default when a post already has a title.
		expect( activeElementTagName ).toEqual( 'body' );
	} );
} );
