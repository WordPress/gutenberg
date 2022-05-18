/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'HTML block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by typing "/html"', async ( { editor, page } ) => {
		// Create a Custom HTML block with the slash shortcut.
		await editor.clickBlockAppender();
		await page.keyboard.type( '/html' );
		await page.waitForSelector( 'role=option[name="Custom HTML"i]' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '<p>Pythagorean theorem: ' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type(
			'<var>a</var><sup>2</sup> + <var>b</var><sup>2</sup> = <var>c</var><sup>2</sup> </p>'
		);

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
