/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'withScope', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/with-scope' );
	} );
	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/with-scope' ) );
	} );
	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'it should test', async ( { page } ) => {
		const counter = page.getByTestId( 'counter' );
		await expect( counter ).toHaveText( '0' );
		await page.keyboard.press( 'ArrowDown' );
		await expect( counter ).toHaveText( '1' );
	} );
} );
