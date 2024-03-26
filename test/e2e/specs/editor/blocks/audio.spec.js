/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Visual Regression Testing', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyfour' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should match baseline screenshot', async ( { editor, page } ) => {
		// Inserting an audio block
		await editor.insertBlock( {
			name: 'core/audio',
		} );

		await editor.canvas
			.getByRole( 'button', { name: 'Insert from URL' } )
			.click();
		await page.keyboard.type( 'http://example.com/audio.mp3' );
		await page.keyboard.press( 'Enter' );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );
		await expect( page ).toHaveScreenshot();
	} );
} );
