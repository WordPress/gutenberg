/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-run', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-run' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-run' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should execute each element render', async ( { page } ) => {
		await expect( page.getByTestId( 'hydrated' ) ).toHaveText( 'yes' );
		await expect( page.getByTestId( 'renderCount' ) ).toHaveText( '1' );
		await page.getByTestId( 'increment' ).click();
		await expect( page.getByTestId( 'renderCount' ) ).toHaveText( '2' );
		await page.getByTestId( 'increment' ).click();
		await expect( page.getByTestId( 'renderCount' ) ).toHaveText( '3' );
	} );

	test( 'should execute when an element is mounted', async ( { page } ) => {
		await expect( page.getByTestId( 'mounted' ) ).toHaveText( 'no' );
		await page.getByTestId( 'toggle' ).click();
		await expect( page.getByTestId( 'mounted' ) ).toHaveText( 'yes' );
	} );

	test( 'should work with client-side navigation', async ( { page } ) => {
		await page.getByTestId( 'increment' ).click();
		await page.getByTestId( 'increment' ).click();
		await expect( page.getByTestId( 'navigated' ) ).toHaveText( 'no' );
		await expect( page.getByTestId( 'renderCount' ) ).toHaveText( '3' );
		await page.getByTestId( 'navigate' ).click();
		await expect( page.getByTestId( 'navigated' ) ).toHaveText( 'yes' );
		await expect( page.getByTestId( 'renderCount' ) ).toHaveText( '4' );
	} );

	test( 'should allow executing hooks', async ( { page } ) => {
		await page.getByTestId( 'toggle' ).click();
		const results = page.getByTestId( 'wp-run hooks results' );
		await expect( results ).toHaveAttribute( 'data-init', 'initialized' );

		await expect( results ).toHaveAttribute( 'data-watch', '0' );
		await page.getByTestId( 'increment' ).click();
		await expect( results ).toHaveAttribute( 'data-watch', '1' );
		await page.getByTestId( 'increment' ).click();
		await expect( results ).toHaveAttribute( 'data-watch', '2' );

		await page.getByTestId( 'toggle' ).click();
		await expect( results ).toHaveAttribute( 'data-init', 'cleaned up' );
		await expect( results ).toHaveAttribute( 'data-watch', 'cleaned up' );
	} );
} );
