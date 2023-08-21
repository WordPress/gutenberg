/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-key', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-key' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-key' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should keep the elements when adding items to the start of the array', async ( {
		page,
	} ) => {
		// Add a number to the node so we can check later that it is still there.
		await page
			.getByTestId( 'first-item' )
			.evaluate( ( n ) => ( ( n as any )._id = 123 ) );
		await page.getByTestId( 'navigate' ).click();
		const id = await page
			.getByTestId( 'second-item' )
			.evaluate( ( n ) => ( n as any )._id );
		expect( id ).toBe( 123 );
	} );
} );
