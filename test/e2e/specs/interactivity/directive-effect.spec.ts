/**
 * WordPress dependencies
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'data-wp-effect', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.activatePlugin(
			'gutenberg-test-interactive-blocks'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deactivatePlugin(
			'gutenberg-test-interactive-blocks'
		);
	} );

	let postId: number | null;

	test.beforeEach( async ( { admin, editor, page } ) => {
		// We only need to publish a new post the first time. Subsequent tests
		// will access to the same post.
		if ( ! postId ) {
			await admin.createNewPost();
			await editor.setContent( `<!-- wp:test/directive-effect /-->` );
			postId = await editor.publishPost();
		}
		await page.goto( `/?p=${ postId }` );
	} );

	test( 'check that effect runs when it is added', async ( { page } ) => {
		const el = page.getByTestId( 'element in the DOM' );
		await expect( el ).toContainText( 'element is in the DOM' );
	} );

	test( 'check that effect runs when it is removed', async ( { page } ) => {
		await page.getByTestId( 'toggle' ).click();
		const el = page.getByTestId( 'element in the DOM' );
		await expect( el ).toContainText( 'element is not in the DOM' );
	} );

	test( 'change focus after DOM changes', async ( { page } ) => {
		const el = page.getByTestId( 'input' );
		await expect( el ).toBeFocused();
		await page.getByTestId( 'toggle' ).click();
		await page.getByTestId( 'toggle' ).click();
		await expect( el ).toBeFocused();
	} );
} );
