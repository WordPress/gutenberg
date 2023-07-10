/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Separator', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by three dashes and enter', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '---' );
		await page.keyboard.press( 'Enter' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
