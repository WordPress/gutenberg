import { test, expect } from './fixtures';

test.describe( 'Router navigation lifecycle (state.navigating / state.initiator)', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		const link1 = await utils.addPostWithBlock( 'test/router-navigate', {
			alias: 'lifecycle - link 1',
			attributes: { title: 'Link 1' },
		} );
		const link2 = await utils.addPostWithBlock( 'test/router-navigate', {
			alias: 'lifecycle - link 2',
			attributes: { title: 'Link 2' },
		} );
		await utils.addPostWithBlock( 'test/router-navigate', {
			alias: 'lifecycle - main',
			attributes: { title: 'Main', links: [ link1, link2 ] },
		} );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'lifecycle - main' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'is false before any navigation happens', async ( { page } ) => {
		await expect( page.getByTestId( 'core router navigating' ) ).toHaveText(
			'false'
		);
	} );

	test( 'becomes true immediately and false once the new content is committed', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const link1 = utils.getLink( 'lifecycle - link 1' );
		const navigating = page.getByTestId( 'core router navigating' );
		const title = page.getByTestId( 'title' );

		let resolveRequest: () => void;
		const request = new Promise< void >( ( resolve ) => {
			resolveRequest = resolve;
		} );
		await page.route( link1, async () => {
			resolveRequest();
			await new Promise( () => {} ); // Never resolves on its own.
		} );

		await page.getByTestId( 'link 1' ).click();
		await request;

		// True immediately, with no 400ms delay unlike the deprecated
		// `navigation.hasStarted`.
		await expect( navigating ).toHaveText( 'true' );

		// Let the route through now that we've observed the in-flight state.
		await page.unroute( link1 );

		await expect( title ).toHaveText( 'Link 1' );
		await expect( navigating ).toHaveText( 'false' );
	} );

	test( 'auto-detects the initiator from the closest router region', async ( {
		page,
	} ) => {
		await page.getByTestId( 'link 1' ).click();
		await expect( page.getByTestId( 'title' ) ).toHaveText( 'Link 1' );
		await expect( page.getByTestId( 'core router initiator' ) ).toHaveText(
			'region-1'
		);
	} );

	test( 'an explicit initiator always wins over detection', async ( {
		page,
	} ) => {
		await page.getByTestId( 'link 1 with explicit initiator' ).click();
		await expect( page.getByTestId( 'title' ) ).toHaveText( 'Link 1' );
		await expect( page.getByTestId( 'core router initiator' ) ).toHaveText(
			'explicit-initiator'
		);
	} );

	test( 'an explicit null opts out of detection', async ( { page } ) => {
		await page.getByTestId( 'link 1 with null initiator' ).click();
		await expect( page.getByTestId( 'title' ) ).toHaveText( 'Link 1' );
		await expect( page.getByTestId( 'core router initiator' ) ).toHaveText(
			''
		);
	} );

	test( 'stays true across a superseded navigation and reflects the winner once settled', async ( {
		page,
		interactivityUtils: utils,
	} ) => {
		const link1 = utils.getLink( 'lifecycle - link 1' );
		const link2 = utils.getLink( 'lifecycle - link 2' );
		const navigating = page.getByTestId( 'core router navigating' );
		const title = page.getByTestId( 'title' );

		let resolveLink1: () => void;
		let resolveLink2: () => void;
		const link1Started = new Promise< void >( ( resolve ) => {
			resolveLink1 = resolve;
		} );
		const link2Started = new Promise< void >( ( resolve ) => {
			resolveLink2 = resolve;
		} );

		await page.route( link1, async () => {
			resolveLink1();
			await new Promise( () => {} );
		} );
		await page.route( link2, async () => {
			resolveLink2();
			await new Promise( () => {} );
		} );

		await page.getByTestId( 'link 1' ).click();
		await link1Started;
		await expect( navigating ).toHaveText( 'true' );

		// A second navigation starts before the first one settles. It should
		// supersede the first, taking over `initiator` without ever letting
		// `navigating` flicker back to false in between.
		await page.getByTestId( 'link 2' ).click();
		await link2Started;
		await expect( navigating ).toHaveText( 'true' );

		await page.unroute( link1 );
		await page.unroute( link2 );

		// Only the winner's content and initiator end up reflected, and the
		// cycle ends exactly once.
		await expect( title ).toHaveText( 'Link 2' );
		await expect( navigating ).toHaveText( 'false' );
	} );

	test( 'a back/forward restore produces a normal cycle with a null initiator', async ( {
		page,
	} ) => {
		await page.getByTestId( 'link 1' ).click();
		await expect( page.getByTestId( 'title' ) ).toHaveText( 'Link 1' );

		await page.goBack();

		await expect( page.getByTestId( 'title' ) ).toHaveText( 'Main' );
		await expect( page.getByTestId( 'core router navigating' ) ).toHaveText(
			'false'
		);
		await expect( page.getByTestId( 'core router initiator' ) ).toHaveText(
			''
		);
	} );
} );
