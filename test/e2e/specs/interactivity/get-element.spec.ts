/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'store', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/get-element' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/get-element' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'initial attributes can be accessed', async ( { page } ) => {
		const el = page.getByTestId( 'read from attributes' );
		await expect( el ).toHaveText( 'Initial value' );
	} );

	test( 'mutated attributes via DOM manipulation can be accessed', async ( {
		page,
	} ) => {
		const button = page.getByTestId( 'mutate DOM' );
		await button.click();
		const el = page.getByTestId( 'read from attributes' );
		await expect( el ).toHaveText( 'New DOM value' );
	} );

	test( 'mutated attributes via data-wp-bind can be accessed', async ( {
		page,
	} ) => {
		const button = page.getByTestId( 'mutate prop' );
		await button.click();
		const el = page.getByTestId( 'read from attributes' );
		await expect( el ).toHaveText( 'New prop value' );
	} );
} );
