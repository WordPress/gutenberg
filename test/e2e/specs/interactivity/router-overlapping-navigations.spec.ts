import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

/**
 * Holds the response to a URL until the test releases it.
 *
 * @param page The Playwright page.
 * @param url  The URL whose response is held.
 * @return A promise of the request, and a function that releases the response.
 */
async function hold( page: Page, url: string ) {
	let request: () => void;
	let release: () => void;
	const requested = new Promise< void >(
		( resolve ) => ( request = resolve )
	);
	const released = new Promise< void >(
		( resolve ) => ( release = resolve )
	);
	await page.route( url, async ( route ) => {
		request();
		await released;
		await route.continue();
	} );
	return { requested, release: () => release() };
}

test.describe( 'Router overlapping navigations', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		// The only page that carries its own stylesheet.
		const x = await utils.addPostWithBlock(
			'test/router-overlapping-navigations',
			{
				alias: 'overlapping navigations - X',
				attributes: { page: 'X', stylesheet: true },
			}
		);
		const b = await utils.addPostWithBlock(
			'test/router-overlapping-navigations',
			{
				alias: 'overlapping navigations - B',
				attributes: { page: 'B', link: `${ x }#target` },
			}
		);
		await utils.addPostWithBlock( 'test/router-overlapping-navigations', {
			alias: 'overlapping navigations - A',
			attributes: { page: 'A', link: b },
		} );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'a navigation superseded by a Back press never reaches the page', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const aUrl = utils.getLink( 'overlapping navigations - A' );
		const xUrl = utils.getLink( 'overlapping navigations - X' );
		const color = () =>
			page
				.getByTestId( 'styled' )
				.evaluate( ( element ) => getComputedStyle( element ).color );

		await page.goto( aUrl );
		const titleA = await page.title();
		const colorA = await color();

		await page.getByTestId( 'link' ).click();
		await expect( page.getByTestId( 'page' ) ).toHaveText( 'B' );

		// Holds X's page until the Back press has ended.
		const x = await hold( page, xUrl );

		// The link leads to `X#target`.
		await page.getByTestId( 'link' ).click();
		await x.requested;
		await page.goBack();
		await expect( page.getByTestId( 'page' ) ).toHaveText( 'A' );

		x.release();

		// The superseded navigation has settled.
		await expect( page.getByTestId( 'resolved' ) ).toHaveText( /#target$/ );

		await expect( page.getByTestId( 'page' ) ).toHaveText( 'A' );
		await expect( page ).toHaveURL( aUrl );
		await expect( page ).toHaveTitle( titleA );
		await expect( page.getByTestId( 'server state' ) ).toHaveText( 'A' );
		await expect( page.getByTestId( 'server context' ) ).toHaveText( 'A' );
		expect( await color() ).toBe( colorA );
		expect( await page.evaluate( () => window.scrollY ) ).toBe( 0 );

		// The same navigation, when nothing supersedes it, changes everything
		// checked above.
		await page.unroute( xUrl );
		await page.getByTestId( 'link' ).click();
		await expect( page.getByTestId( 'page' ) ).toHaveText( 'B' );
		await page.getByTestId( 'link' ).click();
		await expect( page.getByTestId( 'page' ) ).toHaveText( 'X' );
		await expect( page ).toHaveURL( `${ xUrl }#target` );
		await expect( page ).not.toHaveTitle( titleA );
		await expect( page.getByTestId( 'server state' ) ).toHaveText( 'X' );
		await expect( page.getByTestId( 'server context' ) ).toHaveText( 'X' );
		await expect.poll( color ).not.toBe( colorA );
		await expect
			.poll( () => page.evaluate( () => window.scrollY ) )
			.toBeGreaterThan( 0 );
	} );

	test( 'an in-page link clicked while a navigation loads leaves that navigation to render', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const aUrl = utils.getLink( 'overlapping navigations - A' );
		const bUrl = utils.getLink( 'overlapping navigations - B' );
		await page.goto( aUrl );
		const b = await hold( page, bUrl );

		await page.getByTestId( 'link' ).click();
		await b.requested;
		await page.getByTestId( 'in-page link' ).click();

		await expect( page.getByTestId( 'router url' ) ).toHaveText(
			`${ aUrl }#target`
		);
		await expect( page ).toHaveURL( `${ aUrl }#target` );
		await expect( page.getByTestId( 'lifecycle' ) ).toHaveText(
			'idle undefined, navigating router-overlapping-navigations'
		);

		b.release();
		await expect( page.getByTestId( 'resolved' ) ).toHaveText( bUrl );

		await expect( page.getByTestId( 'page' ) ).toHaveText( 'B' );
		await expect( page.getByTestId( 'router url' ) ).toHaveText( bUrl );
		await expect( page ).toHaveURL( bUrl );
		await expect( page.getByTestId( 'lifecycle' ) ).toHaveText(
			'idle undefined, navigating router-overlapping-navigations, idle router-overlapping-navigations'
		);

		await page.goBack();
		await expect( page.getByTestId( 'page' ) ).toHaveText( 'A' );
		await expect( page ).toHaveURL( `${ aUrl }#target` );
	} );

	test( 'a Back press between two fragments of a page supersedes a navigation in flight', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const aUrl = utils.getLink( 'overlapping navigations - A' );
		const bUrl = utils.getLink( 'overlapping navigations - B' );
		await page.goto( aUrl );
		await page.getByTestId( 'in-page link' ).click();
		await expect( page ).toHaveURL( `${ aUrl }#target` );
		const b = await hold( page, bUrl );

		await page.getByTestId( 'link' ).click();
		await b.requested;
		await page.goBack();
		await expect( page.getByTestId( 'router url' ) ).toHaveText( aUrl );

		b.release();
		await expect( page.getByTestId( 'resolved' ) ).toHaveText( bUrl );

		await expect( page.getByTestId( 'page' ) ).toHaveText( 'A' );
		await expect( page ).toHaveURL( aUrl );
		await expect( page.getByTestId( 'lifecycle' ) ).toHaveText(
			/, idle null$/
		);
	} );
} );
