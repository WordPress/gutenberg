/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-watch', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-watch' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-watch' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'check that watch runs when it is added', async ( { page } ) => {
		const el = page.getByTestId( 'element in the DOM' );
		await expect( el ).toContainText( 'element is in the DOM' );
	} );

	test( 'check that watch runs when it is removed', async ( { page } ) => {
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

	test( 'short-circuit infinite loops', async ( { page } ) => {
		const el = page.getByTestId( 'short-circuit infinite loops' );
		await expect( el ).toContainText( '1' );
		await page.getByTestId( 'increment' ).click();
		await expect( el ).toContainText( '3' );
	} );
} );
