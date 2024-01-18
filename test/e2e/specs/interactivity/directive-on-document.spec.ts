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
	test( 'the event listener is removed when the element is removed', async ( {
		page,
	} ) => {
		const counter = page.getByTestId( 'counter' );
		const visibilityButton = page.getByTestId( 'visibility' );
		await expect( counter ).toHaveText( '0' );
		await page.keyboard.press( 'ArrowDown' );
		await expect( counter ).toHaveText( '1' );
		// Remove the element.
		await visibilityButton.click();
		// This keyboard press should not increase the counter.
		await page.keyboard.press( 'ArrowDown' );
		// Add the element back.
		await visibilityButton.click();
		await expect( counter ).toHaveText( '1' );
		await page.keyboard.press( 'ArrowDown' );
		await expect( counter ).toHaveText( '2' );
	} );
} );
