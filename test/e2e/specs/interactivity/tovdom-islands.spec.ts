/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'toVdom - islands', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/tovdom-islands' );
	} );
	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/tovdom-islands' ) );
	} );
	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'directives that are not inside islands should not be hydrated', async ( {
		page,
	} ) => {
		const el = page.getByTestId( 'not inside an island' );
		await expect( el ).toBeVisible();
	} );

	test( 'directives that are inside islands should be hydrated', async ( {
		page,
	} ) => {
		const el = page.getByTestId( 'inside an island' );
		await expect( el ).toBeHidden();
	} );

	test( 'directives that are inside inner blocks of isolated islands should not be hydrated', async ( {
		page,
	} ) => {
		const el = page.getByTestId(
			'inside an inner block of an isolated island'
		);
		await expect( el ).toBeVisible();
	} );

	test( 'directives inside islands should not be hydrated twice', async ( {
		page,
	} ) => {
		const el = page.getByTestId( 'island inside another island' );
		const templates = el.locator( 'template' );
		await expect( templates ).toHaveCount( 1 );
	} );

	test( 'islands inside inner blocks of isolated islands should be hydrated', async ( {
		page,
	} ) => {
		const el = page.getByTestId(
			'island inside inner block of isolated island'
		);
		await expect( el ).toBeHidden();
	} );

	test( 'islands should recover their namespace if an inner island has changed it', async ( {
		page,
	} ) => {
		const el = page.getByTestId( 'directive after different namespace' );
		await expect( el ).toBeHidden();
	} );
} );
