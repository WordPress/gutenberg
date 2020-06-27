/**
 * WordPress dependencies
 */
import {
	createJSONResponse,
	createNewPost,
	getEditedPostContent,
	insertBlock,
	setUpResponseMocking,
	clickBlockToolbarButton,
	pressKeyWithModifier,
	showBlockToolbar,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
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

async function mockPagesResponse( pages ) {
	const mappedPages = pages.map( ( { title, slug }, index ) => ( {
		id: index + 1,
		type: 'page',
		link: `https://this/is/a/test/page/${ slug }`,
		title: {
			rendered: title,
			raw: title,
		},
	} ) );

	await setUpResponseMocking( [
		{
			match: ( request ) =>
				matchUrlToRoute( request.url(), REST_PAGES_ROUTES ),
			onRequestMatch: createJSONResponse( mappedPages ),
		},
	] );
}

async function mockSearchResponse( items ) {
	const mappedItems = items.map( ( { title, slug }, index ) => ( {
		id: index + 1,
		subtype: 'page',
		title,
		type: 'post',
		url: `https://this/is/a/test/search/${ slug }`,
	} ) );

	await setUpResponseMocking( [
		{
			match: ( request ) =>
				request.url().includes( `rest_route` ) &&
				request.url().includes( `search` ),
			onRequestMatch: createJSONResponse( mappedItems ),
		},
	] );
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

async function mockEmptyMenusAndPagesResponses() {
	const emptyResponse = [];
	await setUpResponseMocking( [
		{
			match: ( request ) =>
				matchUrlToRoute( request.url(), REST_MENUS_ROUTES ),
			onRequestMatch: createJSONResponse( emptyResponse ),
		},
		{
			match: ( request ) =>
				matchUrlToRoute( request.url(), REST_PAGES_ROUTES ),
			onRequestMatch: createJSONResponse( emptyResponse ),
		},
	] );
}

async function mockCreatePageResponse( title, slug ) {
	const page = {
		id: 1,
		title: { raw: title, rendered: title },
		type: 'page',
		link: `https://this/is/a/test/create/page/${ slug }`,
		slug,
	};

	await setUpResponseMocking( [
		{
			match: ( request ) =>
				request.url().includes( `rest_route` ) &&
				request.url().includes( `pages` ) &&
				request.method() === 'POST',
			onRequestMatch: createJSONResponse( page ),
		},
	] );
}

/**
 * Interacts with the LinkControl to perform a search and select a returned suggestion
 *
 * @param {Object} link link object to be tested
 * @param {string} link.url What will be typed in the search input
 * @param {string} link.label What the resulting label will be in the creating Link Block after the block is created.
 * @param {string} link.type What kind of suggestion should be clicked, ie. 'url', 'create', or 'entity'
 */
async function updateActiveNavigationLink( { url, label, type } ) {
	const typeClasses = {
		create: 'block-editor-link-control__search-create',
		entity: 'is-entity',
		url: 'is-url',
	};

	if ( url ) {
		await page.type( 'input[placeholder="Search or type url"]', url );

		const suggestionPath = `//button[contains(@class, 'block-editor-link-control__search-item') and contains(@class, '${ typeClasses[ type ] }')]/span/span[@class='block-editor-link-control__search-item-title']/mark[text()="${ url }"]`;

		// Wait for the autocomplete suggestion item to appear.
		await page.waitForXPath( suggestionPath );
		// Set the suggestion
		const [ suggestion ] = await page.$x( suggestionPath );

		// Select it (so we're clicking the right one, even if it's further down the list)
		await suggestion.click();
	}

	if ( label ) {
		// Wait for rich text editor input to be focused before we start typing the label
		await page.waitForSelector( ':focus.rich-text' );

		// With https://github.com/WordPress/gutenberg/pull/19686, we're auto-selecting the label if the label is URL-ish.
		// In this case, it means we have to select and delete the label if it's _not_ the url.
		if ( label !== url ) {
			// Ideally this would be `await pressKeyWithModifier( 'primary', 'a' )`
			// to select all text like other tests do.
			// Unfortunately, these tests don't seem to pass on Travis CI when
			// using that approach, while using `Home` and `End` they do pass.
			await page.keyboard.press( 'Home' );
			await pressKeyWithModifier( 'shift', 'End' );
			await page.keyboard.press( 'Backspace' );
		}

		await page.keyboard.type( label );
	}
}

async function selectDropDownOption( optionText ) {
	const buttonText = 'Select where to start from…';
	await page.waitForXPath(
		`//button[text()="${ buttonText }"][not(@disabled)]`
	);
	const [ dropdownToggle ] = await page.$x(
		`//button[text()="${ buttonText }"][not(@disabled)]`
	);
	await dropdownToggle.click();

	const [ theOption ] = await page.$x( `//li[text()="${ optionText }"]` );

	await theOption.click();
}

async function clickCreateButton() {
	const buttonText = 'Create';
	// Wait for button to become available
	await page.waitForXPath(
		`//button[text()="${ buttonText }"][not(@disabled)]`
	);

	// Then locate...
	const [ createNavigationButton ] = await page.$x(
		`//button[text()="${ buttonText }"][not(@disabled)]`
	);

	// Then click
	await createNavigationButton.click();
}

async function createEmptyNavBlock() {
	await selectDropDownOption( 'Create empty menu' );
	await clickCreateButton();
}

beforeEach( async () => {
	await createNewPost();
} );

afterEach( async () => {
	await setUpResponseMocking( [] );
} );
describe( 'Navigation', () => {
	describe( 'Creating from existing Pages', () => {
		it( 'allows a navigation block to be created using existing pages', async () => {
			// Mock the response from the Pages endpoint. This is done so that the pages returned are always
			// consistent and to test the feature more rigorously than the single default sample page.
			await mockPagesResponse( [
				{
					title: 'Home',
					slug: 'home',
				},
				{
					title: 'About',
					slug: 'about',
				},
				{
					title: 'Contact Us',
					slug: 'contact',
				},
			] );

			// Add the navigation block.
			await insertBlock( 'Navigation' );

			await selectDropDownOption( 'New from all top-level pages' );

			await clickCreateButton();

			// Snapshot should contain the mocked pages.
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'does not display option to create from existing Pages if there are no Pages', async () => {
			// Force no Pages or Menus to be returned by API responses.
			await mockEmptyMenusAndPagesResponses();

			// Add the navigation block.
			await insertBlock( 'Navigation' );

			const dropdownButtonText = 'Select where to start from…';
			await page.waitForXPath(
				`//button[text()="${ dropdownButtonText }"][not(@disabled)]`
			);
			const [ dropdownToggle ] = await page.$x(
				`//button[text()="${ dropdownButtonText }"][not(@disabled)]`
			);

			await dropdownToggle.click();

			const dropDownItemsLength = await page.$$eval(
				'ul[role="listbox"] li[role="option"]',
				( els ) => els.length
			);

			// Should only be showing
			// 1. Placeholder value.
			// 2. Create empty menu.
			expect( dropDownItemsLength ).toEqual( 2 );

			await page.waitForXPath( '//li[text()="Create empty menu"]' );

			// Snapshot should contain the mocked menu items.
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'Creating from existing Menus', () => {
		it( 'allows a navigation block to be created from existing menus', async () => {
			await mockAllMenusResponses();

			// Add the navigation block.
			await insertBlock( 'Navigation' );

			await selectDropDownOption( 'Test Menu 2' );

			await clickCreateButton();

			// await page.waitFor( 50000000 );

			// Scope element selector to the Editor's "Content" region as otherwise it picks up on
			// block previews.
			const navBlockItemsLength = await page.$$eval(
				'[aria-label="Content"][role="region"] li[aria-label="Block: Link"]',
				( els ) => els.length
			);

			// Assert the correct number of Nav Link blocks were inserted.
			expect( navBlockItemsLength ).toEqual( menuItemsFixture.length );

			// Snapshot should contain the mocked menu items.
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'creates an empty navigation block when the selected existing menu is also empty', async () => {
			// Force mock to return no Menus Items (empty menu)
			const emptyMenuItems = [];
			await mockAllMenusResponses( menusFixture, emptyMenuItems );

			// Add the navigation block.
			await insertBlock( 'Navigation' );

			await selectDropDownOption( 'Test Menu 1' );

			await clickCreateButton();

			// Scope element selector to the "Editor content" as otherwise it picks up on
			// Block Style live previews.
			const navBlockItemsLength = await page.$$eval(
				'[aria-label="Content"][role="region"] li[aria-label="Block: Link"]',
				( els ) => els.length
			);

			// Assert an empty Nav Block is created.
			// We expect 1 here because a "placeholder" Nav Item Block is automatically inserted
			expect( navBlockItemsLength ).toEqual( 1 );

			// Snapshot should contain the mocked menu items.
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'does not display option to create from existing menus if there are no menus', async () => {
			// Force no Menus to be returned by API response.
			await mockEmptyMenusAndPagesResponses();

			// Add the navigation block.
			await insertBlock( 'Navigation' );

			const dropdownButtonText = 'Select where to start from…';
			await page.waitForXPath(
				`//button[text()="${ dropdownButtonText }"][not(@disabled)]`
			);
			const [ dropdownToggle ] = await page.$x(
				`//button[text()="${ dropdownButtonText }"][not(@disabled)]`
			);
			await dropdownToggle.click();

			const dropDownItemsLength = await page.$$eval(
				'ul[role="listbox"] li[role="option"]',
				( els ) => els.length
			);

			// Should only be showing
			// 1. Placeholder.
			// 2. Create from Empty.
			expect( dropDownItemsLength ).toEqual( 2 );

			await page.waitForXPath( '//li[text()="Create empty menu"]' );

			// Snapshot should contain the mocked menu items.
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	it( 'allows an empty navigation block to be created and manually populated using a mixture of internal and external links', async () => {
		// Add the navigation block.
		await insertBlock( 'Navigation' );

		// Create an empty nav block.
		await page.waitForSelector( '.wp-block-navigation-placeholder' );

		await createEmptyNavBlock();

		// Add a link to the default Link block.
		await updateActiveNavigationLink( {
			url: 'https://wordpress.org',
			label: 'WP',
			type: 'url',
		} );

		await showBlockToolbar();

		// Add another Link block.
		// Using 'click' here checks for regressions of https://github.com/WordPress/gutenberg/issues/18329,
		// an issue where the block appender requires two clicks.
		await page.click( '.wp-block-navigation .block-list-appender' );

		// After adding a new block, search input should be shown immediately.
		// Verify that Escape would close the popover.
		// Regression: https://github.com/WordPress/gutenberg/pull/19885
		// Wait for URL input to be focused
		await page.waitForSelector(
			'input.block-editor-url-input__input:focus'
		);

		// After adding a new block, search input should be shown immediately.
		const isInURLInput = await page.evaluate(
			() =>
				!! document.activeElement.matches(
					'input.block-editor-url-input__input'
				)
		);
		expect( isInURLInput ).toBe( true );
		await page.keyboard.press( 'Escape' );
		const isInLinkRichText = await page.evaluate(
			() =>
				document.activeElement.classList.contains( 'rich-text' ) &&
				!! document.activeElement.closest(
					'.block-editor-block-list__block'
				)
		);
		expect( isInLinkRichText ).toBe( true );

		// Now, trigger the link dialog once more.
		await clickBlockToolbarButton( 'Link' );

		// For the second nav link block use an existing internal page.
		// Mock the api response so that it's consistent.
		await mockSearchResponse( [
			{ title: 'Get in Touch', slug: 'get-in-touch' },
		] );

		// Add a link to the default Link block.
		await updateActiveNavigationLink( {
			url: 'Get in Touch',
			label: 'Contact',
			type: 'entity',
		} );

		// Expect a Navigation Block with two Links in the snapshot.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'allows pages to be created from the navigation block and their links added to menu', async () => {
		// Mock request for creating pages and the page search response.
		// We mock the page search to return no results and we use a very long
		// page name because if the search returns existing pages then the
		// "Create" suggestion might be below the scroll fold within the
		// `LinkControl` search suggestions UI. If this happens then it's not
		// possible to wait for the element to appear and the test will
		// erroneously fail.
		await mockSearchResponse( [] );
		await mockCreatePageResponse(
			'A really long page name that will not exist',
			'my-new-page'
		);

		// Add the navigation block.
		await insertBlock( 'Navigation' );

		// Create an empty nav block.
		await createEmptyNavBlock();

		// Wait for URL input to be focused
		await page.waitForSelector(
			'input.block-editor-url-input__input:focus'
		);

		// After adding a new block, search input should be shown immediately.
		const isInURLInput = await page.evaluate(
			() =>
				!! document.activeElement.matches(
					'input.block-editor-url-input__input'
				)
		);
		expect( isInURLInput ).toBe( true );

		// Insert name for the new page.
		await page.type(
			'input[placeholder="Search or type url"]',
			'A really long page name that will not exist'
		);

		// Wait for URL input to be focused
		await page.waitForSelector(
			'input.block-editor-url-input__input:focus'
		);

		// Wait for the create button to appear and click it.
		await page.waitForSelector(
			'.block-editor-link-control__search-create'
		);

		const createPageButton = await page.$(
			'.block-editor-link-control__search-create'
		);

		await createPageButton.click();

		// wait for the creating confirmation to go away, and we should now be focused on our text input
		await page.waitForSelector( ':focus.rich-text' );

		// Confirm the new link is focused.
		const isInLinkRichText = await page.evaluate(
			() =>
				document.activeElement.classList.contains( 'rich-text' ) &&
				!! document.activeElement.closest(
					'.block-editor-block-list__block'
				) &&
				document.activeElement.innerText ===
					'A really long page name that will not exist'
		);

		expect( isInLinkRichText ).toBe( true );

		// Expect a Navigation Block with a link for "A really long page name that will not exist".
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
