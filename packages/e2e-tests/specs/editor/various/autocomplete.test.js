/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	deactivatePlugin,
	clickBlockAppender,
	createNewPost,
	createUser,
	deleteUser,
	getEditedPostContent,
	pressKeyTimes,
} from '@wordpress/e2e-test-utils';

describe( 'autocomplete', () => {
	beforeAll( async () => {
		await createUser( 'testuser', { firstName: 'Jane', lastName: 'Doe' } );
		await activatePlugin( 'gutenberg-test-autocompleter' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-autocompleter' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deleteUser( 'testuser' );
	} );

	it( 'should allow newlines after a completion', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'I would like an ~o' );
		await page.waitForSelector( '.components-autocomplete__result' );
		await pressKeyTimes( 'Enter', 2 );
		await page.keyboard.type( '...and this is a new paragraph block.' );

		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>I would like an 🍊</p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph -->
		<p>...and this is a new paragraph block.</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should insert elements from multiple completers in a single block', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'I am @j' );
		await page.waitForSelector( '.components-autocomplete__result' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '. I am eating an ~a' );
		await page.waitForSelector( '.components-autocomplete__result' );
		await page.keyboard.press( 'Enter' );
		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>I am @testuser. I am eating an 🍎</p>
		<!-- /wp:paragraph -->"
		` );
	} );

	it( 'should not insert disabled options', async () => {
		await clickBlockAppender();
		// The 'Grapes' option is disabled in our test plugin, so it should insert the grapes emoji
		await page.keyboard.type( 'Sorry, we are all out of ~g' );
		await page.waitForSelector( '.components-autocomplete__result' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' grapes.' );
		// The characters that triggered the completer should remain (i.e. `~g`)
		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>Sorry, we are all out of ~g grapes.</p>
		<!-- /wp:paragraph -->"
		` );
	} );
} );
