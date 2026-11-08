/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

// Regression test for https://github.com/WordPress/gutenberg/issues/75778.
test.describe( 'Router hydration race condition (@webkit, @firefox)', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/router-race-condition', {
			alias: 'router-race-condition',
		} );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'router-race-condition' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should hydrate context-bound directives when router loads statically', async ( {
		page,
	} ) => {
		const button = page.getByTestId( 'context-counter' );

		await expect( button ).toHaveText( '0' );

		await button.click();
		await expect( button ).toHaveText( '1' );

		await button.click();
		await expect( button ).toHaveText( '2' );
	} );

	test( 'should hydrate state-bound directives when router loads statically', async ( {
		page,
	} ) => {
		const button = page.getByTestId( 'global-counter' );

		await expect( button ).toHaveText( '0' );

		await button.click();
		await expect( button ).toHaveText( '1' );

		await button.click();
		await expect( button ).toHaveText( '2' );
	} );
} );
