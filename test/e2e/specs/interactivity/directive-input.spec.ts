/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-input', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-input' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-input' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should bind text input value to state', async ( { page } ) => {
		const output = page.getByTestId( 'text-output' );
		const input = page.getByTestId( 'text-input' );

		await expect( output ).toHaveText( 'hello' );
		await input.fill( 'world' );
		await expect( output ).toHaveText( 'world' );
	} );

	test( 'should bind checkbox checked to state', async ( { page } ) => {
		const output = page.getByTestId( 'checkbox-output' );
		const input = page.getByTestId( 'checkbox-input' );

		await expect( output ).toHaveText( 'false' );
		await input.check();
		await expect( output ).toHaveText( 'true' );
		await input.uncheck();
		await expect( output ).toHaveText( 'false' );
	} );

	test( 'should preserve number type for number inputs', async ( {
		page,
	} ) => {
		const output = page.getByTestId( 'number-output' );
		const input = page.getByTestId( 'number-input' );

		await expect( output ).toHaveText( '0' );
		await input.fill( '42' );
		await expect( output ).toHaveText( '42' );
	} );

	test( 'should bind select element value to state', async ( { page } ) => {
		const output = page.getByTestId( 'select-output' );
		const input = page.getByTestId( 'select-input' );

		await expect( output ).toHaveText( 'dog' );
		await input.selectOption( 'cat' );
		await expect( output ).toHaveText( 'cat' );
	} );
} );
