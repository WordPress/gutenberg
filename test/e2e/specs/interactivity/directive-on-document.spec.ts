/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-on-document', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-on-document' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-on-document' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'callbacks should run whenever the specified event is dispatched', async ( {
		page,
	} ) => {
		const counter = page.getByTestId( 'counter' );
		await expect( counter ).toHaveText( '0' );
		await page.keyboard.press( 'ArrowDown' );
		await expect( counter ).toHaveText( '1' );
	} );
} );
