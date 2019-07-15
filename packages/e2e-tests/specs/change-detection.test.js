/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	pressKeyWithModifier,
	ensureSidebarOpened,
	publishPost,
} from '@wordpress/e2e-test-utils';

describe( 'Change detection', () => {
	let handleInterceptedRequest, hadInterceptedSave;

	beforeEach( async () => {
		hadInterceptedSave = false;

		await createNewPost();
	} );

	afterEach( async () => {
		if ( handleInterceptedRequest ) {
			await releaseSaveIntercept();
		}
	} );

	async function assertIsDirty( isDirty ) {
		let hadDialog = false;

		function handleOnDialog() {
			hadDialog = true;
		}

		try {
			page.on( 'dialog', handleOnDialog );
			await page.reload();

			// Ensure whether it was expected that dialog was encountered.
			expect( hadDialog ).toBe( isDirty );
		} catch ( error ) {
			throw error;
		} finally {
			page.removeListener( 'dialog', handleOnDialog );
		}
	}

	async function interceptSave() {
		await page.setRequestInterception( true );

		handleInterceptedRequest = ( interceptedRequest ) => {
			if ( interceptedRequest.url().includes( '/wp/v2/posts' ) ) {
				hadInterceptedSave = true;
			} else {
				interceptedRequest.continue();
			}
		};
		page.on( 'request', handleInterceptedRequest );
	}

	async function releaseSaveIntercept() {
		page.removeListener( 'request', handleInterceptedRequest );
		await page.setRequestInterception( false );
		hadInterceptedSave = false;
		handleInterceptedRequest = null;
	}

	it( 'Should not save on new unsaved post', async () => {
		await interceptSave();

		// Keyboard shortcut Ctrl+S save.
		await pressKeyWithModifier( 'primary', 'S' );

		expect( hadInterceptedSave ).toBe( false );
	} );

	it( 'Should autosave post', async () => {
		await page.type( '.editor-post-title__input', 'Hello World' );

		// Force autosave to occur immediately.
		await Promise.all( [
			page.evaluate( () => window.wp.data.dispatch( 'core/editor' ).autosave() ),
			page.waitForSelector( '.editor-post-saved-state.is-autosaving' ),
			page.waitForSelector( '.editor-post-saved-state.is-saved' ),
		] );

		// Autosave draft as same user should do full save, i.e. not dirty.
		await assertIsDirty( false );
	} );

	it( 'Should prompt to confirm unsaved changes for autosaved draft for non-content fields', async () => {
		await page.type( '.editor-post-title__input', 'Hello World' );

		// Toggle post as needing review (not persisted for autosave).
		await ensureSidebarOpened();

		const postPendingReviewButton = ( await page.$x( "//label[contains(text(), 'Pending Review')]" ) )[ 0 ];
		await postPendingReviewButton.click( 'button' );

		// Force autosave to occur immediately.
		await Promise.all( [
			page.evaluate( () => window.wp.data.dispatch( 'core/editor' ).autosave() ),
			page.waitForSelector( '.editor-post-saved-state.is-autosaving' ),
			page.waitForSelector( '.editor-post-saved-state.is-saved' ),
		] );

		await assertIsDirty( true );
	} );

	it( 'Should prompt to confirm unsaved changes for autosaved published post', async () => {
		await page.type( '.editor-post-title__input', 'Hello World' );

		await publishPost();

		// Close publish panel.
		await Promise.all( [
			page.waitForFunction( () => ! document.querySelector( '.editor-post-publish-panel' ) ),
			page.click( '.editor-post-publish-panel__header button' ),
		] );

		// Should be dirty after autosave change of published post.
		await page.type( '.editor-post-title__input', '!' );

		await Promise.all( [
			page.waitForSelector( '.editor-post-publish-button.is-busy' ),
			page.waitForSelector( '.editor-post-publish-button:not( .is-busy )' ),
			page.evaluate( () => window.wp.data.dispatch( 'core/editor' ).autosave() ),
		] );

		await assertIsDirty( true );
	} );

	it( 'Should not prompt to confirm unsaved changes for new post', async () => {
		await assertIsDirty( false );
	} );

	it( 'Should not prompt to confirm unsaved changes for new post with initial edits', async () => {
		await createNewPost( {
			title: 'My New Post',
			content: 'My content',
			excerpt: 'My excerpt',
		} );

		await assertIsDirty( false );
	} );

	it( 'Should prompt if property changed without save', async () => {
		await page.type( '.editor-post-title__input', 'Hello World' );

		await assertIsDirty( true );
	} );

	it( 'Should prompt if content added without save', async () => {
		await clickBlockAppender();

		await assertIsDirty( true );
	} );

	it( 'Should not prompt if changes saved', async () => {
		await page.type( '.editor-post-title__input', 'Hello World' );

		await Promise.all( [
			// Wait for "Saved" to confirm save complete.
			page.waitForSelector( '.editor-post-saved-state.is-saved' ),

			// Keyboard shortcut Ctrl+S save.
			pressKeyWithModifier( 'primary', 'S' ),
		] );

		await assertIsDirty( false );
	} );

	it( 'Should not save if all changes saved', async () => {
		await page.type( '.editor-post-title__input', 'Hello World' );

		await Promise.all( [
			// Wait for "Saved" to confirm save complete.
			page.waitForSelector( '.editor-post-saved-state.is-saved' ),

			// Keyboard shortcut Ctrl+S save.
			pressKeyWithModifier( 'primary', 'S' ),
		] );

		await interceptSave();

		// Keyboard shortcut Ctrl+S save.
		await pressKeyWithModifier( 'primary', 'S' );

		expect( hadInterceptedSave ).toBe( false );
	} );

	it( 'Should prompt if save failed', async () => {
		await page.type( '.editor-post-title__input', 'Hello World' );

		await page.setOfflineMode( true );

		await Promise.all( [
			// Keyboard shortcut Ctrl+S save.
			pressKeyWithModifier( 'primary', 'S' ),

			// Ensure save update fails and presents button.
			page.waitForXPath(
				'//*[contains(@class, "components-notice") and contains(@class, "is-error")]/*[text()="Updating failed. Error message: The response is not a valid JSON response."]'
			),
			page.waitForSelector( '.editor-post-save-draft' ),
		] );

		// Need to disable offline to allow reload.
		await page.setOfflineMode( false );

		await assertIsDirty( true );

		expect( console ).toHaveErroredWith( 'Failed to load resource: net::ERR_INTERNET_DISCONNECTED' );
	} );

	it( 'Should prompt if changes and save is in-flight', async () => {
		await page.type( '.editor-post-title__input', 'Hello World' );

		// Hold the posts request so we don't deal with race conditions of the
		// save completing early. Other requests should be allowed to continue,
		// for example the page reload test.
		await interceptSave();

		// Keyboard shortcut Ctrl+S save.
		await pressKeyWithModifier( 'primary', 'S' );

		await releaseSaveIntercept();

		await assertIsDirty( true );
	} );

	it( 'Should prompt if changes made while save is in-flight', async () => {
		await page.type( '.editor-post-title__input', 'Hello World' );

		// Hold the posts request so we don't deal with race conditions of the
		// save completing early. Other requests should be allowed to continue,
		// for example the page reload test.
		await interceptSave();

		// Keyboard shortcut Ctrl+S save.
		await pressKeyWithModifier( 'primary', 'S' );

		await page.type( '.editor-post-title__input', '!' );

		await releaseSaveIntercept();

		await assertIsDirty( true );
	} );

	it( 'Should prompt if property changes made while save is in-flight, and save completes', async () => {
		await page.type( '.editor-post-title__input', 'Hello World' );

		// Hold the posts request so we don't deal with race conditions of the
		// save completing early.
		await interceptSave();

		// Keyboard shortcut Ctrl+S save.
		await pressKeyWithModifier( 'primary', 'S' );

		// Dirty post while save is in-flight.
		await page.type( '.editor-post-title__input', '!' );

		// Allow save to complete. Disabling interception flushes pending.
		await Promise.all( [
			page.waitForSelector( '.editor-post-saved-state.is-saved' ),
			releaseSaveIntercept(),
		] );

		await assertIsDirty( true );
	} );

	it( 'Should prompt if block revision is made while save is in-flight, and save completes', async () => {
		await page.type( '.editor-post-title__input', 'Hello World' );

		// Hold the posts request so we don't deal with race conditions of the
		// save completing early.
		await interceptSave();

		// Keyboard shortcut Ctrl+S save.
		await pressKeyWithModifier( 'primary', 'S' );

		await clickBlockAppender();

		// Allow save to complete. Disabling interception flushes pending.
		await Promise.all( [
			page.waitForSelector( '.editor-post-saved-state.is-saved' ),
			releaseSaveIntercept(),
		] );

		await assertIsDirty( true );
	} );

	it( 'should not prompt when receiving reusable blocks', async () => {
		// Regression Test: Verify that non-modifying behaviors does not incur
		// dirtiness. Previously, this could occur as a result of either (a)
		// selecting a block, (b) opening the inserter, or (c) editing a post
		// which contained a reusable block. The root issue was changes in
		// block editor state as a result of reusable blocks data having been
		// received, reflected here in this test.
		//
		// TODO: This should be considered a temporary test, existing only so
		// long as the experimental reusable blocks fetching data flow exists.
		//
		// See: https://github.com/WordPress/gutenberg/issues/14766
		await page.evaluate( () => window.wp.data.dispatch( 'core/editor' ).__experimentalReceiveReusableBlocks( [] ) );

		await assertIsDirty( false );
	} );
} );
