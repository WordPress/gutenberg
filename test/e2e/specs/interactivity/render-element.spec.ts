/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'renderElement', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/render-element' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/render-element' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'inserted fragment is fully interactive', async ( { page } ) => {
		const counter = page.getByTestId( 'counter' );
		await expect( counter ).toHaveCount( 0 );

		await page.getByTestId( 'load' ).click();

		await expect( counter ).toBeVisible();
		await expect( counter ).toHaveText( '0' );

		await counter.click();
		await expect( counter ).toHaveText( '1' );

		await counter.click();
		await expect( counter ).toHaveText( '2' );

		await expect( page.getByTestId( 'hydrated' ) ).toBeVisible();
	} );
} );
