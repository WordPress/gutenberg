/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { find, findAll } from 'puppeteer-testing-library';

/**
 * WordPress dependencies
 */
import {
	createJSONResponse,
	createMenu,
	deleteAllMenus,
	pressKeyTimes,
	pressKeyWithModifier,
	setUpResponseMocking,
	visitAdminPage,
	__experimentalRest as rest,
} from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useExperimentalFeatures } from './experimental-features';
import menuItemsFixture from './fixtures/menu-items-request-fixture.json';

const TYPE_NAMES = {
	post: 'post',
	page: 'page',
	post_tag: 'tag',
	category: 'category',
};

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

/**
 * Get a list of the editor's current blocks for use in a snapshot.
 *
 * @return {string} Block HTML.
 */
async function getSerializedBlocks() {
	const blocks = await page.evaluate( () =>
		wp.data.select( 'core/block-editor' ).getBlocks()
	);
	const safeBlocks = replaceUnstableBlockAttributes( blocks );
	return page.evaluate(
		( blocksToSerialize ) => wp.blocks.serialize( blocksToSerialize ),
		safeBlocks
	);
}

/**
 * Some block attributes contain values that are not stable from test run to
 * test run and can't be compared with a snapshot. These are typically the
 * ids of posts or pages that are created prior to each test run. Replace those
 * values with their types before serializing to a snapshot.
 *
 * @param {Array} blocks The array of block data.
 *
 * @return {Array} Updated array of block data.
 */
function replaceUnstableBlockAttributes( blocks ) {
	return blocks?.map( ( block ) => {
		const id = block.attributes.id ? typeof block.attributes.id : undefined;
		const url = block.attributes.url
			? typeof block.attributes.url
			: undefined;

		return {
			...block,
			attributes: {
				...block.attributes,
				id,
				url,
			},
			innerBlocks: replaceUnstableBlockAttributes( block.innerBlocks ),
		};
	} );
}

async function deleteAllLinkedResources() {
	[ '/wp/v2/posts', '/wp/v2/pages' ].forEach( async ( path ) => {
		const items = await rest( { path } );

		for ( const item of items ) {
			await rest( {
				method: 'DELETE',
				path: `${ path }/${ item.id }?force=true`,
			} );
		}
	} );
}

