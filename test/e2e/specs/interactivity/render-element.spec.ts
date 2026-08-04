/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'renderElement', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/render-element' );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/render-element' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'inserted plain fragment is fully interactive and inherits the island context', async ( {
		page,
	} ) => {
		const counter = page.getByTestId( 'counter' );
		await expect( counter ).toHaveCount( 0 );

		await page.getByTestId( 'load' ).click();

		await expect( counter ).toBeVisible();
		await expect( counter ).toHaveText( '0' );

		// The fragment's counter reads the island's context.
		await counter.click();
		await expect( counter ).toHaveText( '1' );

		await counter.click();
		await expect( counter ).toHaveText( '2' );

		// The island's own element must react to the fragment's write-through.
		await expect( page.getByTestId( 'block-count' ) ).toHaveText( '2' );

		await expect( page.getByTestId( 'hydrated' ) ).toBeVisible();
	} );

	test( 'inserted self-contained island fragment is fully interactive', async ( {
		page,
	} ) => {
		const counter = page.getByTestId( 'island-counter' );
		await expect( counter ).toHaveCount( 0 );

		await page.getByTestId( 'load-island' ).click();

		await expect( counter ).toBeVisible();
		await expect( counter ).toHaveText( '0' );

		// The self-contained fragment has its own context, so it does not
		// affect the enclosing island's context.
		await counter.click();
		await expect( counter ).toHaveText( '1' );
		await expect( page.getByTestId( 'block-count' ) ).toHaveText( '0' );

		await expect( page.getByTestId( 'hydrated' ) ).toBeVisible();
	} );
} );
