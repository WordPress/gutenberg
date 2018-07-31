/**
 * External dependencies
 */
import { parse } from 'url';

/**
 * Internal dependencies
 */
import '../support/bootstrap';
import {
	newPost,
	newDesktopBrowserPage,
	getUrl,
	publishPost,
} from '../support/utils';

describe( 'Preview', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
	} );

	beforeEach( async () => {
		await newPost();
	} );

	it( 'Should open a preview window for a new post', async () => {
		const editorPage = page;

		// Disabled until content present.
		const isPreviewDisabled = await page.$$eval(
			'.editor-post-preview:not( :disabled )',
			( enabledButtons ) => ! enabledButtons.length,
		);
		expect( isPreviewDisabled ).toBe( true );

		await editorPage.type( '.editor-post-title__input', 'Hello World' );

		await page.click( '.editor-post-preview' );

		const previewPage = await new Promise( ( resolve ) => {
			async function onBrowserTabOpened( target ) {
				const targetPage = await target.page();
				resolve( targetPage );
			}
			browser.once( 'targetcreated', onBrowserTabOpened );
		} );

		// When autosave completes for a new post, the URL of the editor should
		// update to include the ID. Use this to assert on preview URL.
		const [ , postId ] = await ( await editorPage.waitForFunction( () => {
			return window.location.search.match( /[\?&]post=(\d+)/ );
		} ) ).jsonValue();

		let expectedPreviewURL = getUrl( '', `?p=${ postId }&preview=true` );
		expect( previewPage.url() ).toBe( expectedPreviewURL );

		// Title in preview should match input.
		let previewTitle = await previewPage.$eval( '.entry-title', ( node ) => node.textContent );
		expect( previewTitle ).toBe( 'Hello World' );

		// Return to editor to change title.
		await editorPage.bringToFront();
		await editorPage.type( '.editor-post-title__input', '!' );
		await page.click( '.editor-post-preview' );
		await previewPage.waitForNavigation();

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval( '.entry-title', ( node ) => node.textContent );
		expect( previewTitle ).toBe( 'Hello World!' );

		// Pressing preview without changes should bring same preview window to
		// front and reload, but should not show interstitial.
		await editorPage.bringToFront();
		await page.click( '.editor-post-preview' );
		await previewPage.waitForNavigation();
		previewTitle = await previewPage.$eval( '.entry-title', ( node ) => node.textContent );
		expect( previewTitle ).toBe( 'Hello World!' );

		// Preview for published post (no unsaved changes) directs to canonical
		// URL for post.
		await editorPage.bringToFront();
		await publishPost();
		await Promise.all( [
			page.waitForFunction( () => ! document.querySelector( '.editor-post-preview' ) ),
			page.click( '.editor-post-publish-panel__header button' ),
		] );
		expectedPreviewURL = await editorPage.$eval( '.notice-success a', ( node ) => node.href );
		await page.click( '.editor-post-preview' );
		await previewPage.waitForNavigation();
		expect( previewPage.url() ).toBe( expectedPreviewURL );

		// Return to editor to change title.
		await editorPage.bringToFront();
		await editorPage.type( '.editor-post-title__input', ' And more.' );
		await page.click( '.editor-post-preview' );
		await previewPage.waitForNavigation();

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval( '.entry-title', ( node ) => node.textContent );
		expect( previewTitle ).toBe( 'Hello World! And more.' );

		// Published preview URL should include ID and nonce parameters.
		const { query } = parse( previewPage.url(), true );
		expect( query ).toHaveProperty( 'preview_id' );
		expect( query ).toHaveProperty( 'preview_nonce' );

		// Return to editor. Previewing already-autosaved preview tab should
		// reuse the opened tab, skipping interstitial. This resolves an edge
		// cases where the post is dirty but not autosaveable (because the
		// autosave is already up-to-date).
		//
		// See: https://github.com/WordPress/gutenberg/issues/7561
		await editorPage.bringToFront();
		await page.click( '.editor-post-preview' );
		await previewPage.waitForNavigation();

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval( '.entry-title', ( node ) => node.textContent );
		expect( previewTitle ).toBe( 'Hello World! And more.' );
	} );
} );
