/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'deferred store', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/deferred-store' );
	} );
	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/deferred-store' ) );
	} );
	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'Ensure that a store can be subscribed to before it is initialized', async ( {
		page,
	} ) => {
		const resultInput = page.getByTestId( 'result' );
		await expect( resultInput ).toHaveText( '' );
		await page.evaluate( () => {
			window.dispatchEvent( new Event( '_test_proceed_' ) );
		} );
		await expect( resultInput ).toHaveText( 'Hello, world!' );
	} );

	test( 'Ensure that a state getter can be subscribed to before it is initialized', async ( {
		page,
	} ) => {
		const resultInput = page.getByTestId( 'result-getter' );
		await expect( resultInput ).toHaveText( '' );
		await page.evaluate( () => {
			window.dispatchEvent( new Event( '_test_proceed_' ) );
		} );
		await expect( resultInput ).toHaveText( 'Hello, world!' );
	} );

	test( 'Ensure that a state getter can access the returned state even when directives already subscribed to it', async ( {
		page,
	} ) => {
		const stateNumber = page.getByTestId( 'state-number' );
		const stateDouble = page.getByTestId( 'state-double' );
		await expect( stateNumber ).toHaveText( '2' );
		await expect( stateDouble ).toHaveText( '4' );
		await page.evaluate( () => {
			window.dispatchEvent( new Event( '_test_proceed_' ) );
		} );
		await expect( stateNumber ).toHaveText( '3' );
		await expect( stateDouble ).toHaveText( '6' );
	} );

	test( 'Ensure bind keeps the value of a derived state props from deferred store', async ( {
		page,
	} ) => {
		const load = page.getByTestId( 'derived-bind-load' );
		const loaded = page.getByTestId( 'derived-bind-loaded' );
		const hydrated = page.getByTestId( 'derived-bind-hydrated' );
		const increment = page.getByTestId( 'derived-bind-increment' );
		const value = page.getByTestId( 'derived-bind-value' );

		await expect( hydrated ).toBeVisible();
		await expect( loaded ).toBeHidden();
		await expect( value ).toHaveValue( 'bind-42' );

		// The `+` button doesn't work yet; nothing changes.
		await increment.click();
		await expect( loaded ).toBeHidden();
		await expect( value ).toHaveValue( 'bind-42' );

		// The element displays the derived state prop's value from the getter.
		await load.click();
		await expect( loaded ).toBeVisible();
		await expect( value ).toHaveValue( 'bind-42' );

		// The button works, and the value updated.
		await increment.click();
		await expect( loaded ).toBeVisible();
		await expect( value ).toHaveValue( 'bind-43' );
	} );

	test( 'Ensure class keeps the value of a derived state props from deferred store', async ( {
		page,
	} ) => {
		const load = page.getByTestId( 'derived-class-load' );
		const loaded = page.getByTestId( 'derived-class-loaded' );
		const hydrated = page.getByTestId( 'derived-class-hydrated' );
		const increment = page.getByTestId( 'derived-class-increment' );
		const element = page.getByTestId( 'derived-class-element' );

		await expect( hydrated ).toBeVisible();
		await expect( loaded ).toBeHidden();
		await expect( element ).toHaveClass( 'below-10' );

		// The `increment` button doesn't work yet; nothing changes.
		await increment.click();
		await expect( loaded ).toBeHidden();
		await expect( element ).toHaveClass( 'below-10' );

		// The element class disappears according to the computed getter.
		await load.click();
		await expect( loaded ).toBeVisible();
		await expect( element ).toHaveClass( 'below-10' );

		// The button works, and the class updated.
		await increment.click();
		await expect( loaded ).toBeVisible();
		await expect( element ).not.toHaveClass( 'below-10' );
	} );
} );
