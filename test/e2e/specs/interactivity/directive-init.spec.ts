/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'data-wp-init', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/directive-init' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/directive-init' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should run when the block renders', async ( { page } ) => {
		const el = page.getByTestId( 'single init' );
		await expect( el.getByTestId( 'isReady' ) ).toHaveText( 'true' );
		await expect( el.getByTestId( 'calls' ) ).toHaveText( '1' );
	} );

	test( 'should not run again if accessed signals change', async ( {
		page,
	} ) => {
		const el = page.getByTestId( 'single init' );
		await expect( el.getByTestId( 'isReady' ) ).toHaveText( 'true' );
		await el.getByRole( 'button' ).click();
		await expect( el.getByTestId( 'isReady' ) ).toHaveText( 'false' );
		await expect( el.getByTestId( 'calls' ) ).toHaveText( '1' );
	} );

	test( 'should run multiple inits if defined', async ( { page } ) => {
		const el = page.getByTestId( 'multiple inits' );
		await expect( el.getByTestId( 'isReady' ) ).toHaveText( 'true,true' );
		await expect( el.getByTestId( 'calls' ) ).toHaveText( '1,1' );
	} );

	test( 'should run the init callback when the element is unmounted', async ( {
		page,
	} ) => {
		const container = page.getByTestId( 'init show' );
		const show = container.getByTestId( 'show' );
		const toggle = container.getByTestId( 'toggle' );
		const isMounted = container.getByTestId( 'isMounted' );

		await expect( show ).toHaveText( 'Initially visible' );
		await expect( isMounted ).toHaveText( 'true' );

		await toggle.click();

		await expect( show ).toBeHidden();
		await expect( isMounted ).toHaveText( 'false' );
	} );

	test( 'should run init when the element is mounted', async ( { page } ) => {
		const container = page.getByTestId( 'init show' );
		const show = container.getByTestId( 'show' );
		const toggle = container.getByTestId( 'toggle' );
		const isMounted = container.getByTestId( 'isMounted' );

		await toggle.click();

		await expect( show ).toBeHidden();
		await expect( isMounted ).toHaveText( 'false' );

		await toggle.click();

		await expect( show ).toHaveText( 'Initially visible' );
		await expect( isMounted ).toHaveText( 'true' );
	} );
} );
