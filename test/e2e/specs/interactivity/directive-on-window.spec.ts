/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-on-window', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-on-window' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-on-window' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'callbacks should run whenever the specified event is dispatched', async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 600, height: 600 } );
		const counter = page.getByTestId( 'counter' );
		await expect( counter ).toHaveText( '1' );
	} );
} );
