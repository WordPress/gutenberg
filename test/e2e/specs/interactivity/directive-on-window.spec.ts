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
	test( 'the event listener is removed when the element is removed', async ( {
		page,
	} ) => {
		const counter = page.getByTestId( 'counter' );
		const isEventAttached = page.getByTestId( 'isEventAttached' );
		const visibilityButton = page.getByTestId( 'visibility' );

		await expect( counter ).toHaveText( '0' );
		await expect( isEventAttached ).toHaveText( 'yes' );
		await page.setViewportSize( { width: 600, height: 600 } );
		await expect( counter ).toHaveText( '1' );

		// Remove the element.
		await visibilityButton.click();

		// This resize should not increase the counter.
		await page.setViewportSize( { width: 300, height: 600 } );

		// Add the element back.
		await visibilityButton.click();
		await expect( counter ).toHaveText( '1' );

		// Wait until the effects run again.
		await expect( isEventAttached ).toHaveText( 'yes' );

		await page.setViewportSize( { width: 200, height: 600 } );
		await expect( counter ).toHaveText( '2' );
	} );
} );
