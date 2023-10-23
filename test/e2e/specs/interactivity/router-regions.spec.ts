/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Router regions', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		const next = await utils.addPostWithBlock( 'test/router-regions', {
			alias: 'router regions - page 2',
			attributes: { page: 2 },
		} );
		await utils.addPostWithBlock( 'test/router-regions', {
			alias: 'router regions - page 1',
			attributes: { page: 1, next },
		} );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'router regions - page 1' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should be the only part hydrated', async ( { page } ) => {
		const region1Text = page.getByTestId( 'region-1-text' );
		const region2Text = page.getByTestId( 'region-2-text' );
		const noRegionText1 = page.getByTestId( 'no-region-text-1' );
		const noRegionText2 = page.getByTestId( 'no-region-text-2' );

		await expect( region1Text ).toHaveText( 'hydrated' );
		await expect( region2Text ).toHaveText( 'hydrated' );
		await expect( noRegionText1 ).toHaveText( 'not hydrated' );
		await expect( noRegionText2 ).toHaveText( 'not hydrated' );
	} );

	test( 'should update after navigation', async ( { page } ) => {
		const region1Ssr = page.getByTestId( 'region-1-ssr' );
		const region2Ssr = page.getByTestId( 'region-2-ssr' );

		await expect( region1Ssr ).toHaveText( 'content from page 1' );
		await expect( region2Ssr ).toHaveText( 'content from page 1' );

		await page.getByTestId( 'next' ).click();

		await expect( region1Ssr ).toHaveText( 'content from page 2' );
		await expect( region2Ssr ).toHaveText( 'content from page 2' );

		await page.getByTestId( 'back' ).click();

		await expect( region1Ssr ).toHaveText( 'content from page 1' );
		await expect( region2Ssr ).toHaveText( 'content from page 1' );
	} );

	test( 'should preserve state across pages', async ( { page } ) => {
		const counter = page.getByTestId( 'state-counter' );
		await expect( counter ).toHaveText( '0' );

		await counter.click( { clickCount: 3, delay: 50 } );
		await expect( counter ).toHaveText( '3' );

		await page.getByTestId( 'next' ).click();
		await counter.click( { clickCount: 3, delay: 50 } );
		await expect( counter ).toHaveText( '6' );

		await page.getByTestId( 'back' ).click();
		await counter.click( { clickCount: 3, delay: 50 } );
		await expect( counter ).toHaveText( '9' );
	} );

	test( 'should preserve context across pages', async ( { page } ) => {
		const counter = page.getByTestId( 'context-counter' );
		await expect( counter ).toHaveText( '0' );

		await counter.click( { clickCount: 3, delay: 50 } );
		await expect( counter ).toHaveText( '3' );

		await page.getByTestId( 'next' ).click();
		await counter.click( { clickCount: 3, delay: 50 } );
		await expect( counter ).toHaveText( '6' );

		await page.getByTestId( 'back' ).click();
		await counter.click( { clickCount: 3, delay: 50 } );
		await expect( counter ).toHaveText( '9' );
	} );

	test( 'can be nested', async ( { page } ) => {
		const nestedRegionSsr = page.getByTestId( 'nested-region-ssr' );
		await expect( nestedRegionSsr ).toHaveText( 'content from page 1' );

		await page.getByTestId( 'next' ).click();
		await expect( nestedRegionSsr ).toHaveText( 'content from page 2' );

		await page.getByTestId( 'back' ).click();
		await expect( nestedRegionSsr ).toHaveText( 'content from page 1' );
	} );

	test( 'Page title is updated 2', async ( { page } ) => {
		await expect( page ).toHaveTitle(
			'router regions – page 1 – gutenberg'
		);
		await page.getByTestId( 'next' ).click();
		await expect( page ).toHaveTitle(
			'router regions – page 2 – gutenberg'
		);
		await page.getByTestId( 'back' ).click();
		await expect( page ).toHaveTitle(
			'router regions – page 1 – gutenberg'
		);
	} );
} );
