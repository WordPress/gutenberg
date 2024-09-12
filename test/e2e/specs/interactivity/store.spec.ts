/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'store', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/store' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/store' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'non-plain objects are not proxified', async ( { page } ) => {
		const el = page.getByTestId( 'non-plain object' );
		await expect( el ).toHaveText( 'true' );
	} );

	test( 'Ensures that state cannot be set to a non-object', async ( {
		page,
	} ) => {
		const element = page.getByTestId( 'state-0' );
		await expect( element ).toHaveText( 'right' );
	} );
} );
