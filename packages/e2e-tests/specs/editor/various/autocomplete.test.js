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

describe( 'autocomplete mentions', () => {
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
} );