describe.skip( 'Navigation editor', () => {
	useExperimentalFeatures( [ '#gutenberg-navigation' ] );

	beforeAll( async () => {
		await deleteAllMenus();
		await deleteAllLinkedResources();
	} );

	afterEach( async () => {
		await deleteAllMenus();
		await deleteAllLinkedResources();
		await setUpResponseMocking( [] );
	} );

	it( 'allows creation of a menu when there are no current menu items', async () => {
		await visitNavigationEditor();
		await setUpResponseMocking( [
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

		// Wait for the header to show that no menus are available.
		await page.waitForXPath( '//h3[.="Create your first menu"]', {
			visible: true,
		} );

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
		await createMenu( { name: 'Test Menu 1' }, menuItemsFixture );
		await createMenu( { name: 'Test Menu 2' }, menuItemsFixture );
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

		await page.keyboard.type( 'New menu' );
		await page.keyboard.press( 'Enter' );

		// A snackbar will appear when menu creation has completed.
		await page.waitForXPath( '//div[contains(., "Menu created")]' );

		// An empty navigation block will appear.
		await page.waitForSelector( 'div[aria-label="Block: Navigation"]' );

		expect( await getSerializedBlocks() ).toMatchSnapshot();
	} );

	it( 'displays the first created menu when at least one menu exists', async () => {
		await createMenu( { name: 'Test Menu 1' }, menuItemsFixture );
		await createMenu( { name: 'Test Menu 2' }, menuItemsFixture );

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
		await createMenu( { name: 'Test Menu 1' }, menuItemsFixture );
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

	it( 'has a disabled undo button when an existing menu is loaded', async () => {
		// The test requires the presence of existing menus.
		await createMenu( { name: 'Test Menu 1' }, menuItemsFixture );
		await visitNavigationEditor();

		// Wait for at least one block to be present on the page.
		await page.waitForSelector( '.wp-block' );

		// Check whether there's a disabled undo button.
		const disabledUndoButton = await page.waitForSelector(
			'button[aria-label="Undo"][aria-disabled="true"]'
		);
		expect( disabledUndoButton ).toBeTruthy();
	} );

	it( 'shows a submenu when a link is selected and hides it when clicking the editor to deselect it', async () => {
		await createMenu( { name: 'Test Menu 1' }, menuItemsFixture );
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
		await createMenu( { name: 'Test Menu 1' } );
		await setUpResponseMocking( [
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

		it( 'saves menu name changes', async () => {
			await createMenu( { name: initialMenuName } );
			await visitNavigationEditor();

			// Rename the menu and save it.
			const newName = 'New menu';
			await page.waitForSelector( inputSelector );
			await page.click( inputSelector );
			await pressKeyTimes( 'Backspace', initialMenuName.length );
			await page.keyboard.type( newName );
			await page.click( '.edit-navigation-toolbar__save-button' );
			await page.waitForSelector( '.components-snackbar' );
			await page.reload();

			// Expect the header to have the new name.
			const headerSubtitle = await page.waitForSelector(
				'.edit-navigation-menu-actions__subtitle'
			);
			const headerSubtitleText = await headerSubtitle.evaluate(
				( element ) => element.innerText
			);
			expect( headerSubtitleText ).toBe( newName );
		} );

		// Flaky test, see https://github.com/WordPress/gutenberg/pull/34869#issuecomment-922711557.
		it.skip( 'does not save a menu name upon clicking save button when name is empty', async () => {
			await createMenu( { name: initialMenuName } );
			await visitNavigationEditor();

			// Try saving a menu with an empty name.
			await page.waitForSelector( inputSelector );
			await page.click( inputSelector );
			await pressKeyTimes( 'Backspace', initialMenuName.length );
			await page.click( '.edit-navigation-toolbar__save-button' );
			const snackbar = await page.waitForSelector(
				'.components-snackbar',
				{ visible: true }
			);
			const snackbarText = await snackbar.evaluate(
				( element ) => element.innerText
			);
			expect( snackbarText ).toBe(
				"Unable to save: 'A name is required for this term.'"
			);
			expect( console ).toHaveErrored(
				'Failed to load resource: the server responded with a status of 500 (Internal Server Error)'
			);
			await page.reload();

			// Expect the header to have the old name.
			const headerSubtitle = await page.waitForSelector(
				'.edit-navigation-menu-actions__subtitle'
			);
			const headerSubtitleText = await headerSubtitle.evaluate(
				( element ) => element.innerText
			);
			expect( headerSubtitleText ).toBe( initialMenuName );
		} );
	} );

	describe( 'Change detections', () => {
		beforeEach( async () => {
			await createMenu( { name: 'Main' } );
			await visitNavigationEditor();
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
		it( 'disables inserter toggle when Navigation block is in placeholder state', async () => {
			await createMenu( { name: 'Main Menu' } );
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
			await createMenu( { name: 'Main Menu' }, menuItemsFixture );
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
			await createMenu( { name: 'Main Menu' }, menuItemsFixture );
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
				...getSearchMocks( { GET: searchFixture } ),
			] );
			await createMenu( { name: 'Main Menu' }, menuItemsFixture );

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

			const [ itemToSelect ] = searchFixture;

			// Add Custom Link item.
			const [ firstSearchSuggestion ] = await findAll( {
				role: 'option',
				name: `${ itemToSelect.title } ${ itemToSelect.subtype }`,
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
			expect( lastItemAttributes.label ).toEqual( itemToSelect.title );
			expect( lastItemAttributes.isTopLevelLink ).toBeTruthy();
		} );
	} );
} );
