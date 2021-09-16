/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { find } from 'puppeteer-testing-library';

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

const REST_PAGES_ROUTES = [
	'/wp/v2/pages',
	`rest_route=${ encodeURIComponent( '/wp/v2/pages' ) }`,
];

/**
 * Determines if a given URL matches any of a given collection of
 * routes (expressed as substrings).
 *
 * @param {string} reqUrl the full URL to be tested for matches.
 * @param {Array}  routes array of strings to match against the URL.
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

function getPagesMocks( responsesByMethod ) {
	return getEndpointMocks( REST_PAGES_ROUTES, responsesByMethod );
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
			...getPagesMocks( {
				GET: [
					{
						type: 'page',
						id: 1,
						link: 'https://example.com/1',
						title: {
							rendered: 'My page',
						},
					},
				],
			} ),
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
		await page.waitForXPath( '//h2[contains(., "Test Menu 1")]', {
			visible: true,
		} );

		const createMenuButton = await page.waitForXPath(
			'//button[.="New menu"]'
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
		await page.waitForXPath( '//h2[contains(., "Test Menu 1")]', {
			visible: true,
		} );

		// Wait for the block to be present.
		await page.waitForSelector( 'nav[aria-label="Block: Navigation"]' );

		expect( await getSerializedBlocks() ).toMatchSnapshot();
	} );

	it( 'shows the trailing block appender within the navigation block when no blocks are selected', async () => {
		// The test requires the presence of existing menus.
		await setUpResponseMocking( [
			...getMenuMocks( { GET: assignMockMenuIds( menusFixture ) } ),
			...getMenuItemMocks( { GET: menuItemsFixture } ),
		] );
		await visitNavigationEditor();

		// Wait for at least one block to be present on the page.
		await page.waitForSelector( '.wp-block' );

		// And for this test to be valid, no blocks should be selected, which
		// should be the case when the editor loads.
		const selectedBlocks = await page.$$( '.wp-block.is-selected' );
		expect( selectedBlocks.length ).toBe( 0 );

		// And when no blocks are selected, the trailing appender is present.
		const blockListAppender = await page.waitForSelector(
			'.block-list-appender button[aria-label="Add block"]'
		);
		expect( blockListAppender ).toBeTruthy();
	} );

	it( 'shows a submenu when a link is selected and hides it when clicking the editor to deselect it', async () => {
		await setUpResponseMocking( [
			...getMenuMocks( { GET: assignMockMenuIds( menusFixture ) } ),
			...getMenuItemMocks( { GET: menuItemsFixture } ),
		] );
		await visitNavigationEditor();

		// Select a submenu block with nested links in a submenu.
		const parentLinkXPath =
			'//div[@aria-label="Block: Submenu" and contains(.,"WordPress.org")]';
		const linkBlock = await page.waitForXPath( parentLinkXPath );
		await linkBlock.click();

		// There should be a submenu link visible.
		//
		// Submenus are hidden using `visibility: hidden` and shown using
		// `visibility: visible` so the visible/hidden options must be used
		// when selecting the elements.
		const submenuLinkXPath = `${ parentLinkXPath }//div[@aria-label="Block: Custom Link"]`;
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
			'//button[.="Start blank"]'
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
				'.edit-navigation-menu-actions__subtitle'
			);
			expect( headerSubtitle ).toBeTruthy();
			const headerSubtitleText = await headerSubtitle.evaluate(
				( element ) => element.innerText
			);
			expect( headerSubtitleText ).toBe( newName );
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
				'.edit-navigation-menu-actions__subtitle'
			);
			expect( headerSubtitle ).toBeTruthy();
			const headerSubtitleText = await headerSubtitle.evaluate(
				( element ) => element.innerText
			);
			expect( headerSubtitleText ).toBe( initialMenuName );
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

		// eslint-disable-next-line jest/no-disabled-tests
		it.skip( 'should not prompt to confirm unsaved changes for the newly selected menu', async () => {
			await assertIsDirty( false );
		} );

		// eslint-disable-next-line jest/no-disabled-tests
		it.skip( 'should prompt to confirm unsaved changes when menu name is edited', async () => {
			await page.type(
				'.edit-navigation-name-editor__text-control input',
				' Menu'
			);

			await assertIsDirty( true );
		} );
	} );

	describe( 'Sidebar inserter', () => {
		const initialMenu = {
			id: 4,
			description: '',
			name: 'Main Menu',
			slug: 'main-menu',
			meta: [],
			auto_add: false,
		};

		it( 'disables inserter toggle when Navigation block is in placeholder state', async () => {
			await setUpResponseMocking( [
				...getMenuMocks( {
					GET: [ initialMenu ],
					POST: initialMenu,
				} ),
				...getMenuItemMocks( { GET: [] } ),
			] );

			await visitNavigationEditor();

			// Wait for the block to be present.
			await expect( {
				role: 'document',
				name: 'Block: Navigation',
			} ).toBeFound();

			// Check for the placeholder state
			await expect( {
				role: 'button',
				name: 'Start blank',
			} ).toBeFound();

			// Expect the block inserter to be disabled.
			await expect( {
				name: 'Toggle block inserter',
				disabled: true,
				role: 'button',
			} ).toBeFound();
		} );

		it( 'enables inserter toggle when Navigation block is in editable state', async () => {
			await setUpResponseMocking( [
				...getMenuMocks( {
					GET: [ initialMenu ],
					POST: initialMenu,
				} ),
				...getMenuItemMocks( { GET: menuItemsFixture } ),
			] );

			await visitNavigationEditor();

			// Wait for the block to be present.
			await expect( {
				role: 'document',
				name: 'Block: Navigation',
			} ).toBeFound();

			// Expect the block inserter to be found.
			await expect( {
				name: 'Toggle block inserter',
				role: 'button',
			} ).toBeFound();

			// Work around bug where `find` with `disabled=false` doesn't return anything.
			const isEnabled = await page.$eval(
				'[aria-label="Toggle block inserter"]',
				( element ) => ! element.disabled
			);

			expect( isEnabled ).toBeTruthy();
		} );

		it( 'toggles the inserter sidebar open and closed', async () => {
			await setUpResponseMocking( [
				...getMenuMocks( {
					GET: [ initialMenu ],
					POST: initialMenu,
				} ),
				...getMenuItemMocks( { GET: menuItemsFixture } ),
			] );

			await visitNavigationEditor();

			// Wait for the block to be present.
			await expect( {
				role: 'document',
				name: 'Block: Navigation',
			} ).toBeFound();

			// Expect inserter sidebar to **not** be in the DOM.
			await expect( {
				role: 'region',
				name: 'Block library',
			} ).not.toBeFound();

			const inserterToggle = await find( {
				name: 'Toggle block inserter',
				role: 'button',
			} );

			await inserterToggle.click();

			// Expect the inserter sidebar to be present in the DOM.
			await expect( {
				role: 'region',
				name: 'Block library',
			} ).toBeFound();

			// Expect block search input to be focused.
			await expect( {
				role: 'searchbox',
				name: 'Search for blocks and patterns',
				focused: true,
			} ).toBeFound();
		} );

		it( 'inserts items at end of Navigation block by default', async () => {
			await setUpResponseMocking( [
				...getMenuMocks( {
					GET: [ initialMenu ],
					POST: initialMenu,
				} ),
				...getMenuItemMocks( { GET: menuItemsFixture } ),
				...getSearchMocks( { GET: searchFixture } ),
			] );

			await visitNavigationEditor();

			// Wait for the block to be present.
			await expect( {
				role: 'document',
				name: 'Block: Navigation',
			} ).toBeFound();

			const inserterToggle = await find( {
				name: 'Toggle block inserter',
				role: 'button',
			} );

			await inserterToggle.click();

			// Expect the inserter sidebar to be present in the DOM.
			await expect( {
				role: 'region',
				name: 'Block library',
			} ).toBeFound();

			// Add Custom Link item.
			const customLinkOption = await find( {
				name: 'Custom Link',
				role: 'option',
			} );

			customLinkOption.click();

			// Expect that inserter is auto-closed.
			await expect( {
				role: 'region',
				name: 'Block library',
			} ).not.toBeFound();

			// Expect to be focused inside the Link UI search input.
			await expect( {
				role: 'combobox',
				name: 'URL',
				focused: true,
			} ).toBeFound();

			const itemToSelectTitle = searchFixture[ 0 ].title;

			// Add Custom Link item.
			const firstSearchSuggestion = await find( {
				role: 'option',
				name: `${ itemToSelectTitle } ${ searchFixture[ 0 ].subtype }`,
			} );

			await firstSearchSuggestion.click();

			// Get the title/label of the last Nav item inside the Nav block.
			const lastItemAttributes = await page.evaluate( () => {
				const { getBlockOrder, getBlocks } = wp.data.select(
					'core/block-editor'
				);

				const lockedNavigationBlock = getBlockOrder()[ 0 ];

				const navItemBlocks = getBlocks( lockedNavigationBlock );

				const { attributes } = navItemBlocks[
					navItemBlocks.length - 1
				];

				return attributes;
			} );

			// Check the last item is the one we just inserted
			expect( lastItemAttributes.label ).toEqual( itemToSelectTitle );
			expect( lastItemAttributes.isTopLevelLink ).toBeTruthy();
		} );
	} );
} );
