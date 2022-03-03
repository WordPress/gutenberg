/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	getEditedPostContent,
	pressKeyWithModifier,
	publishPost,
	saveDraft,
	toggleOfflineMode,
} from '@wordpress/e2e-test-utils';

// Constant to override editor preference
const AUTOSAVE_INTERVAL_SECONDS = 5;

const AUTOSAVE_NOTICE_REMOTE =
	'There is an autosave of this post that is more recent than the version below.';
const AUTOSAVE_NOTICE_LOCAL =
	'The backup of this post in your browser is different from the version below.';

// Save and wait for "Saved" to confirm save complete. Preserves focus in the
// editing area.
async function saveDraftWithKeyboard() {
	await page.waitForSelector( '.editor-post-save-draft' );
	await Promise.all( [
		page.waitForSelector( '.editor-post-saved-state.is-saved' ),
		pressKeyWithModifier( 'primary', 'S' ),
	] );
}

async function sleep( durationInSeconds ) {
	// Rule `no-restricted-syntax` recommends `waitForSelector` against
	// `waitFor`, which isn't apt for the use case, when provided an integer,
	// of waiting for a given amount of time.
	// eslint-disable-next-line no-restricted-syntax
	await page.waitForTimeout( durationInSeconds * 1000 );
}

async function clearSessionStorage() {
	await page.evaluate( () => window.sessionStorage.clear() );
}

async function readSessionStorageAutosave( postId ) {
	return page.evaluate(
		( key ) => window.sessionStorage.getItem( key ),
		`wp-autosave-block-editor-post-${ postId ? postId : 'auto-draft' }`
	);
}

async function getCurrentPostId() {
	return page.evaluate( () =>
		window.wp.data.select( 'core/editor' ).getCurrentPostId()
	);
}

async function setLocalAutosaveInterval( value ) {
	return page.evaluate( ( _value ) => {
		window.wp.data
			.dispatch( 'core/preferences' )
			.set( 'core/edit-post', 'localAutosaveInterval', _value );
	}, value );
}

function wrapParagraph( text ) {
	return `<!-- wp:paragraph -->
<p>${ text }</p>
<!-- /wp:paragraph -->`;
}

