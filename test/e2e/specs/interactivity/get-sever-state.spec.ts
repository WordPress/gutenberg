/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'getServerState()', () => {
	test.beforeAll( async ( { interactivityUtils: utils } ) => {
		await utils.activatePlugins();
		const link1 = await utils.addPostWithBlock( 'test/get-server-state', {
			alias: 'getServerState() - link 1',
			attributes: {
				state: {
					prop: 'link 1',
					newProp: 'link 1',
					nested: {
						prop: 'link 1',
						newProp: 'link 1',
					},
					nonChanging: 'modified from server',
					onlyInLink1: 'only in link 1',
				},
			},
		} );
		const link2 = await utils.addPostWithBlock( 'test/get-server-state', {
			alias: 'getServerState() - link 2',
			attributes: {
				state: {
					prop: 'link 2',
					newProp: 'link 2',
					nested: {
						prop: 'link 2',
						newProp: 'link 2',
					},
					nonChanging: 'modified from server',
				},
			},
		} );
		const link3 = await utils.addPostWithBlock( 'test/get-server-state', {
			alias: 'getServerState() - link 3',
			attributes: {},
		} );
		await utils.addPostWithBlock( 'test/get-server-state', {
			alias: 'getServerState() - main',
			attributes: {
				title: 'Main',
				links: [ link1, link2, link3 ],
				state: {
					prop: 'main',
					nested: {
						prop: 'main',
					},
					nonChanging: 'modified from server',
					onlyInMain: 'only in main',
				},
			},
		} );
	} );

	test.beforeEach( async ( { interactivityUtils: utils, page } ) => {
		await page.goto( utils.getLink( 'getServerState() - main' ) );
	} );

	test.afterAll( async ( { interactivityUtils: utils } ) => {
		await utils.deactivatePlugins();
		await utils.deleteAllPosts();
	} );

	test( 'should update existing state props on navigation', async ( {
		page,
	} ) => {
		const prop = page.getByTestId( 'prop' );
		const nestedProp = page.getByTestId( 'nested.prop' );

		await expect( page ).toHaveTitle( /main/ );
		await expect( prop ).toHaveText( 'main' );
		await expect( nestedProp ).toHaveText( 'main' );

		await page.getByTestId( 'link 1' ).click();
		await expect( page ).toHaveTitle( /link 1/ );

		await expect( prop ).toHaveText( 'link 1' );
		await expect( nestedProp ).toHaveText( 'link 1' );

		await page.goBack();
		await expect( page ).toHaveTitle( /main/ );

		await expect( prop ).toHaveText( 'main' );
		await expect( nestedProp ).toHaveText( 'main' );

		await page.getByTestId( 'link 2' ).click();
		await expect( page ).toHaveTitle( /link 2/ );

		await expect( prop ).toHaveText( 'link 2' );
		await expect( nestedProp ).toHaveText( 'link 2' );
	} );

	test( 'should add new state props and keep them on navigation', async ( {
		page,
	} ) => {
		const newProp = page.getByTestId( 'newProp' );
		const nestedNewProp = page.getByTestId( 'nested.newProp' );

		await expect( page ).toHaveTitle( /main/ );
		await expect( newProp ).toBeEmpty();
		await expect( nestedNewProp ).toBeEmpty();

		await page.getByTestId( 'link 1' ).click();
		await expect( page ).toHaveTitle( /link 1/ );

		await expect( newProp ).toHaveText( 'link 1' );
		await expect( nestedNewProp ).toHaveText( 'link 1' );

		await page.goBack();
		await expect( page ).toHaveTitle( /main/ );

		await expect( newProp ).toHaveText( 'link 1' );
		await expect( nestedNewProp ).toHaveText( 'link 1' );

		await page.getByTestId( 'link 2' ).click();
		await expect( page ).toHaveTitle( /link 2/ );

		await expect( newProp ).toHaveText( 'link 2' );
		await expect( nestedNewProp ).toHaveText( 'link 2' );
	} );

	test( 'should prevent any manual modifications', async ( { page } ) => {
		const prop = page.getByTestId( 'prop' );
		const button = page.getByTestId( 'tryToModifyServerState' );

		await expect( prop ).toHaveText( 'main' );
		await expect( button ).toHaveText( 'modify' );

		await button.click();

		await expect( prop ).toHaveText( 'main' );
		await expect( button ).toHaveText( 'not modified ✅' );
	} );

	test( 'should overwrite non-changing props on navigation', async ( {
		page,
	} ) => {
		const nonChanging = page.getByTestId( 'nonChanging' );
		const button = page.getByTestId( 'updateNonChanging' );

		await expect( page ).toHaveTitle( /main/ );
		await expect( nonChanging ).toHaveText( 'modified from server' );

		await button.click();

		await expect( nonChanging ).toHaveText( 'modified from client' );

		await page.getByTestId( 'link 1' ).click();
		await expect( page ).toHaveTitle( /link 1/ );

		// The prop is overwritten on navigation.
		await expect( nonChanging ).toHaveText( 'modified from server' );

		await button.click();

		await expect( nonChanging ).toHaveText( 'modified from client' );

		await page.goBack();
		await expect( page ).toHaveTitle( /main/ );

		// The prop is overwritten on navigation.
		await expect( nonChanging ).toHaveText( 'modified from server' );
	} );

	test( 'should handle props only existing in some pages', async ( {
		page,
	} ) => {
		const onlyInMain = page.getByTestId( 'onlyInMain' );
		const onlyInLink1 = page.getByTestId( 'onlyInLink1' );

		await expect( onlyInMain ).toHaveText( 'only in main' );
		await expect( onlyInLink1 ).toBeEmpty();

		await page.getByTestId( 'link 1' ).click();
		await expect( page ).toHaveTitle( /link 1/ );

		await expect( onlyInMain ).toBeEmpty();
		await expect( onlyInLink1 ).toHaveText( 'only in link 1' );

		await page.goBack();
		await expect( page ).toHaveTitle( /main/ );

		await expect( onlyInMain ).toHaveText( 'only in main' );
		await expect( onlyInLink1 ).toBeEmpty();

		await page.getByTestId( 'link 2' ).click();
		await expect( page ).toHaveTitle( /link 2/ );

		await expect( onlyInMain ).toBeEmpty();
		await expect( onlyInLink1 ).toBeEmpty();
	} );

	test( 'should reset server state when navigating to a page without state', async ( {
		page,
	} ) => {
		const prop = page.getByTestId( 'prop' );
		const nestedProp = page.getByTestId( 'nested.prop' );

		await expect( page ).toHaveTitle( /main/ );
		await expect( prop ).toHaveText( 'main' );
		await expect( nestedProp ).toHaveText( 'main' );

		await page.getByTestId( 'link 3' ).click();
		await expect( page ).toHaveTitle( /link 3/ );

		await expect( prop ).toBeEmpty();
		await expect( nestedProp ).toBeEmpty();
	} );
} );
