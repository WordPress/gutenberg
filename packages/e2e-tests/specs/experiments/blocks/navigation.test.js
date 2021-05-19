/**
 * WordPress dependencies
 */
import {
	createJSONResponse,
	createNewPost,
	getEditedPostContent,
	insertBlock,
	setUpResponseMocking,
	pressKeyWithModifier,
	saveDraft,
	showBlockToolbar,
	openPreviewPage,
	selectBlockByClientId,
	getAllBlocks,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import menuItemsFixture from '../fixtures/menu-items-response-fixture.json';

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
		const suggestion = await page.waitForXPath( suggestionPath );

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
	const dropdown = await page.waitForXPath(
		"//*[contains(@class, 'wp-block-navigation-placeholder__actions__dropdown')]"
	);
	await dropdown.click();
	const theOption = await page.waitForXPath(
		`//*[contains(@class, 'components-menu-item__item')][ text()="${ optionText }" ]`
	);
	await theOption.click();
}

const PLACEHOLDER_ACTIONS_CLASS = 'wp-block-navigation-placeholder__actions';
const PLACEHOLDER_ACTIONS_XPATH = `//*[contains(@class, '${ PLACEHOLDER_ACTIONS_CLASS }')]`;
const START_EMPTY_XPATH = `${ PLACEHOLDER_ACTIONS_XPATH }//button[text()='Start empty']`;
const ADD_ALL_PAGES_XPATH = `${ PLACEHOLDER_ACTIONS_XPATH }//button[text()='Add all pages']`;

async function createNavBlockWithAllPages() {
	const allPagesButton = await page.waitForXPath( ADD_ALL_PAGES_XPATH );
	await allPagesButton.click();
}

async function createEmptyNavBlock() {
	const startEmptyButton = await page.waitForXPath( START_EMPTY_XPATH );
	await startEmptyButton.click();
}

async function addLinkBlock() {
	// Using 'click' here checks for regressions of https://github.com/WordPress/gutenberg/issues/18329,
	// an issue where the block appender requires two clicks.
	await page.click( '.wp-block-navigation .block-list-appender' );

	const [ linkButton ] = await page.$x(
		"//*[contains(@class, 'block-editor-inserter__quick-inserter')]//*[text()='Custom Link']"
	);
	await linkButton.click();
}

async function toggleSidebar() {
	await page.click(
		'.edit-post-header__settings button[aria-label="Settings"]'
	);
}

