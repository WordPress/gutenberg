/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-on', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-on' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-on' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'callbacks should run whenever the specified event is dispatched', async ( {
		page,
	} ) => {
		const counter = page.getByTestId( 'counter' );
		await page
			.getByTestId( 'button' )
			.click( { clickCount: 3, delay: 100 } );
		await expect( counter ).toHaveText( '3' );
	} );

	test( 'callbacks should receive the dispatched event', async ( {
		page,
	} ) => {
		const text = page.getByTestId( 'text' );
		await page.getByTestId( 'input' ).fill( 'hello!' );
		await expect( text ).toHaveText( 'hello!' );
	} );

	test( 'callbacks should be able to access the context', async ( {
		page,
	} ) => {
		const option = page.getByTestId( 'option' );
		await page.getByTestId( 'select' ).selectOption( 'dog' );
		await expect( option ).toHaveText( 'dog' );
	} );

	test( 'should not work if no event is defined', async ( { page } ) => {
		const counter = page.getByTestId( 'counter not working' );
		await page
			.getByTestId( 'button not working' )
			.click( { clickCount: 1, delay: 100 } );
		await expect( counter ).toHaveText( '0' );
	} );
} );
