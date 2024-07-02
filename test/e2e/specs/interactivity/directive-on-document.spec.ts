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

	test( 'the event listener is attached when the element is added', async ( {
		page,
	} ) => {
		const counter = page.getByTestId( 'counter' );
		const visibilityButton = page.getByTestId( 'visibility' );

		// Initial value.
		await expect( counter ).toHaveText( '0' );

		// Make sure the event listener is attached.
		await page
			.getByTestId( 'isEventAttached' )
			.filter( { hasText: 'yes' } )
			.waitFor();

		// This keyboard press should increase the counter.
		await page.keyboard.press( 'ArrowDown' );
		await expect( counter ).toHaveText( '1' );

		// Remove the element.
		await visibilityButton.click();

		// Make sure the event listener is not attached.
		await page
			.getByTestId( 'isEventAttached' )
			.filter( { hasText: 'no' } )
			.waitFor();

		// This keyboard press should not increase the counter.
		await page.keyboard.press( 'ArrowDown' );

		// Add the element back.
		await visibilityButton.click();

		// The counter should have the same value as before.
		await expect( counter ).toHaveText( '1' );

		// Make sure the event listener is re-attached.
		await page
			.getByTestId( 'isEventAttached' )
			.filter( { hasText: 'yes' } )
			.waitFor();

		// This keyboard press should increase the counter.
		await page.keyboard.press( 'ArrowDown' );
		await expect( counter ).toHaveText( '2' );
	} );
	test( 'should work with multiple event handlers on the same event type', async ( {
		page,
	} ) => {
		const keydownHandler = page.getByTestId( 'keydownHandler' );
		const keydownSecondHandler = page.getByTestId( 'keydownSecondHandler' );

		// Initial value.
		await expect( keydownHandler ).toHaveText( 'no' );
		await expect( keydownSecondHandler ).toHaveText( 'no' );

		// Make sure the event listener is attached.
		await page
			.getByTestId( 'isEventAttached' )
			.filter( { hasText: 'yes' } )
			.waitFor();

		// This keyboard press should increase the counter.
		await page.keyboard.press( 'ArrowDown' );
		await expect( keydownHandler ).toHaveText( 'yes' );
		await expect( keydownSecondHandler ).toHaveText( 'yes' );
	} );
} );
