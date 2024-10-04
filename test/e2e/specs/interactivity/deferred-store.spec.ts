/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'deferred store', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/deferred-store' );
	} );
	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/deferred-store' ) );
	} );
	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'Ensure that a store can be subscribed to before it is initialized', async ( {
		page,
	} ) => {
		const resultInput = page.getByTestId( 'result' );
		await expect( resultInput ).toHaveText( '' );
		await page.evaluate( () => {
			window.dispatchEvent( new Event( '_test_proceed_' ) );
		} );
		await expect( resultInput ).toHaveText( 'Hello, world!' );
	} );

	test( 'Ensure that a state getter can be subscribed to before it is initialized', async ( {
		page,
	} ) => {
		const resultInput = page.getByTestId( 'result-getter' );
		await expect( resultInput ).toHaveText( '' );
		await page.evaluate( () => {
			window.dispatchEvent( new Event( '_test_proceed_' ) );
		} );
		await expect( resultInput ).toHaveText( 'Hello, world!' );
	} );
} );
