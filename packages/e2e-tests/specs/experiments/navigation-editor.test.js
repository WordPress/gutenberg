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

const pagesFixture = [
	{
		title: 'Home',
		slug: 'home',
	},
	{
		title: 'About',
		slug: 'about',
	},
	{
		title: 'Contact',
		slug: 'contact',
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
const REST_PAGES_ROUTES = [
	'/wp/v2/pages',
	`rest_route=${ encodeURIComponent( '/wp/v2/pages' ) }`,
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

function getEndpointMocks(
	matchingRoutes,
	responsesByMethod,
	processor = ( data ) => data
) {
	return [ 'GET', 'POST', 'DELETE', 'PUT' ].reduce( ( mocks, restMethod ) => {
		if ( responsesByMethod[ restMethod ] ) {
			return [
				...mocks,
				{
					match: ( request ) =>
						matchUrlToRoute( request.url(), matchingRoutes ) &&
						request.method() === restMethod,
					onRequestMatch: createJSONResponse(
						processor( responsesByMethod[ restMethod ] )
					),
				},
			];
		}

		return mocks;
	}, [] );
}

function getMenuMocks( responsesByMethod ) {
	const assignMenuIds = ( menus ) =>
		menus.length
			? menus.map( ( menu, index ) => ( {
					...menu,
					id: index + 1,
			  } ) )
			: [];

	return getEndpointMocks(
		REST_MENUS_ROUTES,
		responsesByMethod,
		assignMenuIds
	);
}

function getMenuItemMocks( responsesByMethod ) {
	return getEndpointMocks( REST_MENU_ITEMS_ROUTES, responsesByMethod );
}

function getPagesMocks( responsesByMethod ) {
	const buildPages = ( pages ) =>
		pages.map( ( { title, slug }, index ) => ( {
			id: index + 1,
			type: 'page',
			link: `https://this/is/a/test/page/${ slug }`,
			title: {
				rendered: title,
				raw: title,
			},
		} ) );

	return getEndpointMocks( REST_PAGES_ROUTES, responsesByMethod, buildPages );
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

	it( 'allows creation of a menu', async () => {
		await setUpResponseMocking( [
			...getMenuMocks( {
				GET: [],
				POST: {
					id: 4,
					description: '',
					name: 'Main Menu',
					slug: 'main-menu',
					meta: [],
					auto_add: false,
				},
			} ),
			...getMenuItemMocks( { GET: [] } ),
			...getPagesMocks( { GET: pagesFixture } ),
		] );
		await visitNavigationEditor();

		// Wait for the header to show that no menus are available.
		await page.waitForXPath( '//h2[contains(., "No menus available")]' );

		// Add a new menu.
		const [ addNewButton ] = await page.$x(
			'//button[contains(., "Add new")]'
		);
		await addNewButton.click();
		await page.keyboard.type( 'Main Menu' );
		const [ createMenuButton ] = await page.$x(
			'//button[contains(., "Create menu")]'
		);
		await createMenuButton.click();

		// Close the dropdown.
		await page.keyboard.press( 'Escape' );

		// Select the navigation block and create a block from existing pages.
		await page.click( 'div[aria-label="Block: Navigation"]' );

		const [ addAllPagesButton ] = await page.$x(
			'//button[contains(., "Add all pages")]'
		);
		await addAllPagesButton.click();

		expect( await getSerializedBlocks() ).toMatchSnapshot();
	} );

	it( 'displays the first menu from the REST response when at least one menu exists', async () => {
		await setUpResponseMocking( [
			...getMenuMocks( { GET: menusFixture } ),
			...getMenuItemMocks( { GET: menuItemsFixture } ),
		] );
		await visitNavigationEditor();

		// Wait for the header to show the menu name.
		await page.waitForXPath( '//h2[contains(., "Editing: Test Menu 1")]' );

		expect( await getSerializedBlocks() ).toMatchSnapshot();
	} );
} );
