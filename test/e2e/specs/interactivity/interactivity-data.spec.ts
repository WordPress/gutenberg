/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'store tag', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/store-tag {"condition":"ok"}' );
		await utils.addPostWithBlock(
			'test/store-tag {"condition":"missing"}'
		);
		await utils.addPostWithBlock(
			'test/store-tag {"condition":"corrupted-json"}'
		);
		await utils.addPostWithBlock(
			'test/store-tag {"condition":"invalid-state"}'
		);
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'hydrates when it is well defined', async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		const block = 'test/store-tag {"condition":"ok"}';
		await page.goto( utils.getLink( block ) );

		const value = page.getByTestId( 'counter value' );
		const double = page.getByTestId( 'counter double' );
		const clicks = page.getByTestId( 'counter clicks' );

		await expect( value ).toHaveText( '3' );
		await expect( double ).toHaveText( '6' );
		await expect( clicks ).toHaveText( '0' );

		await page.getByTestId( 'counter button' ).click();

		await expect( value ).toHaveText( '4' );
		await expect( double ).toHaveText( '8' );
		await expect( clicks ).toHaveText( '1' );
	} );

	test( 'does not break the page when missing', async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		const block = 'test/store-tag {"condition":"missing"}';
		await page.goto( utils.getLink( block ) );

		const clicks = page.getByTestId( 'counter clicks' );
		await expect( clicks ).toHaveText( '0' );
		await page.getByTestId( 'counter button' ).click();
		await expect( clicks ).toHaveText( '1' );
	} );

	test( 'does not break the page when corrupted', async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		const block = 'test/store-tag {"condition":"corrupted-json"}';
		await page.goto( utils.getLink( block ) );

		const clicks = page.getByTestId( 'counter clicks' );
		await expect( clicks ).toHaveText( '0' );
		await page.getByTestId( 'counter button' ).click();
		await expect( clicks ).toHaveText( '1' );
	} );

	test( 'does not break the page when it contains an invalid state', async ( {
		interactivityUtils: utils,
		page,
	} ) => {
		const block = 'test/store-tag {"condition":"invalid-state"}';
		await page.goto( utils.getLink( block ) );

		const clicks = page.getByTestId( 'counter clicks' );
		await expect( clicks ).toHaveText( '0' );
		await page.getByTestId( 'counter button' ).click();
		await expect( clicks ).toHaveText( '1' );
	} );
} );
