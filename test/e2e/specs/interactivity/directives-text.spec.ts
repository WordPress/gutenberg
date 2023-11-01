/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-text', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-text' );
	} );
	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-text' ) );
	} );
	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'show proper text reading from state', async ( { page } ) => {
		const el = page.getByTestId( 'show state text' );
		await expect( el ).toHaveText( 'Text 1' );
		await page.getByTestId( 'toggle state text' ).click();
		await expect( el ).toHaveText( 'Text 2' );
		await page.getByTestId( 'toggle state text' ).click();
		await expect( el ).toHaveText( 'Text 1' );
	} );

	test( 'show proper text reading from context', async ( { page } ) => {
		const el = page.getByTestId( 'show context text' );
		await expect( el ).toHaveText( 'Text 1' );
		await page.getByTestId( 'toggle context text' ).click();
		await expect( el ).toHaveText( 'Text 2' );
		await page.getByTestId( 'toggle context text' ).click();
		await expect( el ).toHaveText( 'Text 1' );
	} );
} );
