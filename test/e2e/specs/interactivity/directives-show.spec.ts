/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-show', () => {
	test.beforeEach( async ( { goToFile } ) => {
		await goToFile( 'directives-show.html' );
	} );

	test( 'show if callback returns truthy value', async ( { page } ) => {
		const el = page.getByTestId( 'show if callback returns truthy value' );
		await expect( el ).toBeVisible();
	} );

	test( 'do not show if callback returns falsy value', async ( { page } ) => {
		const el = page.getByTestId(
			'do not show if callback returns false value'
		);
		await expect( el ).toBeHidden();
	} );

	test( 'hide when toggling truthy value to falsy', async ( { page } ) => {
		const el = page.getByTestId( 'show if callback returns truthy value' );
		await expect( el ).toBeVisible();
		await page.getByTestId( 'toggle trueValue' ).click();
		await expect( el ).toBeHidden();
		await page.getByTestId( 'toggle trueValue' ).click();
		await expect( el ).toBeVisible();
	} );

	test( 'show when toggling false value to truthy', async ( { page } ) => {
		const el = page.getByTestId(
			'do not show if callback returns false value'
		);
		await expect( el ).toBeHidden();
		await page.getByTestId( 'toggle falseValue' ).click();
		await expect( el ).toBeVisible();
		await page.getByTestId( 'toggle falseValue' ).click();
		await expect( el ).toBeHidden();
	} );

	test( 'can use context values', async ( { page } ) => {
		const el = page.getByTestId( 'can use context values' );
		await expect( el ).toBeHidden();
		await page.getByTestId( 'toggle context false value' ).click();
		await expect( el ).toBeVisible();
		await page.getByTestId( 'toggle context false value' ).click();
		await expect( el ).toBeHidden();
	} );
} );
