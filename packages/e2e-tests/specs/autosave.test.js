/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	getEditedPostContent,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

const AUTOSAVE_INTERVAL_SECONDS = 15;

async function saveDraftWithKeyboard() {
	return pressKeyWithModifier( 'primary', 's' );
}

async function sleep( durationInSeconds ) {
	return new Promise( ( resolve ) =>
		setTimeout( resolve, durationInSeconds * 1000 ) );
}

async function clearSessionStorage() {
	await page.evaluate( () => window.sessionStorage.clear() );
}

async function readSessionStorageAutosave( postId ) {
	return page.evaluate(
		( key ) => window.sessionStorage.getItem( key ),
		`wp-autosave-block-editor-post-${ postId }`
	);
}

async function getCurrentPostId() {
	return page.evaluate(
		() => window.wp.data.select( 'core/editor' ).getCurrentPostId()
	);
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
	} );

	it( 'should save to sessionStorage', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'before save' );
		await saveDraftWithKeyboard();
		await page.keyboard.type( ' after save' );

		// Wait long enough for local autosave to kick in
		await sleep( AUTOSAVE_INTERVAL_SECONDS + 1 );

		const id = await getCurrentPostId();
		const autosave = await readSessionStorageAutosave( id );
		const { content } = JSON.parse( autosave );
		expect( content ).toBe( wrapParagraph( 'before save after save' ) );

		// Test throttling by scattering typing
		await page.keyboard.type( ' 1' );
		await sleep( AUTOSAVE_INTERVAL_SECONDS - 4 );
		await page.keyboard.type( '2' );
		await sleep( 2 );
		await page.keyboard.type( '3' );
		await sleep( 2 );

		const newAutosave = await readSessionStorageAutosave( id );
		expect( JSON.parse( newAutosave ).content ).toBe( wrapParagraph( 'before save after save 123' ) );
	} );

	it( 'should recover from sessionStorage', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'before save' );
		await saveDraftWithKeyboard();
		await page.keyboard.type( ' after save' );

		// Reload without saving on the server
		await sleep( AUTOSAVE_INTERVAL_SECONDS + 1 );
		await page.reload();

		const notice = await page.$eval( '.components-notice__content', ( element ) => element.innerText );
		expect( notice ).toContain( 'The backup of this post in your browser is different from the version below.' );

		expect( await getEditedPostContent() ).toEqual( wrapParagraph( 'before save' ) );
		await page.click( '.components-notice__action' );
		expect( await getEditedPostContent() ).toEqual( wrapParagraph( 'before save after save' ) );
	} );

	afterAll( async () => {
		await clearSessionStorage();
	} );
} );
