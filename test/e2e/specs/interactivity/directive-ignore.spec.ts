/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-ignore', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-ignore' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-ignore' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'ignored directives should never update the DOM', async ( {
		page,
	} ) => {
		const block = page.getByTestId( 'block' );

		const ignoredElement = await block
			.getByTestId( 'ignored' )
			.evaluate( ( el ) => el );
		const ignoredChildElement = await block
			.getByTestId( 'ignored-child' )
			.evaluate( ( el ) => el );

		await expect( block.getByTestId( 'ignored-child' ) ).toHaveText(
			'No processing should occur here.'
		);

		await expect( block.getByTestId( 'counter' ) ).toHaveText( '0' );
		await block.getByTestId( 'click-me' ).click();
		await expect( block.getByTestId( 'counter' ) ).toHaveText( '1' );
		expect( ignoredElement ).toBe(
			await block.getByTestId( 'ignored' ).evaluate( ( el ) => el )
		);
		expect( ignoredChildElement ).toBe(
			await block.getByTestId( 'ignored-child' ).evaluate( ( el ) => el )
		);
	} );
} );
