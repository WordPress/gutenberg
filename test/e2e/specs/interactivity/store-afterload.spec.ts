/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'store afterLoad callbacks', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/store-afterload' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/store-afterload' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'run after the vdom and store are ready', async ( { page } ) => {
		const allStoresReady = page.getByTestId( 'all-stores-ready' );
		const vdomReady = page.getByTestId( 'vdom-ready' );

		await expect( allStoresReady ).toHaveText( 'true' );
		await expect( vdomReady ).toHaveText( 'true' );
	} );

	test( 'run once even if shared between several store calls', async ( {
		page,
	} ) => {
		const afterLoadTimes = page.getByTestId( 'after-load-exec-times' );
		const sharedAfterLoadTimes = page.getByTestId(
			'shared-after-load-exec-times'
		);

		await expect( afterLoadTimes ).toHaveText( '1' );
		await expect( sharedAfterLoadTimes ).toHaveText( '1' );
	} );
} );
