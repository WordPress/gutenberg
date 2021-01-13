/**
 * WordPress dependencies
 */
import {
	createJSONResponse,
	setUpResponseMocking,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useExperimentalFeatures } from '../../experimental-features';
import menuItemsFixture from './fixtures/menu-items-response-fixture.json';

const menusFixture = [
	{
		name: 'Test Menu 1',
		slug: 'test-menu-1',
	},
	{
		name: 'Test Menu 2',
		slug: 'test-menu-2',
	},
	{
		name: 'Test Menu 3',
		slug: 'test-menu-3',
	},
];

// Matching against variations of the same URL encoded and non-encoded
// produces the most reliable mocking.
const REST_MENUS_ROUTES = [
	'/__experimental/menus',
	`rest_route=${ encodeURIComponent( '/__experimental/menus' ) }`,
];
const REST_MENU_ITEMS_ROUTES = [
	'/__experimental/menu-items',
	`rest_route=${ encodeURIComponent( '/__experimental/menu-items' ) }`,
];

/**
 * Determines if a given URL matches any of a given collection of
 * routes (extressed as substrings).
 *
 * @param {string} reqUrl the full URL to be tested for matches.
 * @param {Array} routes array of strings to match against the URL.
 */
function matchUrlToRoute( reqUrl, routes ) {
	return routes.some( ( route ) => reqUrl.includes( route ) );
}

/**
 * Creates mocked REST API responses for calls to menus and menu-items
 * endpoints.
 * Note: this needs to be within a single call to
 * `setUpResponseMocking` as you can only setup response mocking once per test run.
 *
 * @param {Array} menus menus to provide as mocked responses to menus entity API requests.
 * @param {Array} menuItems menu items to provide as mocked responses to menu-items entity API requests.
 */
async function mockAllMenusResponses(
	menus = menusFixture,
	menuItems = menuItemsFixture
) {
	const mappedMenus = menus.length
		? menus.map( ( menu, index ) => ( {
				...menu,
				id: index + 1,
		  } ) )
		: [];

	await setUpResponseMocking( [
		{
			match: ( request ) =>
				matchUrlToRoute( request.url(), REST_MENUS_ROUTES ),
			onRequestMatch: createJSONResponse( mappedMenus ),
		},
		{
			match: ( request ) =>
				matchUrlToRoute( request.url(), REST_MENU_ITEMS_ROUTES ),
			onRequestMatch: createJSONResponse( menuItems ),
		},
	] );
}

async function visitNavigationEditor() {
	const query = addQueryArgs( '', {
		page: 'gutenberg-navigation',
	} );
	await visitAdminPage( '/admin.php', query );
}

async function getSerializedBlocks() {
	return page.evaluate( () =>
		wp.blocks.serialize( wp.data.select( 'core/block-editor' ).getBlocks() )
	);
}

describe( 'Navigation editor', () => {
	useExperimentalFeatures( [ '#gutenberg-navigation' ] );

	afterEach( async () => {
		await setUpResponseMocking( [] );
	} );

	it( 'displays the first menu from the REST response when at least one menu exists', async () => {
		await mockAllMenusResponses();
		await visitNavigationEditor();

		// Wait for the header to show the menu name.
		await page.waitForXPath( '//h2[contains(., "Editing: Test Menu 1")]' );

		expect( await getSerializedBlocks() ).toMatchSnapshot();
	} );
} );
