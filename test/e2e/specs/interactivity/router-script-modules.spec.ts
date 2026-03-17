/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Router script modules', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		const alpha = await utils.addPostWithBlock(
			'test/router-script-modules-wrapper',
			{
				alias: 'alpha',
				innerBlocks: [ [ 'test/router-script-modules-alpha' ] ],
			}
		);
		const bravo = await utils.addPostWithBlock(
			'test/router-script-modules-wrapper',
			{
				alias: 'bravo',
				innerBlocks: [ [ 'test/router-script-modules-bravo' ] ],
			}
		);
		const charlie = await utils.addPostWithBlock(
			'test/router-script-modules-wrapper',
			{
				alias: 'charlie',
				innerBlocks: [ [ 'test/router-script-modules-charlie' ] ],
			}
		);

		const all = await utils.addPostWithBlock(
			'test/router-script-modules-wrapper',
			{
				alias: 'all',
				innerBlocks: [
					[ 'test/router-script-modules-alpha' ],
					[ 'test/router-script-modules-bravo' ],
					[ 'test/router-script-modules-charlie' ],
				],
			}
		);

		await utils.addPostWithBlock( 'test/router-script-modules-wrapper', {
			alias: 'none',
			attributes: { links: { alpha, bravo, charlie, all } },
		} );
	} );

	test.beforeEach( async ( { page, interactivityUtils: utils } ) => {
		await page.goto( utils.getLink( 'none' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	for ( const [ testId, buttonId, expectedValues ] of [
		[
			'static modules from new blocks',
			'static',
			{ alpha: 'alpha-1', bravo: 'bravo-1', charlie: 'charlie-1' },
		],
		[
			'dynamic modules from new blocks',
			'dynamic',
			{ alpha: 'alpha-2', bravo: 'bravo-2', charlie: 'charlie-2' },
		],
		[
			'static modules from initial page',
			'initial-static',
			{ alpha: 'initial-1', bravo: 'initial-1', charlie: 'initial-1' },
		],
		[
			'dynamic modules from initial page',
			'initial-dynamic',
			{ alpha: 'initial-2', bravo: 'initial-2', charlie: 'initial-2' },
		],
	] as const ) {
		test( `should handle ${ testId }`, async ( { page } ) => {
			const requestedModules = [];

			await page.route( '**/*.js*', async ( route ) => {
				requestedModules.push( route.request().url() );
				await route.continue();
			} );

			const csn = page.getByTestId( 'client-side navigation' );
			const alpha = page.getByTestId( 'alpha-block' );
			const bravo = page.getByTestId( 'bravo-block' );
			const charlie = page.getByTestId( 'charlie-block' );

			await page.getByTestId( 'link alpha' ).click();

			// This element disappears when a navigation starts.
			await expect( csn ).toBeHidden();

			// Check the page title to ensure navigation was successful.
			await expect( page ).toHaveTitle( 'alpha – gutenberg' );

			// This should be visible again after a successful client-side
			// navigation.
			await expect( csn ).toBeVisible();

			await expect( alpha ).toBeVisible();
			await expect( bravo ).toBeHidden();
			await expect( charlie ).toBeHidden();
			await expect( alpha.getByTestId( 'text' ) ).toHaveText( 'alpha' );

			// This click executes an action that does a dynamic import and
			// modifies the block text.
			await alpha.getByTestId( buttonId ).click();
			await expect( alpha.getByTestId( 'text' ) ).toHaveText(
				expectedValues.alpha
			);

			await page.getByTestId( 'link bravo' ).click();

			await expect( csn ).toBeHidden();
			await expect( page ).toHaveTitle( 'bravo – gutenberg' );
			await expect( csn ).toBeVisible();

			await expect( alpha ).toBeHidden();
			await expect( bravo ).toBeVisible();
			await expect( charlie ).toBeHidden();

			await bravo.getByTestId( buttonId ).click();
			await expect( bravo.getByTestId( 'text' ) ).toHaveText(
				expectedValues.bravo
			);

			await page.getByTestId( 'link charlie' ).click();

			await expect( csn ).toBeHidden();
			await expect( page ).toHaveTitle( 'charlie – gutenberg' );
			await expect( csn ).toBeVisible();

			await expect( alpha ).toBeHidden();
			await expect( bravo ).toBeHidden();
			await expect( charlie ).toBeVisible();

			await charlie.getByTestId( buttonId ).click();
			await expect( charlie.getByTestId( 'text' ) ).toHaveText(
				expectedValues.charlie
			);

			await page.getByTestId( 'link all' ).click();

			await expect( csn ).toBeHidden();
			await expect( page ).toHaveTitle( 'all – gutenberg' );
			await expect( csn ).toBeVisible();

			await expect( alpha ).toBeVisible();
			await expect( bravo ).toBeVisible();
			await expect( charlie ).toBeVisible();

			await expect( alpha.getByTestId( 'text' ) ).toHaveText(
				expectedValues.alpha
			);
			await expect( bravo.getByTestId( 'text' ) ).toHaveText(
				expectedValues.bravo
			);
			await expect( charlie.getByTestId( 'text' ) ).toHaveText(
				expectedValues.charlie
			);
		} );
	}
} );
