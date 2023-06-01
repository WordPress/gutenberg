/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'negation-operator', () => {
	test.beforeEach( async ( { goToFile } ) => {
		await goToFile( 'negation-operator.html' );
	} );

	test( 'add hidden attribute when !state.active', async ( { page } ) => {
		const el = page.getByTestId(
			'add hidden attribute if state is not active'
		);

		await expect( el ).toHaveAttribute( 'hidden', '' );
		await page.getByTestId( 'toggle active value' ).click();
		await expect( el ).not.toHaveAttribute( 'hidden', '' );
		await page.getByTestId( 'toggle active value' ).click();
		await expect( el ).toHaveAttribute( 'hidden', '' );
	} );

	test( 'add hidden attribute when !selectors.active', async ( { page } ) => {
		const el = page.getByTestId(
			'add hidden attribute if selector is not active'
		);

		await expect( el ).toHaveAttribute( 'hidden', '' );
		await page.getByTestId( 'toggle active value' ).click();
		await expect( el ).not.toHaveAttribute( 'hidden', '' );
		await page.getByTestId( 'toggle active value' ).click();
		await expect( el ).toHaveAttribute( 'hidden', '' );
	} );
} );
