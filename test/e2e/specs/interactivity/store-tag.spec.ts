/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'store tag', () => {
	test( 'hydrates when it is well defined', async ( { goToFile, page } ) => {
		await goToFile( 'store-tag-ok.html' );

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
		goToFile,
		page,
	} ) => {
		await goToFile( 'store-tag-missing.html' );

		const clicks = page.getByTestId( 'counter clicks' );
		await expect( clicks ).toHaveText( '0' );
		await page.getByTestId( 'counter button' ).click();
		await expect( clicks ).toHaveText( '1' );
	} );

	test( 'does not break the page when corrupted', async ( {
		goToFile,
		page,
	} ) => {
		await goToFile( 'store-tag-corrupted-json.html' );

		const clicks = page.getByTestId( 'counter clicks' );
		await expect( clicks ).toHaveText( '0' );
		await page.getByTestId( 'counter button' ).click();
		await expect( clicks ).toHaveText( '1' );
	} );

	test( 'does not break the page when it contains an invalid state', async ( {
		goToFile,
		page,
	} ) => {
		await goToFile( 'store-tag-invalid-state.html' );

		const clicks = page.getByTestId( 'counter clicks' );
		await expect( clicks ).toHaveText( '0' );
		await page.getByTestId( 'counter button' ).click();
		await expect( clicks ).toHaveText( '1' );
	} );
} );
