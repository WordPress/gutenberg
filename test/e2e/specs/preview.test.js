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

		// Don't proceed with autosave until preview window page is resolved.
		await editorPage.setRequestInterception( true );

		let [ , previewPage ] = await Promise.all( [
			editorPage.click( '.editor-post-preview' ),
			new Promise( ( resolve ) => {
				browser.once( 'targetcreated', async ( target ) => {
					resolve( await target.page() );
				} );
			} ),
		] );

		// Interstitial screen while save in progress.
		expect( previewPage.url() ).toBe( 'about:blank' );

		// Release request intercept should allow redirect to occur after save.
		await Promise.all( [
			previewPage.waitForNavigation(),
			editorPage.setRequestInterception( false ),
		] );

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

		// Second preview should reuse same popup frame, with interstitial.
		await editorPage.setRequestInterception( true );
		await Promise.all( [
			editorPage.click( '.editor-post-preview' ),
			// Note: `load` event is used since, while a `window.open` with
			// `about:blank` is called, the target window doesn't actually
			// navigate to `about:blank` (it is treated as noop). But when
			// the `document.write` + `document.close` of the interstitial
			// finishes, a `load` event is fired.
			new Promise( ( resolve ) => previewPage.once( 'load', resolve ) ),
		] );
		await editorPage.setRequestInterception( false );

		// Wait for preview to load.
		await new Promise( ( resolve ) => {
			previewPage.once( 'load', resolve );
		} );

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval( '.entry-title', ( node ) => node.textContent );
		expect( previewTitle ).toBe( 'Hello World!' );

		// Pressing preview without changes should bring same preview window to
		// front and reload, but should not show interstitial. Intercept editor
		// requests in case a save attempt occurs, to avoid race condition on
		// the load event and title retrieval.
		await editorPage.bringToFront();
		await editorPage.setRequestInterception( true );
		await editorPage.click( '.editor-post-preview' );
		await new Promise( ( resolve ) => previewPage.once( 'load', resolve ) );
		previewTitle = await previewPage.$eval( '.entry-title', ( node ) => node.textContent );
		expect( previewTitle ).toBe( 'Hello World!' );
		await editorPage.setRequestInterception( false );

		// Preview for published post (no unsaved changes) directs to canonical
		// URL for post.
		await editorPage.bringToFront();
		await publishPost();
		await Promise.all( [
			page.waitForFunction( () => ! document.querySelector( '.editor-post-preview' ) ),
			page.click( '.editor-post-publish-panel__header button' ),
		] );
		expectedPreviewURL = await editorPage.$eval( '.notice-success a', ( node ) => node.href );
		// Note / Temporary: It's expected that Chrome should reuse the same
		// tab with window name `wp-preview-##`, yet in this instance a new tab
		// is unfortunately created.
		previewPage = ( await Promise.all( [
			editorPage.click( '.editor-post-preview' ),
			new Promise( ( resolve ) => {
				browser.once( 'targetcreated', async ( target ) => {
					resolve( await target.page() );
				} );
			} ),
		] ) )[ 1 ];
		expect( previewPage.url() ).toBe( expectedPreviewURL );

		// Return to editor to change title.
		await editorPage.bringToFront();
		await editorPage.type( '.editor-post-title__input', ' And more.' );

		// Published preview should reuse same popup frame, with interstitial.
		await editorPage.setRequestInterception( true );
		await Promise.all( [
			editorPage.click( '.editor-post-preview' ),
			new Promise( ( resolve ) => previewPage.once( 'load', resolve ) ),
		] );
		await editorPage.setRequestInterception( false );

		// Wait for preview to load.
		await new Promise( ( resolve ) => {
			previewPage.once( 'load', resolve );
		} );

		// Title in preview should match updated input.
		previewTitle = await previewPage.$eval( '.entry-title', ( node ) => node.textContent );
		expect( previewTitle ).toBe( 'Hello World! And more.' );

		// Published preview URL should include ID and nonce parameters.
		const { query } = parse( previewPage.url(), true );
		expect( query ).toHaveProperty( 'preview_id' );
		expect( query ).toHaveProperty( 'preview_nonce' );
	} );
} );
