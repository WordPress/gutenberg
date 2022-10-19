/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Compatibility with classic editor', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'Should not apply autop when rendering blocks', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/html' } );
		await page.focus( 'role=textbox[name="HTML"i]' );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '<a>' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Random Link' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '</a> ' );
		// Publish Post
		await editor.publishPost();

		// View Post
		await page.locator( 'a.components-button.is-primary' ).click();

		// Check the content doesn't contain <p> tags.
		await page.waitForSelector( '.entry-content' );
		const content = await page.$eval( '.entry-content', ( element ) =>
			element.innerHTML.trim()
		);
		expect( content ).toMatchSnapshot();
	} );
} );
