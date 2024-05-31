/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Namespaces', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test-namespace/directive-bind' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test-namespace/directive-bind' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'Empty string as namespace should not work', async ( { page } ) => {
		const el = page.getByTestId( 'empty namespace' );
		await expect( el ).not.toHaveAttribute( 'href', '/empty-string-url' );
	} );

	test( 'A string as namespace should work', async ( { page } ) => {
		const el = page.getByTestId( 'correct namespace' );
		await expect( el ).toHaveAttribute( 'href', '/namespace-url' );
	} );

	test( 'An empty object as namespace should not work', async ( {
		page,
	} ) => {
		const el = page.getByTestId( 'object namespace' );
		await expect( el ).not.toHaveAttribute( 'href', '/object-url' );
	} );

	test( 'A wrong namespace should not break the runtime', async ( {
		page,
	} ) => {
		const el = page.getByTestId( 'object namespace' );
		await expect( el ).not.toHaveAttribute( 'href', '/namespace-url' );
		const correct = page.getByTestId( 'correct namespace' );
		await expect( correct ).toHaveAttribute( 'href', '/namespace-url' );
	} );

	test( 'A different store namespace should work', async ( { page } ) => {
		const el = page.getByTestId( 'other namespace' );
		await expect( el ).toHaveAttribute( 'href', '/other-store-url' );
	} );

	test( 'A number as a string as namespace should work', async ( {
		page,
	} ) => {
		const el = page.getByTestId( 'number namespace' );
		await expect( el ).toHaveAttribute( 'href', '/number-url' );
	} );

	test( 'A null as a string as namespace should work', async ( { page } ) => {
		const el = page.getByTestId( 'null namespace' );
		await expect( el ).toHaveAttribute( 'href', '/null-url' );
	} );

	test( 'A true as a string as namespace should work', async ( { page } ) => {
		const el = page.getByTestId( 'true namespace' );
		await expect( el ).toHaveAttribute( 'href', '/true-url' );
	} );

	test( 'A false as a string as namespace should work', async ( {
		page,
	} ) => {
		const el = page.getByTestId( 'false namespace' );
		await expect( el ).toHaveAttribute( 'href', '/false-url' );
	} );

	test( 'A [] as a string as namespace should work', async ( { page } ) => {
		const el = page.getByTestId( '[] namespace' );
		await expect( el ).toHaveAttribute( 'href', '/array-url' );
	} );

	test( 'A "quoted string" as a string as namespace should work', async ( {
		page,
	} ) => {
		const el = page.getByTestId( 'quoted namespace' );
		await expect( el ).toHaveAttribute( 'href', '/quoted-url' );
	} );
} );
