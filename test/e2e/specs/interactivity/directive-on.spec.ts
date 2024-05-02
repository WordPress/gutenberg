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

	test( 'should work with custom events', async ( { page } ) => {
		const counter = page.getByTestId( 'custom events counter' );
		await page
			.getByTestId( 'custom events button' )
			.click( { clickCount: 3, delay: 100 } );
		await expect( counter ).toHaveText( '3' );
	} );

	test( 'should work with multiple event handlers on the same event type', async ( {
		page,
	} ) => {
		const button = page.getByTestId( 'multiple handlers button' );
		const isOpen = page.getByTestId( 'multiple handlers isOpen' );
		const clicked = page.getByTestId( 'multiple handlers clicked' );
		const clickCount = page.getByTestId( 'multiple handlers clickCount' );

		await expect( clicked ).toHaveText( 'false' );
		await expect( clickCount ).toHaveText( '0' );
		await expect( isOpen ).toHaveText( 'true' );

		await button.click();

		await expect( clicked ).toHaveText( 'true' );
		await expect( clickCount ).toHaveText( '1' );
		await expect( isOpen ).toHaveText( 'false' );

		await button.click();

		await expect( clicked ).toHaveText( 'true' );
		await expect( clickCount ).toHaveText( '2' );
		await expect( isOpen ).toHaveText( 'true' );
	} );
} );
