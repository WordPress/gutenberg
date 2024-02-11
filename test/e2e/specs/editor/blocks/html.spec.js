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
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '/html' );
		await expect(
			page.locator( 'role=option[name="Custom HTML"i][selected]' )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '<p>Pythagorean theorem: ' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type(
			'<var>a</var><sup>2</sup> + <var>b</var><sup>2</sup> = <var>c</var><sup>2</sup> </p>'
		);
		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:html -->
<p>Pythagorean theorem: 
<var>a</var><sup>2</sup> + <var>b</var><sup>2</sup> = <var>c</var><sup>2</sup> </p>
<!-- /wp:html -->`
		);
	} );

	test( 'should not encode <', async ( { editor, page } ) => {
		// Create a Custom HTML block with the slash shortcut.
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '/html' );
		await expect(
			page.locator( 'role=option[name="Custom HTML"i][selected]' )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1 < 2' );
		await editor.publishPost();
		await page.reload();
		await expect(
			editor.canvas.locator( '[data-type="core/html"] textarea' )
		).toBeVisible();
	} );
} );
