/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'toVdom', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		await utils.addPostWithBlock( 'test/tovdom' );
	} );
	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'test/tovdom' ) );
	} );
	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'it should delete comments', async ( { page } ) => {
		const el = page.getByTestId( 'it should delete comments' );
		const c = await el.innerHTML();
		expect( c ).not.toContain( '##1##' );
		expect( c ).not.toContain( '##2##' );
		const el2 = page.getByTestId(
			'it should keep this node between comments'
		);
		await expect( el2 ).toBeVisible();
	} );

	test( 'it should delete processing instructions', async ( { page } ) => {
		const el = page.getByTestId(
			'it should delete processing instructions'
		);
		const c = await el.innerHTML();
		expect( c ).not.toContain( '##1##' );
		expect( c ).not.toContain( '##2##' );
		const el2 = page.getByTestId(
			'it should keep this node between processing instructions'
		);
		await expect( el2 ).toBeVisible();
	} );

	test( 'it should replace CDATA with text nodes', async ( { page } ) => {
		const el = page.getByTestId(
			'it should replace CDATA with text nodes'
		);
		const c = await el.innerHTML();
		expect( c ).toContain( '##1##' );
		expect( c ).toContain( '##2##' );
		const el2 = page.getByTestId(
			'it should keep this node between CDATA'
		);
		await expect( el2 ).toBeVisible();
	} );
} );
