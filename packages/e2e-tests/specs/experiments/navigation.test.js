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
} from '@wordpress/e2e-test-utils';

/**
 * External dependencies
 */
import menuItemsFixture from 'menu-items-response-fixture.json';

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
				request
					.url()
					.includes(
						`rest_route=${ encodeURIComponent( '/wp/v2/pages' ) }`
					),
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
			match: ( request ) => {
				const isMenusMatch = request
					.url()
					.includes(
						`rest_route=${ encodeURIComponent(
							'/__experimental/menus'
						) }`
					);

				return isMenusMatch;
			},
			onRequestMatch: createJSONResponse( mappedMenus ),
		},
		{
			match: ( request ) => {
				const isMenuItemsMatch = request
					.url()
					.includes(
						`rest_route=${ encodeURIComponent(
							'/__experimental/menu-items'
						) }`
					);

				return isMenuItemsMatch;
			},
			onRequestMatch: createJSONResponse( menuItems ),
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
 * @param {string} link.label What the resulting label will be in the creating Navigation Link Block after the block is created.
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

beforeEach( async () => {
	await createNewPost();
} );

afterEach( async () => {
	await setUpResponseMocking( [] );
} );
describe( 'Navigation', () => {
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

		// Create an empty nav block. The 'create' button is disabled until pages are loaded,
		// so we must wait for it to become not-disabled.
		await page.waitForXPath(
			'//button[text()="Create from all top-level pages"][not(@disabled)]'
		);
		const [ createFromExistingButton ] = await page.$x(
			'//button[text()="Create from all top-level pages"][not(@disabled)]'
		);
		await createFromExistingButton.click();

		// Snapshot should contain the mocked pages.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	describe( 'Creating from existing Menus', () => {
		it( 'allows a navigation block to be created from existing menus', async () => {
			await mockAllMenusResponses();

			// Add the navigation block.
			await insertBlock( 'Navigation' );

			// Create an empty nav block. The UI to create from Menus is disabled until Menus are loaded,
			// so we must wait for it to be available
			await page.waitForXPath( '//option[text()="Test Menu 2"]' );

			// Check the label is present so we can grab it's corresponding select dropdown
			// const [ menuSelectLabel ] = await page.$x(
			// 	'//label[text()="Create from existing Menu"]'
			// );

			// const selectElementId = await page.evaluate( ( theLabelEl ) => {
			// 	return theLabelEl.getAttribute( 'for' );
			// }, menuSelectLabel );

			const [ createFromExistingButton ] = await page.$x(
				'//button[text()="Create from Menu"][not(@disabled)]'
			);

			await createFromExistingButton.click();

			// Scope element selector to the "Editor content" as otherwise it picks up on
			// Block Style live previews.
			const navBlockItemsLength = await page.$$eval(
				'[aria-label="Editor content"] li[aria-label="Block: Navigation Link"]',
				( els ) => els.length
			);

			// We expect 1 because a "placeholder" Nav Item Block is automatically inserted
			expect( navBlockItemsLength ).toEqual( menuItemsFixture.length );

			// Snapshot should contain the mocked menu items.
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'creates an empty navigation block when the selected existing menu is also empty', async () => {
			const emptyMenuItems = [];
			await mockAllMenusResponses( menusFixture, emptyMenuItems );

			// Add the navigation block.
			await insertBlock( 'Navigation' );

			// Create an empty nav block. The UI to create from Menus is disabled until Menus are loaded,
			// so we must wait for it to be available
			await page.waitForXPath( '//option[text()="Test Menu 1"]' );

			const [ createFromExistingButton ] = await page.$x(
				'//button[text()="Create from Menu"][not(@disabled)]'
			);

			await createFromExistingButton.click();

			// Scope element selector to the "Editor content" as otherwise it picks up on
			// Block Style live previews.
			const navBlockItemsLength = await page.$$eval(
				'[aria-label="Editor content"] li[aria-label="Block: Navigation Link"]',
				( els ) => els.length
			);

			// We expect 1 because a "placeholder" Nav Item Block is automatically inserted
			expect( navBlockItemsLength ).toEqual( 1 );

			// Snapshot should contain the mocked menu items.
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'does not display option to create from existing menus if there are no menus', async () => {
			// Force no Menus to be returned by API response.
			await mockAllMenusResponses( [] );

			// Add the navigation block.
			await insertBlock( 'Navigation' );

			// Attempt to find the create Menu button
			const [ createFromExistingButton ] = await page.$x(
				'//button[text()="Create from Menu"][not(@disabled)]'
			);

			expect( createFromExistingButton ).toBeFalsy();

			// Snapshot should contain the mocked menu items.
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	it( 'allows an empty navigation block to be created and manually populated using a mixture of internal and external links', async () => {
		// Add the navigation block.
		await insertBlock( 'Navigation' );

		// Create an empty nav block.
		await page.waitForSelector( '.wp-block-navigation-placeholder' );
		const [ createEmptyButton ] = await page.$x(
			'//button[text()="Create empty"]'
		);
		await createEmptyButton.click();

		// Add a link to the default Navigation Link block.
		await updateActiveNavigationLink( {
			url: 'https://wordpress.org',
			label: 'WP',
			type: 'url',
		} );

		// Move the mouse to reveal the block movers. Without this the test seems to fail.
		await page.mouse.move( 100, 100 );

		// Add another Navigation Link block.
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

		// Add a link to the default Navigation Link block.
		await updateActiveNavigationLink( {
			url: 'Get in Touch',
			label: 'Contact',
			type: 'entity',
		} );

		// Expect a Navigation Block with two Navigation Links in the snapshot.
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
		await page.waitForSelector( '.wp-block-navigation-placeholder' );
		const [ createEmptyButton ] = await page.$x(
			'//button[text()="Create empty"]'
		);
		await createEmptyButton.click();

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
