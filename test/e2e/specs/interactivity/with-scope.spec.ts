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

	test( 'directives using withScope should work with async and sync functions', async ( {
		page,
	} ) => {
		const asyncCounter = page.getByTestId( 'asyncCounter' );
		await expect( asyncCounter ).toHaveText( '1' );
		const syncCounter = page.getByTestId( 'syncCounter' );
		await expect( syncCounter ).toHaveText( '1' );
	} );
} );
