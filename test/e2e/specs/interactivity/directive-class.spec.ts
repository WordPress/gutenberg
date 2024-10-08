/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-class', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-class' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-class' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'remove class if callback returns falsy value', async ( {
		page,
	} ) => {
		const el = page.getByTestId(
			'remove class if callback returns falsy value'
		);
		await expect( el ).toHaveClass( 'bar' );
		await page.getByTestId( 'toggle falseValue' ).click();
		await expect( el ).toHaveClass( 'foo bar' );
		await page.getByTestId( 'toggle falseValue' ).click();
		await expect( el ).toHaveClass( 'bar' );
	} );

	test( 'add class if callback returns truthy value', async ( { page } ) => {
		const el = page.getByTestId(
			'add class if callback returns truthy value'
		);
		await expect( el ).toHaveClass( 'foo bar' );
		await page.getByTestId( 'toggle trueValue' ).click();
		await expect( el ).toHaveClass( 'foo' );
		await page.getByTestId( 'toggle trueValue' ).click();
		await expect( el ).toHaveClass( 'foo bar' );
	} );

	test( 'handles multiple classes and callbacks', async ( { page } ) => {
		const el = page.getByTestId( 'handles multiple classes and callbacks' );
		await expect( el ).toHaveClass( 'bar baz' );
		await page.getByTestId( 'toggle trueValue' ).click();
		await expect( el ).toHaveClass( '' );
		await page.getByTestId( 'toggle trueValue' ).click();
		await expect( el ).toHaveClass( 'bar baz' );
		await page.getByTestId( 'toggle falseValue' ).click();
		await expect( el ).toHaveClass( 'foo bar baz' );
		await page.getByTestId( 'toggle trueValue' ).click();
		await expect( el ).toHaveClass( 'foo' );
	} );

	test( 'handles class names that are contained inside other class names', async ( {
		page,
	} ) => {
		const el = page.getByTestId(
			'handles class names that are contained inside other class names'
		);
		await expect( el ).toHaveClass( 'foo-bar' );
		await page.getByTestId( 'toggle falseValue' ).click();
		await expect( el ).toHaveClass( 'foo foo-bar' );
		await page.getByTestId( 'toggle trueValue' ).click();
		await expect( el ).toHaveClass( 'foo' );
	} );

	test( 'can toggle class in the middle', async ( { page } ) => {
		const el = page.getByTestId( 'can toggle class in the middle' );
		await expect( el ).toHaveClass( 'foo bar baz' );
		await page.getByTestId( 'toggle trueValue' ).click();
		await expect( el ).toHaveClass( 'foo baz' );
		await page.getByTestId( 'toggle trueValue' ).click();
		await expect( el ).toHaveClass( 'foo bar baz' );
	} );

	test( 'can toggle class when class attribute is missing', async ( {
		page,
	} ) => {
		const el = page.getByTestId(
			'can toggle class when class attribute is missing'
		);
		await expect( el ).toHaveClass( '' );
		await page.getByTestId( 'toggle falseValue' ).click();
		await expect( el ).toHaveClass( 'foo' );
		await page.getByTestId( 'toggle falseValue' ).click();
		await expect( el ).toHaveClass( '' );
	} );

	test( 'can use context values', async ( { page } ) => {
		const el = page.getByTestId( 'can use context values' );
		await expect( el ).toHaveClass( '' );
		await page.getByTestId( 'toggle context false value' ).click();
		await expect( el ).toHaveClass( 'foo' );
		await page.getByTestId( 'toggle context false value' ).click();
		await expect( el ).toHaveClass( '' );
	} );

	test( 'can use BEM notation classes', async ( { page } ) => {
		const el = page.getByTestId( 'can use BEM notation classes' );
		await expect( el ).toHaveClass( 'block__element--modifier' );
	} );

	test( 'can use classes with several dashes', async ( { page } ) => {
		const el = page.getByTestId( 'can use classes with several dashes' );
		await expect( el ).toHaveClass( 'main-bg----color' );
	} );

	test( 'can use "default" as a class name', async ( { page } ) => {
		const el = page.getByTestId( 'class name default' );
		const btn = page.getByTestId( 'toggle class name default' );
		await expect( el ).not.toHaveClass( 'default' );
		await btn.click();
		await expect( el ).toHaveClass( 'default' );
		await btn.click();
		await expect( el ).not.toHaveClass( 'default' );
	} );
} );