describe( 'autosave', () => {
	beforeEach( async () => {
		await clearSessionStorage();
		await createNewPost();
		await setLocalAutosaveInterval( AUTOSAVE_INTERVAL_SECONDS );
	} );

	it( 'should save to sessionStorage', async () => {
		// Wait for the original timeout to kick in, it will schedule
		// another run using the updated interval length of AUTOSAVE_INTERVAL_SECONDS.
		await sleep( 15 );

		await clickBlockAppender();
		await page.keyboard.type( 'before save' );
		await saveDraftWithKeyboard();
		await sleep( 1 );
		await page.keyboard.type( ' after save' );

		// Wait long enough for local autosave to kick in.
		await sleep( AUTOSAVE_INTERVAL_SECONDS + 1 );

		const id = await getCurrentPostId();
		const autosave = await readSessionStorageAutosave( id );
		const { content } = JSON.parse( autosave );
		expect( content ).toBe( wrapParagraph( 'before save after save' ) );
	} );

	it( 'should recover from sessionStorage', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'before save' );
		await saveDraftWithKeyboard();
		await page.keyboard.type( ' after save' );

		// Trigger local autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);
		// Reload without saving on the server.
		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );

		const notice = await page.$eval(
			'.components-notice__content',
			( element ) => element.innerText
		);
		expect( notice ).toContain( AUTOSAVE_NOTICE_LOCAL );

		expect( await getEditedPostContent() ).toEqual(
			wrapParagraph( 'before save' )
		);
		await page.click( '.components-notice__action' );
		expect( await getEditedPostContent() ).toEqual(
			wrapParagraph( 'before save after save' )
		);
	} );

	it( "shouldn't contaminate other posts", async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'before save' );
		await saveDraft();

		// Fake local autosave.
		await page.evaluate(
			( postId ) =>
				window.sessionStorage.setItem(
					`wp-autosave-block-editor-post-${ postId }`,
					JSON.stringify( {
						post_title: 'A',
						content: 'B',
						excerpt: 'C',
					} )
				),
			await getCurrentPostId()
		);
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 1 );

		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );
		const notice = await page.$eval(
			'.components-notice__content',
			( element ) => element.innerText
		);
		expect( notice ).toContain(
			'The backup of this post in your browser is different from the version below.'
		);

		await createNewPost();
		expect( await page.$( '.components-notice__content' ) ).toBe( null );
	} );

	it( 'should clear local autosave after successful remote autosave', async () => {
		// Edit, save draft, edit again.
		await clickBlockAppender();
		await page.keyboard.type( 'before save' );
		await saveDraftWithKeyboard();
		await page.keyboard.type( ' after save' );

		// Trigger local autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBeGreaterThanOrEqual( 1 );

		// Trigger remote autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave()
		);
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 0 );
	} );

	it( "shouldn't clear local autosave if remote autosave fails", async () => {
		// Edit, save draft, edit again.
		await clickBlockAppender();
		await page.keyboard.type( 'before save' );
		await saveDraftWithKeyboard();
		await page.keyboard.type( ' after save' );

		// Trigger local autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 1 );

		// Bring network down and attempt to autosave remotely.
		toggleOfflineMode( true );
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave()
		);
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 1 );
	} );

	it( 'should clear local autosave after successful save', async () => {
		// Edit, save draft, edit again.
		await clickBlockAppender();
		await page.keyboard.type( 'before save' );
		await saveDraftWithKeyboard();
		await page.keyboard.type( ' after save' );

		// Trigger local autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 1 );

		await saveDraftWithKeyboard();
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 0 );
	} );

	it( "shouldn't clear local autosave if save fails", async () => {
		// Edit, save draft, edit again.
		await clickBlockAppender();
		await page.keyboard.type( 'before save' );
		await saveDraftWithKeyboard();
		await page.keyboard.type( ' after save' );

		// Trigger local autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBeGreaterThanOrEqual( 1 );

		// Bring network down and attempt to save.
		toggleOfflineMode( true );
		saveDraftWithKeyboard();
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBeGreaterThanOrEqual( 1 );
	} );

	it( "shouldn't conflict with server-side autosave", async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'before publish' );
		await publishPost();

		await page.click( '[data-type="core/paragraph"]' );
		await page.keyboard.type( ' after publish' );

		// Trigger remote autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave()
		);

		// Force conflicting local autosave.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave( { local: true } )
		);
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBeGreaterThanOrEqual( 1 );

		await page.reload();
		await page.waitForSelector( '.edit-post-layout' );

		// FIXME: Occasionally, upon reload, there is no server-provided
		// autosave value available, despite our having previously explicitly
		// autosaved. The reasons for this are still unknown. Since this is
		// unrelated to *local* autosave, until we can understand them, we'll
		// drop this test's expectations if we don't have an autosave object
		// available.
		const stillHasRemoteAutosave = await page.evaluate(
			() =>
				window.wp.data.select( 'core/editor' ).getEditorSettings()
					.autosave
		);
		if ( ! stillHasRemoteAutosave ) {
			return;
		}

		// Only one autosave notice should be displayed.
		const notices = await page.$$( '.components-notice' );
		expect( notices.length ).toBe( 1 );
		const notice = await page.$eval(
			'.components-notice__content',
			( element ) => element.innerText
		);
		expect( notice ).toContain( AUTOSAVE_NOTICE_REMOTE );
	} );

	it( 'should clear sessionStorage upon user logout', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'before save' );
		await saveDraft();

		// Fake local autosave.
		await page.evaluate(
			( postId ) =>
				window.sessionStorage.setItem(
					`wp-autosave-block-editor-post-${ postId }`,
					JSON.stringify( {
						post_title: 'A',
						content: 'B',
						excerpt: 'C',
					} )
				),
			await getCurrentPostId()
		);
		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 1 );

		await Promise.all( [
			page.waitForSelector( '#wp-admin-bar-logout', { visible: true } ),
			page.hover( '#wp-admin-bar-my-account' ),
		] );
		await Promise.all( [
			page.waitForNavigation(),
			page.click( '#wp-admin-bar-logout' ),
		] );

		expect(
			await page.evaluate( () => window.sessionStorage.length )
		).toBe( 0 );
	} );

	afterEach( async () => {
		toggleOfflineMode( false );
		await clearSessionStorage();
	} );
} );