async function turnResponsivenessOn() {
	const blocks = await getAllBlocks();

	await selectBlockByClientId( blocks[ 0 ].clientId );
	await toggleSidebar();

	const [ responsivenessToggleButton ] = await page.$x(
		'//label[text()[contains(.,"Enable responsive menu")]]'
	);

	await responsivenessToggleButton.click();

	await saveDraft();
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

			await createNavBlockWithAllPages();

			// Snapshot should contain the mocked pages.
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'does not display option to create from existing Pages if there are no Pages', async () => {
			// Force no Pages or Menus to be returned by API responses.
			await mockEmptyMenusAndPagesResponses();

			// Add the navigation block.
			await insertBlock( 'Navigation' );

			await page.waitForXPath( START_EMPTY_XPATH );

			const placeholderActionsLength = await page.$$eval(
				`.${ PLACEHOLDER_ACTIONS_CLASS } button`,
				( els ) => els.length
			);

			// Should only be showing "Start empty"
			expect( placeholderActionsLength ).toEqual( 1 );
		} );
	} );

	describe( 'Creating from existing Menus', () => {
		it( 'allows a navigation block to be created from existing menus', async () => {
			await mockAllMenusResponses();

			// Add the navigation block.
			await insertBlock( 'Navigation' );

			await selectDropDownOption( 'Test Menu 2' );

			await page.waitForSelector( '.wp-block-navigation__container' );

			// Scope element selector to the Editor's "Content" region as otherwise it picks up on
			// block previews.
			const navBlockItemsLength = await page.$$eval(
				'[aria-label="Editor content"][role="region"] li[aria-label="Block: Custom Link"]',
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

			// Scope element selector to the "Editor content" as otherwise it picks up on
			// Block Style live previews.
			const navBlockItemsLength = await page.$$eval(
				'[aria-label="Editor content"][role="region"] li[aria-label="Block: Link"]',
				( els ) => els.length
			);

			// Assert an empty Nav Block is created.
			expect( navBlockItemsLength ).toEqual( 0 );

			// Snapshot should contain the mocked menu items.
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'does not display option to create from existing menus if there are no menus', async () => {
			// Force no Menus to be returned by API response.
			await mockEmptyMenusAndPagesResponses();

			// Add the navigation block.
			await insertBlock( 'Navigation' );

			await page.waitForXPath( START_EMPTY_XPATH );

			const placeholderActionsLength = await page.$$eval(
				`.${ PLACEHOLDER_ACTIONS_CLASS } button`,
				( els ) => els.length
			);

			// Should only be showing create empty menu.
			expect( placeholderActionsLength ).toEqual( 1 );
		} );
	} );

	it( 'allows an empty navigation block to be created and manually populated using a mixture of internal and external links', async () => {
		// Add the navigation block.
		await insertBlock( 'Navigation' );

		// Create an empty nav block.
		await page.waitForSelector( '.wp-block-navigation-placeholder' );

		await createEmptyNavBlock();

		await addLinkBlock();

		// Add a link to the Link block.
		await updateActiveNavigationLink( {
			url: 'https://wordpress.org',
			label: 'WP',
			type: 'url',
		} );

		await showBlockToolbar();

		await addLinkBlock();

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

		//click the link placeholder
		const placeholder = await page.waitForSelector(
			'.wp-block-navigation-link__placeholder'
		);
		await placeholder.click();

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

		await addLinkBlock();

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

		const draftLink = await page.waitForSelector(
			'.wp-block-navigation-link__content'
		);
		await draftLink.click();

		// Expect a Navigation Block with a link for "A really long page name that will not exist".
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'loads frontend code only if the block is present', async () => {
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

		// Create first block at the start in order to enable preview.
		await insertBlock( 'Navigation' );
		await saveDraft();

		const previewPage = await openPreviewPage();
		const isScriptLoaded = await previewPage.evaluate(
			() =>
				null !==
				document.querySelector(
					'script[src*="navigation/frontend.js"]'
				)
		);

		expect( isScriptLoaded ).toBe( false );

		await createNavBlockWithAllPages();
		await insertBlock( 'Navigation' );
		await createNavBlockWithAllPages();
		await turnResponsivenessOn();

		await previewPage.reload( {
			waitFor: [ 'networkidle0', 'domcontentloaded' ],
		} );

		/*
			Count instances of the tag to make sure that it's been loaded only once,
			regardless of the number of navigation blocks present.
		*/
		const tagCount = await previewPage.evaluate(
			() =>
				Array.from(
					document.querySelectorAll(
						'script[src*="navigation/frontend.js"]'
					)
				).length
		);

		expect( tagCount ).toBe( 1 );
	} );

	it( 'loads frontend code only if responsiveness is turned on', async () => {
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

		await insertBlock( 'Navigation' );
		await saveDraft();

		const previewPage = await openPreviewPage();
		let isScriptLoaded = await previewPage.evaluate(
			() =>
				null !==
				document.querySelector(
					'script[src*="navigation/frontend.js"]'
				)
		);

		expect( isScriptLoaded ).toBe( false );

		await createNavBlockWithAllPages();

		await turnResponsivenessOn();

		await previewPage.reload( {
			waitFor: [ 'networkidle0', 'domcontentloaded' ],
		} );

		isScriptLoaded = await previewPage.evaluate(
			() =>
				null !==
				document.querySelector(
					'script[src*="navigation/frontend.js"]'
				)
		);

		expect( isScriptLoaded ).toBe( true );
	} );
} );
