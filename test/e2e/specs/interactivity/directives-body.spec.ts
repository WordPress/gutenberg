/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-body', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-body' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-body' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( "should move the element to the document's body", async ( {
		page,
	} ) => {
		const container = page.getByTestId( 'container' );
		const parentTag = page
			.getByTestId( 'element with data-wp-body' )
			.locator( 'xpath=..' );

		await expect( container ).toBeEmpty();
		await expect( parentTag ).toHaveJSProperty( 'tagName', 'BODY' );
	} );

	test( 'should make context accessible for inner elements', async ( {
		page,
	} ) => {
		const text = page
			.getByTestId( 'element with data-wp-body' )
			.getByTestId( 'text' );
		const toggle = page.getByTestId( 'toggle text' );

		await expect( text ).toHaveText( 'text-1' );
		await toggle.click();
		await expect( text ).toHaveText( 'text-2' );
		await toggle.click();
		await expect( text ).toHaveText( 'text-1' );
	} );
} );
