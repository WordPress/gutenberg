/**
 * WordPress dependencies
 */
import {
	createJSONResponse,
	pressKeyTimes,
	pressKeyWithModifier,
	setUpResponseMocking,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useExperimentalFeatures } from '../../experimental-features';
import menuItemsFixture from './fixtures/menu-items-response-fixture.json';

const TYPE_NAMES = {
	post: 'post',
	page: 'page',
	post_tag: 'tag',
	category: 'category',
};

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

const searchFixture = [
	{
		id: 300,
		title: 'Home',
		url: 'https://example.com/home',
		type: 'post',
		subtype: 'page',
	},
	{
		id: 301,
		title: 'About',
		url: 'https://example.com/about',
		type: 'post',
		subtype: 'page',
	},
	{
		id: 302,
		title: 'Boats',
		url: 'https://example.com/?cat=123',
		type: 'category',
	},
	{
		id: 303,
		title: 'Faves',
		url: 'https://example.com/?tag=456',
		type: 'post_tag',
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

const REST_SEARCH_ROUTES = [
	'/wp/v2/search',
	`rest_route=${ encodeURIComponent( '/wp/v2/search' ) }`,
];

/**
 * Determines if a given URL matches any of a given collection of
 * routes (expressed as substrings).
 *
 * @param {string} reqUrl the full URL to be tested for matches.
 * @param {Array} routes array of strings to match against the URL.
 */
function matchUrlToRoute( reqUrl, routes ) {
	return routes.some( ( route ) => reqUrl.includes( route ) );
}

function getEndpointMocks( matchingRoutes, responsesByMethod ) {
	return [ 'GET', 'POST', 'DELETE', 'PUT' ].reduce( ( mocks, restMethod ) => {
		if ( responsesByMethod[ restMethod ] ) {
			return [
				...mocks,
				{
					match: ( request ) =>
						matchUrlToRoute( request.url(), matchingRoutes ) &&
						request.method() === restMethod,
					onRequestMatch: createJSONResponse(
						responsesByMethod[ restMethod ]
					),
				},
			];
		}

		return mocks;
	}, [] );
}

function assignMockMenuIds( menus ) {
	return menus.length
		? menus.map( ( menu, index ) => ( {
				...menu,
				id: index + 1,
		  } ) )
		: [];
}

function getMenuMocks( responsesByMethod ) {
	return getEndpointMocks( REST_MENUS_ROUTES, responsesByMethod );
}

function getMenuItemMocks( responsesByMethod ) {
	return getEndpointMocks( REST_MENU_ITEMS_ROUTES, responsesByMethod );
}

function getSearchMocks( responsesByMethod ) {
	return getEndpointMocks( REST_SEARCH_ROUTES, responsesByMethod );
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

	it( 'allows creation of a menu when there are no current menu items', async () => {
		const menuPostResponse = {
			id: 4,
			description: '',
			name: 'Main Menu',
			slug: 'main-menu',
			meta: [],
			auto_add: false,
		};

		// Initially return nothing from the menu and menuItem endpoints
		await setUpResponseMocking( [
			...getMenuMocks( { GET: [] } ),
			...getMenuItemMocks( { GET: [] } ),
		] );
		await visitNavigationEditor();

		// Wait for the header to show that no menus are available.
		await page.waitForXPath( '//h3[.="Create your first menu"]', {
			visible: true,
		} );

		// Prepare the menu endpoint for creating a menu.
		await setUpResponseMocking( [
			...getMenuMocks( {
				GET: [ menuPostResponse ],
				POST: menuPostResponse,
			} ),
			...getMenuItemMocks( { GET: [] } ),
		] );

		await page.keyboard.type( 'Main Menu' );
		const createMenuButton = await page.waitForXPath(
			'//button[contains(., "Create menu")]'
		);
		await createMenuButton.click();

		// A snackbar will appear when menu creation has completed.
		await page.waitForXPath( '//div[contains(., "Menu created")]' );

		// Select the navigation block and create a block from existing pages.
		const navigationBlock = await page.waitForSelector(
			'div[aria-label="Block: Navigation"]'
		);
		await navigationBlock.click();

		const addAllPagesButton = await page.waitForXPath(
			'//button[contains(., "Add all pages")]'
		);
		await addAllPagesButton.click();

		// When the block is created the root element changes from a div (for the placeholder)
		// to a nav (for the navigation itself). Wait for this to happen.
		await page.waitForSelector( 'nav[aria-label="Block: Navigation"]' );

		expect( await getSerializedBlocks() ).toMatchSnapshot();
	} );

	it( 'allows creation of a menu when there are existing menu items', async () => {
		const menuPostResponse = {
			id: 4,
			description: '',
			name: 'New Menu',
			slug: 'new-menu',
			meta: [],
			auto_add: false,
		};

		await setUpResponseMocking( [
			...getMenuMocks( {
				GET: assignMockMenuIds( menusFixture ),
				POST: menuPostResponse,
			} ),
			...getMenuItemMocks( { GET: menuItemsFixture } ),
		] );
		await visitNavigationEditor();

		// Wait for the header to show the menu name.
		await page.waitForXPath( '//h2[contains(., "Editing: Test Menu 1")]', {
			visible: true,
		} );

		// Open up the menu creation dialog and create a new menu.
		const switchMenuButton = await page.waitForXPath(
			'//button[.="Switch menu"]'
		);
		await switchMenuButton.click();

		const createMenuButton = await page.waitForXPath(
			'//button[.="Create a new menu"]'
		);
		await createMenuButton.click();

		const menuNameInputLabel = await page.waitForXPath(
			'//form//label[.="Menu name"]'
		);
		await menuNameInputLabel.click();

		await setUpResponseMocking( [
			...getMenuMocks( {
				GET: assignMockMenuIds( [
					...menusFixture,
					{ name: 'New menu', slug: 'new-menu' },
				] ),
				POST: menuPostResponse,
			} ),
			...getMenuItemMocks( { GET: [] } ),
		] );

		await page.keyboard.type( 'New menu' );
		await page.keyboard.press( 'Enter' );

		// A snackbar will appear when menu creation has completed.
		await page.waitForXPath( '//div[contains(., "Menu created")]' );

		// An empty navigation block will appear.
		await page.waitForSelector( 'div[aria-label="Block: Navigation"]' );

		expect( await getSerializedBlocks() ).toMatchSnapshot();
	} );

	it( 'displays the first menu from the REST response when at least one menu exists', async () => {
		await setUpResponseMocking( [
			...getMenuMocks( { GET: assignMockMenuIds( menusFixture ) } ),
			...getMenuItemMocks( { GET: menuItemsFixture } ),
		] );
		await visitNavigationEditor();

		// Wait for the header to show the menu name.
		await page.waitForXPath( '//h2[contains(., "Editing: Test Menu 1")]', {
			visible: true,
		} );

		// Wait for the block to be present.
		await page.waitForSelector( 'nav[aria-label="Block: Navigation"]' );

		expect( await getSerializedBlocks() ).toMatchSnapshot();
	} );

	it( 'shows a submenu when a link is selected and hides it when clicking the editor to deselect it', async () => {
		await setUpResponseMocking( [
			...getMenuMocks( { GET: assignMockMenuIds( menusFixture ) } ),
			...getMenuItemMocks( { GET: menuItemsFixture } ),
		] );
		await visitNavigationEditor();

		// Select a link block with nested links in a submenu.
		const parentLinkXPath =
			'//li[@aria-label="Block: Custom Link" and contains(.,"WordPress.org")]';
		const linkBlock = await page.waitForXPath( parentLinkXPath );
		await linkBlock.click();

		// There should be a submenu link visible.
		//
		// Submenus are hidden using `visibility: hidden` and shown using
		// `visibility: visible` so the visible/hidden options must be used
		// when selecting the elements.
		const submenuLinkXPath = `${ parentLinkXPath }//li[@aria-label="Block: Custom Link"]`;
		const submenuLinkVisible = await page.waitForXPath( submenuLinkXPath, {
			visible: true,
		} );
		expect( submenuLinkVisible ).toBeDefined();

		// click in the top left corner of the canvas.
		const canvas = await page.$( '.edit-navigation-layout__content-area' );
		const boundingBox = await canvas.boundingBox();
		await page.mouse.click( boundingBox.x + 5, boundingBox.y + 5 );

		// There should be a submenu in the DOM, but it should be hidden.
		const submenuLinkHidden = await page.waitForXPath( submenuLinkXPath, {
			hidden: true,
		} );
		expect( submenuLinkHidden ).toBeDefined();
	} );

	it( 'displays suggestions when adding a link', async () => {
		await setUpResponseMocking( [
			...getMenuMocks( { GET: assignMockMenuIds( menusFixture ) } ),
			...getSearchMocks( { GET: searchFixture } ),
		] );

		await visitNavigationEditor();

		// Wait for the block to be present and start an empty block.
		const navBlock = await page.waitForSelector(
			'div[aria-label="Block: Navigation"]'
		);
		await navBlock.click();
		const startEmptyButton = await page.waitForXPath(
			'//button[.="Start empty"]'
		);
		await startEmptyButton.click();

		const appender = await page.waitForSelector(
			'button[aria-label="Add block"]'
		);
		await appender.click();

		const linkInserterItem = await page.waitForXPath(
			'//button[@role="option"]//span[.="Custom Link"]'
		);
		await linkInserterItem.click();

		await page.waitForSelector( 'input[aria-label="URL"]' );

		// The link suggestions should be searchable.
		for ( let i = 0; i < searchFixture.length; i++ ) {
			const { title, type, subtype, url } = searchFixture[ i ];
			const expectedURL = url.replace( 'https://', '' );
			const expectedType = TYPE_NAMES[ subtype || type ];

			await page.keyboard.type( title );
			const suggestionTitle = await page.waitForXPath(
				`//button[@role="option"]//span[.="${ title }"]`
			);
			const suggestionType = await page.waitForXPath(
				`//button[@role="option"]//span[.="${ expectedType }"]`
			);
			const suggestionURL = await page.waitForXPath(
				`//button[@role="option"]//span[.="${ expectedURL }"]`
			);
			expect( suggestionTitle ).toBeTruthy();
			expect( suggestionType ).toBeTruthy();
			expect( suggestionURL ).toBeTruthy();
			await pressKeyWithModifier( 'primary', 'A' );
		}
	} );

	describe( 'Menu name editor', () => {
		const initialMenuName = 'Main Menu';
		const nameEditorSelector = '.edit-navigation-name-editor__text-control';
		const inputSelector = `${ nameEditorSelector } input`;

		beforeEach( async () => {
			const menuPostResponse = {
				id: 4,
				description: '',
				name: initialMenuName,
				slug: 'main-menu',
				meta: [],
				auto_add: false,
			};

			await setUpResponseMocking( [
				...getMenuMocks( {
					GET: [ menuPostResponse ],
					POST: menuPostResponse,
				} ),
				...getMenuItemMocks( { GET: [] } ),
			] );

			await visitNavigationEditor();

			// Wait for the navigation setting sidebar.
			await page.waitForSelector( '.edit-navigation-sidebar' );
		} );

		afterEach( async () => {
			await setUpResponseMocking( [] );
		} );

		it( 'is displayed in inspector additions', async () => {
			const nameControl = await page.$( nameEditorSelector );
			expect( nameControl ).toBeDefined();
		} );

		it( 'saves menu name upon clicking save button', async () => {
			const newName = 'newName';
			const menuPostResponse = {
				id: 4,
				description: '',
				name: newName,
				slug: 'main-menu',
				meta: [],
				auto_add: false,
			};

			await setUpResponseMocking( [
				...getMenuMocks( {
					GET: [ menuPostResponse ],
					POST: menuPostResponse,
				} ),
				...getMenuItemMocks( { GET: [] } ),
			] );

			// Ensure there is focus.
			await page.focus( inputSelector );
			await pressKeyTimes( 'Backspace', initialMenuName.length );
			await page.keyboard.type( newName );

			const saveButton = await page.$(
				'.edit-navigation-toolbar__save-button'
			);
			await saveButton.click();
			await page.waitForSelector( '.components-snackbar' );
			const headerSubtitle = await page.waitForSelector(
				'.edit-navigation-header__subtitle'
			);
			expect( headerSubtitle ).toBeTruthy();
			const headerSubtitleText = await headerSubtitle.evaluate(
				( element ) => element.innerText
			);
			expect( headerSubtitleText ).toBe( `Editing: ${ newName }` );
		} );

		it( 'does not save a menu name upon clicking save button when name is empty', async () => {
			const menuPostResponse = {
				id: 4,
				description: '',
				name: initialMenuName,
				slug: 'main-menu',
				meta: [],
				auto_add: false,
			};

			await setUpResponseMocking( [
				...getMenuMocks( {
					GET: [ menuPostResponse ],
					POST: menuPostResponse,
				} ),
				...getMenuItemMocks( { GET: [] } ),
			] );

			// Ensure there is focus.
			await page.focus( inputSelector );
			await pressKeyTimes( 'Backspace', initialMenuName.length );

			const saveButton = await page.$(
				'.edit-navigation-toolbar__save-button'
			);
			await saveButton.click();
			await page.waitForSelector( '.components-snackbar' );
			const headerSubtitle = await page.waitForSelector(
				'.edit-navigation-header__subtitle'
			);
			expect( headerSubtitle ).toBeTruthy();
			const headerSubtitleText = await headerSubtitle.evaluate(
				( element ) => element.innerText
			);
			expect( headerSubtitleText ).toBe(
				`Editing: ${ initialMenuName }`
			);
		} );
	} );

	describe( 'Change detections', () => {
		beforeEach( async () => {
			const menuPostResponse = {
				id: 4,
				description: '',
				name: 'Main',
				slug: 'main-menu',
				meta: [],
				auto_add: false,
			};

			await setUpResponseMocking( [
				...getMenuMocks( {
					GET: [ menuPostResponse ],
					POST: menuPostResponse,
				} ),
				...getMenuItemMocks( { GET: [] } ),
			] );

			await visitNavigationEditor();
		} );

		afterEach( async () => {
			await setUpResponseMocking( [] );
		} );

		async function assertIsDirty( isDirty ) {
			let hadDialog = false;

			function handleOnDialog() {
				hadDialog = true;
			}

			try {
				page.on( 'dialog', handleOnDialog );
				await page.reload();

				// Ensure whether it was expected that dialog was encountered.
				expect( hadDialog ).toBe( isDirty );
			} catch ( error ) {
				throw error;
			} finally {
				page.removeListener( 'dialog', handleOnDialog );
			}
		}

		it.skip( 'should not prompt to confirm unsaved changes for the newly selected menu', async () => {
			await assertIsDirty( false );
		} );

		it.skip( 'should prompt to confirm unsaved changes when menu name is edited', async () => {
			await page.type(
				'.edit-navigation-name-editor__text-control input',
				' Menu'
			);

			await assertIsDirty( true );
		} );
	} );
} );
