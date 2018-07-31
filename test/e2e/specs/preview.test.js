/**
 * External dependencies
 */
import { parse } from 'url';

/**
 * Internal dependencies
 */
import {
	newPost,
	getUrl,
	publishPost,
} from '../support/utils';

describe( 'Preview', () => {

	beforeEach( async () => {
		await newPost();
	} );

	function sleep( time ) {
		return new Promise( resolve => setTimeout( resolve, time ) );
	}

	/**
	 * Waits for the number of open tabs to change. Listening for `targetcreated` is not reliable
	 * see: https://github.com/berstend/puppeteer-extra/issues/6
	 * The listeners sometimes get called too late, and the test has carried on without getting
	 * the target, and we end up with a crash.
	 */
	async function waitForTab( numTabs ) {
		let tabs = await browser.pages();
		while ( tabs.length === numTabs ) {
			await sleep(100);
			tabs = await browser.pages();
		}
	}

	async function openPreviewPage( editorPage ) {
		let openTabs = await browser.pages();
		const numberOfTabs = openTabs.length;
		expect( numberOfTabs ).toBe( 2 );

		editorPage.click( '.editor-post-preview' );
		await waitForTab( numberOfTabs );

		openTabs = await browser.pages();
		expect( openTabs.length ).toBe( 3 );

		const previewPage = openTabs[ openTabs.length - 1 ];
		// Wait for the preview to load. We can't do interstitial detection here,
		// because it might load too quickly for us to pick up, so we wait for
		// the preview to load by waiting for the title to appear.
		await previewPage.waitForSelector( '.entry-title' );
		return previewPage;
	}

	it( 'Should open a preview window for a new post', async () => {
		const editorPage = page;
		let previewPage;

		// Disabled until content present.
		const isPreviewDisabled = await editorPage.$$eval(
			'.editor-post-preview:not( :disabled )',
			( enabledButtons ) => ! enabledButtons.length,
		);
		expect( isPreviewDisabled ).toBe( true );

		await editorPage.type( '.editor-post-title__input', 'Hello World' );

		previewPage = await openPreviewPage( editorPage );

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
		await previewPage.close();
		
		// Return to editor to change title.
		await editorPage.bringToFront();
		await editorPage.type( '.editor-post-title__input', '!' );
		previewPage = await openPreviewPage( editorPage );

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval( '.entry-title', ( node ) => node.textContent );
		expect( previewTitle ).toBe( 'Hello World!' );
		await previewPage.close();

		// Pressing preview without changes should bring same preview window to
		// front and reload, but should not show interstitial.
		await editorPage.bringToFront();
		previewPage = await openPreviewPage( editorPage );
		previewTitle = await previewPage.$eval( '.entry-title', ( node ) => node.textContent );
		expect( previewTitle ).toBe( 'Hello World!' );
		await previewPage.close();

		// Preview for published post (no unsaved changes) directs to canonical
		// URL for post.
		await editorPage.bringToFront();
		await publishPost();
		await Promise.all( [
			editorPage.waitForFunction( () => ! document.querySelector( '.editor-post-preview' ) ),
			editorPage.click( '.editor-post-publish-panel__header button' ),
		] );
		expectedPreviewURL = await editorPage.$eval( '.notice-success a', ( node ) => node.href );
		previewPage = await openPreviewPage( editorPage );
		expect( previewPage.url() ).toBe( expectedPreviewURL );

		// Return to editor to change title.
		await editorPage.bringToFront();
		await editorPage.type( '.editor-post-title__input', ' And more.' );

		// Published preview should reuse same popup frame.
		// TODO: Fix an existing bug which opens a new tab.
		let previewNav = previewPage.waitForNavigation();
		editorPage.click( '.editor-post-preview' );
		await previewNav;

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
		previewNav = previewPage.waitForNavigation();
		editorPage.click( '.editor-post-preview' );
		await previewNav;

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval( '.entry-title', ( node ) => node.textContent );
		expect( previewTitle ).toBe( 'Hello World! And more.' );
		await previewPage.close();
	} );
} );
