/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
} from '@wordpress/e2e-test-utils';

describe( 'new editor state', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-plugin-post-formats-support' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-plugin-post-formats-support' );
	} );

	it( 'should show the New Post page in Gutenberg', async () => {
		expect( page.url() ).toEqual( expect.stringContaining( 'post-new.php' ) );
		// Should display the blank title.
		const title = await page.$( '[placeholder="Add title"]' );
		expect( title ).not.toBeNull();
		expect( title.innerHTML ).toBeFalsy();
		// Should display the Preview button.
		const postPreviewButton = await page.$( '.editor-post-preview.components-button' );
		expect( postPreviewButton ).not.toBeNull();
		// Should display the Post Formats UI.
		const postFormatsUi = await page.$( '.editor-post-format' );
		expect( postFormatsUi ).not.toBeNull();
	} );

	it( 'should have no history', async () => {
		const undoButton = await page.$( '.editor-history__undo[aria-disabled="false"]' );
		const redoButton = await page.$( '.editor-history__redo[aria-disabled="false"]' );

		expect( undoButton ).toBeNull();
		expect( redoButton ).toBeNull();
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
		// The document `body` should be the `activeElement`, because nothing is
		// focused by default when a post already has a title.
		expect( activeElementTagName ).toEqual( 'body' );
	} );

	it( 'should be saveable with sufficient initial edits', async () => {
		await createNewPost( { title: 'Here is the title' } );

		// Verify saveable by presence of the Save Draft button.
		await page.$( 'button.editor-post-save-draft' );
	} );
} );
