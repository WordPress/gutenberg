/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-style', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-style' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-style' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'dont change style if callback returns same value on hydration', async ( {
		page,
	} ) => {
		const el = page.getByTestId(
			'dont change style if callback returns same value on hydration'
		);
		await expect( el ).toHaveAttribute(
			'style',
			'color: red; background: green;'
		);
	} );

	test( 'remove style if callback returns falsy value on hydration', async ( {
		page,
	} ) => {
		const el = page.getByTestId(
			'remove style if callback returns falsy value on hydration'
		);
		await expect( el ).toHaveAttribute( 'style', 'background: green;' );
	} );

	test( 'change style if callback returns a new value on hydration', async ( {
		page,
	} ) => {
		const el = page.getByTestId(
			'change style if callback returns a new value on hydration'
		);
		await expect( el ).toHaveAttribute(
			'style',
			'color: red; background: green;'
		);
	} );

	test( 'handles multiple styles and callbacks on hydration', async ( {
		page,
	} ) => {
		const el = page.getByTestId(
			'handles multiple styles and callbacks on hydration'
		);
		await expect( el ).toHaveAttribute(
			'style',
			'background: red; border: 2px solid yellow;'
		);
	} );

	test( 'can add style when style attribute is missing on hydration', async ( {
		page,
	} ) => {
		const el = page.getByTestId(
			'can add style when style attribute is missing on hydration'
		);
		await expect( el ).toHaveAttribute( 'style', 'color: red;' );
	} );

	test( 'can toggle style', async ( { page } ) => {
		const el = page.getByTestId( 'can toggle style' );
		await expect( el ).toHaveAttribute( 'style', 'color: red;' );
		await page.getByTestId( 'toggle color' ).click();
		await expect( el ).toHaveAttribute( 'style', 'color: blue;' );
	} );

	test( 'can remove style', async ( { page } ) => {
		const el = page.getByTestId( 'can remove style' );
		await expect( el ).toHaveAttribute( 'style', 'color: red;' );
		await page.getByTestId( 'switch color to false' ).click();
		await expect( el ).toHaveAttribute( 'style', '' );
	} );

	test( 'can toggle style in the middle', async ( { page } ) => {
		const el = page.getByTestId( 'can toggle style in the middle' );
		await expect( el ).toHaveAttribute(
			'style',
			'color: blue; background: red; border: 1px solid black;'
		);
		await page.getByTestId( 'toggle color' ).click();
		await expect( el ).toHaveAttribute(
			'style',
			'color: blue; background: blue; border: 1px solid black;'
		);
	} );

	test( 'handles styles names with hyphens', async ( { page } ) => {
		const el = page.getByTestId( 'handles styles names with hyphens' );
		await expect( el ).toHaveAttribute( 'style', 'background-color: red;' );
		await page.getByTestId( 'toggle color' ).click();
		await expect( el ).toHaveAttribute(
			'style',
			'background-color: blue;'
		);
	} );

	test( 'can use context values', async ( { page } ) => {
		const el = page.getByTestId( 'can use context values' );
		await expect( el ).toHaveAttribute( 'style', 'color: blue;' );
		await page.getByTestId( 'toggle context' ).click();
		await expect( el ).toHaveAttribute( 'style', 'color: red;' );
	} );
} );
