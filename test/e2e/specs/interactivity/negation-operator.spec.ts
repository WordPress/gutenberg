/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'negation-operator', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/negation-operator' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/negation-operator' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
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
