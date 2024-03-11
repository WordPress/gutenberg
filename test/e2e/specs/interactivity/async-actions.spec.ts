/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'async actions', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/generator-scope' );
	} );
	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/generator-scope' ) );
	} );
	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'Promise generator callbacks should restore scope on resolve and reject', async ( {
		page,
	} ) => {
		const resultInput = page.getByTestId( 'result' );
		await expect( resultInput ).toHaveValue( '' );

		await page.getByTestId( 'resolve' ).click();
		await expect( resultInput ).toHaveValue( 'ok' );

		await page.getByTestId( 'reject' ).click();
		await expect( resultInput ).toHaveValue( 'Error: 😘' );
	} );
} );
