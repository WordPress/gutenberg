/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'directive function', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-function' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-function' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should support async directive registration', async ( { page } ) => {
		const element = page.getByTestId( 'async directive' );
		const button = page.getByTestId( 'load async directive' );

		const colors = {
			white: 'rgb(255, 255, 255)',
			magenta: 'rgb(255, 0, 255)',
			cyan: 'rgb(0, 255, 255)',
			yellow: 'rgb(255, 255, 0)',
		};

		await expect( element ).toHaveCSS(
			'background-color',
			'rgb(255, 255, 255)'
		);

		// Clicking the element with the async directive changes the background,
		// but it hasn't loaded yet. Nothing should happen.
		await element.click( { clickCount: 3 } );
		await expect( element ).toHaveCSS( 'background-color', colors.white );

		// Load the async directive.
		await button.click();

		// The element should now change the background color when clicked.
		await element.click();
		await expect( element ).toHaveCSS( 'background-color', colors.magenta );
		await element.click();
		await expect( element ).toHaveCSS( 'background-color', colors.cyan );
		await element.click();
		await expect( element ).toHaveCSS( 'background-color', colors.yellow );
		await element.click();
		await expect( element ).toHaveCSS( 'background-color', colors.white );
	} );

	test( 'should support async directive along with other directives', async ( {
		page,
	} ) => {
		const element = page.getByTestId( 'async directive with others' );
		const button = page.getByTestId( 'load async directive' );

		const colors = {
			white: 'rgb(255, 255, 255)',
			magenta: 'rgb(255, 0, 255)',
			cyan: 'rgb(0, 255, 255)',
			yellow: 'rgb(255, 255, 0)',
		};

		await expect( element ).toHaveText( '0' );
		await expect( element ).toHaveCSS(
			'background-color',
			'rgb(255, 255, 255)'
		);

		// Clicking the element with the async directive changes the background,
		// but it hasn't loaded yet. Only other directives should react.
		await element.click( { clickCount: 3 } );
		await expect( element ).toHaveText( '3' );
		await expect( element ).toHaveCSS( 'background-color', colors.white );

		// Load the async directive.
		await button.click();

		// The element should now change the background color when clicked.
		await element.click();
		await expect( element ).toHaveText( '4' );
		await expect( element ).toHaveCSS( 'background-color', colors.magenta );
		await element.click();
		await expect( element ).toHaveText( '5' );
		await expect( element ).toHaveCSS( 'background-color', colors.cyan );
		await element.click();
		await expect( element ).toHaveText( '6' );
		await expect( element ).toHaveCSS( 'background-color', colors.yellow );
		await element.click();
		await expect( element ).toHaveText( '7' );
		await expect( element ).toHaveCSS( 'background-color', colors.white );
	} );
} );
