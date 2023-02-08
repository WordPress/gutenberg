/**
 * WordPress dependencies
 */
import {
	clickButton,
	clickOnMoreMenuItem,
	createJSONResponse,
	createNewPost,
	createMenu as createClassicMenu,
	deleteAllMenus as deleteAllClassicMenus,
	insertBlock,
	setUpResponseMocking,
	pressKeyWithModifier,
	saveDraft,
	showBlockToolbar,
	openPreviewPage,
	ensureSidebarOpened,
	__experimentalRest as rest,
	__experimentalBatch as batch,
	publishPost,
	createUser,
	loginUser,
	deleteUser,
	switchUserToAdmin,
	clickBlockToolbarButton,
	openListView,
	getListViewBlocks,
} from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import menuItemsFixture from '../fixtures/menu-items-request-fixture.json';

const POSTS_ENDPOINT = '/wp/v2/posts';
const PAGES_ENDPOINT = '/wp/v2/pages';
const DRAFT_PAGES_ENDPOINT = [ PAGES_ENDPOINT, { status: 'draft' } ];
const NAVIGATION_MENUS_ENDPOINT = '/wp/v2/navigation';
// todo: consolidate with logic found in navigation-editor tests
// https://github.com/WordPress/gutenberg/blob/trunk/packages/e2e-tests/specs/experiments/navigation-editor.test.js#L71
const REST_PAGES_ROUTES = [
	'/wp/v2/pages',
	`rest_route=${ encodeURIComponent( '/wp/v2/pages' ) }`,
];
let uniqueId = 0;

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

function getPagesMocks( responsesByMethod ) {
	return getEndpointMocks( REST_PAGES_ROUTES, responsesByMethod );
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
}

async function forceSelectNavigationBlock() {
	const navBlock = await waitForBlock( 'Navigation' );

	if ( ! navBlock ) {
		return;
	}

	await page.evaluate( () => {
		const blocks = wp.data.select( 'core/block-editor' ).getBlocks();
		const navigationBlock = blocks.find(
			( block ) => block.name === 'core/navigation'
		);

		if ( ! navigationBlock ) {
			return;
		}

		return wp.data
			.dispatch( 'core/block-editor' )
			.selectBlock( navigationBlock?.clientId, 0 );
	} );
}

/**
 * Interacts with the LinkControl to perform a search and select a returned suggestion
 *
 * @param {Object} link       link object to be tested
 * @param {string} link.url   What will be typed in the search input
 * @param {string} link.label What the resulting label will be in the creating Link Block after the block is created.
 * @param {string} link.type  What kind of suggestion should be clicked, ie. 'url', 'create', or 'entity'
 */
async function updateActiveNavigationLink( { url, label, type } ) {
	const typeClasses = {
		create: 'block-editor-link-control__search-create',
		entity: 'is-entity',
		url: 'is-url',
	};

	if ( url ) {
		const input = await page.waitForSelector(
			'input[placeholder="Search or type url"]'
		);
		await input.type( url );

		const suggestionPath = `//button[contains(@class, 'block-editor-link-control__search-item') and contains(@class, '${ typeClasses[ type ] }') and contains(., "${ url }")]`;

		// Wait for the autocomplete suggestion item to appear.
		await page.waitForXPath( suggestionPath );
		// Set the suggestion.
		const suggestion = await page.waitForXPath( suggestionPath );

		// Select it (so we're clicking the right one, even if it's further down the list).
		await suggestion.click();
	}

	if ( label ) {
		// Wait for rich text editor input to be focused before we start typing the label.
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

async function selectClassicMenu( optionText ) {
	const navigationSelector = await page.waitForXPath(
		"//button[text()='Select Menu']"
	);
	await navigationSelector.click();

	const theOption = await page.waitForXPath(
		'//button[contains(., "' + optionText + '")]'
	);
	await theOption.click();

	await page.waitForResponse(
		( response ) =>
			response.url().includes( 'menu-items' ) && response.status() === 200
	);
}

/**
 * Delete all items for the given REST resources using the REST API.
 *
 * @param {*} endpoints The endpoints of the resources to delete.
 */
async function deleteAll( endpoints ) {
	for ( const endpoint of endpoints ) {
		const defaultArgs = { per_page: -1 };
		const isArrayEndpoint = Array.isArray( endpoint );
		const path = isArrayEndpoint ? endpoint[ 0 ] : endpoint;
		const args = isArrayEndpoint
			? { ...defaultArgs, ...endpoint[ 1 ] }
			: defaultArgs;

		const items = await rest( {
			path: addQueryArgs( path, args ),
		} );

		for ( const item of items ) {
			await rest( {
				method: 'DELETE',
				path: `${ path }/${ item.id }?force=true`,
			} );
		}
	}
}

/**
 * Replace unique ids in nav block content, since these won't be consistent
 * between test runs.
 *
 * @param {string} content HTML block content, either raw or rendered.
 *
 * @return {string} HTML block content with stripped ids
 */
function stripPageIds( content ) {
	return content
		.replace( /page_id=\d+/gm, 'page_id=[number]' )
		.replace( /"id":\d+/gm, '"id":[number]' );
}

/**
 * Check navigation block content by fetching the navigation menu.
 *
 * @return {string} Menu content.
 */
async function getNavigationMenuRawContent() {
	const menuRef = await page.evaluate( () => {
		const blocks = wp.data.select( 'core/block-editor' ).getBlocks();
		const navigationBlock = blocks.find(
			( block ) => block.name === 'core/navigation'
		);

		return navigationBlock.attributes.ref;
	} );

	if ( ! menuRef ) {
		throw 'getNavigationMenuRawContent was unable to find a ref attribute on the first navigation block';
	}

	const response = await rest( {
		method: 'GET',
		path: `/wp/v2/navigation/${ menuRef }?context=edit`,
	} );

	return stripPageIds( response.content.raw );
}

async function waitForBlock( blockName ) {
	const blockSelector = `[aria-label="Editor content"][role="region"] [aria-label="Block: ${ blockName }"]`;

	// Wait for a Submenu block before making assertion.
	return page.waitForSelector( blockSelector );
}

// Disable reason - these tests are to be re-written.
// Skipped temporarily due to issues with GH actions: https://wordpress.slack.com/archives/C02QB2JS7/p1661331673166269.
// eslint-disable-next-line jest/no-disabled-tests
describe.skip( 'Navigation', () => {
	const contributorUsername = `contributoruser_${ ++uniqueId }`;
	let contributorPassword;

	beforeAll( async () => {
		// Creation of the contributor user **MUST** be at the top level describe block
		// otherwise this test will become unstable. This action only happens once
		// so there is no huge performance hit.
		contributorPassword = await createUser( contributorUsername, {
			role: 'contributor',
		} );
	} );

	beforeEach( async () => {
		await deleteAll( [
			POSTS_ENDPOINT,
			PAGES_ENDPOINT,
			DRAFT_PAGES_ENDPOINT,
			NAVIGATION_MENUS_ENDPOINT,
		] );
		await deleteAllClassicMenus();
	} );

	afterEach( async () => {
		await setUpResponseMocking( [] );
	} );

	afterAll( async () => {
		await deleteAll( [
			POSTS_ENDPOINT,
			PAGES_ENDPOINT,
			DRAFT_PAGES_ENDPOINT,
			NAVIGATION_MENUS_ENDPOINT,
		] );
		await deleteAllClassicMenus();

		// As per the creation in the beforeAll() above, this
		// action must be done at the root level describe() block.
		await deleteUser( contributorUsername );
	} );

	describe( 'loading states', () => {
		it( 'does not show a loading indicator if there is no ref to a Navigation post and Nav Menus have loaded', async () => {
			await createNewPost();

			// Insert an empty block to trigger resolution of Nav Menu items.
			await insertBlock( 'Navigation' );
			await waitForBlock( 'Navigation' );

			await page.waitForXPath( "//button[text()='Select Menu']" );

			// Now we have Nav Menu items resolved. Continue to assert.
			await clickOnMoreMenuItem( 'Code editor' );

			const codeEditorInput = await page.waitForSelector(
				'.editor-post-text-editor'
			);

			// Simulate block behaviour when loading a page containing an unconfigured Nav block
			// that is not selected.
			await codeEditorInput.click();
			const markup = '<!-- wp:navigation /-->';
			await page.keyboard.type( markup );
			await clickButton( 'Exit code editor' );

			// Wait for block to render...
			const navBlock = await waitForBlock( 'Navigation' );

			// Test specifically for the primary loading indicator because a spinner also exists
			// in the hidden Placeholder component when it is loading.
			const loadingSpinner = await navBlock.$(
				'.wp-block-navigation__loading-indicator.components-spinner'
			);

			// We should not see the loading state if the block has not been configured and is empty.
			expect( loadingSpinner ).toBeNull();
		} );

		// Skip reason: This test is quite flaky recently.
		// See https://github.com/WordPress/gutenberg/issues/39231.
		// eslint-disable-next-line jest/no-disabled-tests
		it.skip( 'shows a loading indicator whilst ref resolves to Navigation post items', async () => {
			const testNavId = 1;

			let resolveNavigationRequest;

			// Mock the request for the single Navigation post in order to fully
			// control the resolution of the request. This will enable the ability
			// to assert on how the UI responds during the API resolution without
			// relying on variable factors such as network conditions.
			await setUpResponseMocking( [
				{
					match: ( request ) => {
						return decodeURIComponent( request.url() ).includes(
							`navigation/`
						);
					},
					onRequestMatch: ( request ) => {
						// The Promise simulates a REST API request whose resolultion
						// the test has full control over.
						return new Promise( ( resolve ) => {
							// Assign the resolution function to the var in the
							// upper scope to afford control over resolution.
							resolveNavigationRequest = resolve;

							// Call request.continue() is required to fully resolve the mock.
						} ).then( () => request.continue() );
					},
				},
			] );
			/*
Expected mock function not to be called but it was called with: ["POST", "http://localhost:8889/wp-admin/admin-ajax.php", "http://localhost:8889/wp-admin/admin-ajax.php"],["GET", "http://localhost:8889/wp-admin/post-new.php", "http://localhost:8889/wp-admin/post-new.php"],["GET", "http://localhost:8889/wp-includes/js/mediaelement/mediaelementplayer-legacy.min.css?ver=4.2.16", "http://localhost:8889/wp-includes/js/mediaelement/mediaelementplayer-legacy.min.css?ver=4.2.16"],["GET", "http://localhost:8889/wp-includes/js/mediaelement/wp-mediaelement.min.css?ver=6.1-alpha-53506", "http://localhost:8889/wp-includes/js/mediaelement/wp-mediaelement.min.css?ver=6.1-alpha-53506"],["GET", "http://localhost:8889/wp-includes/js/imgareaselect/imgareaselect.css?ver=0.9.8", "http://localhost:8889/wp-includes/js/imgareaselect/imgareaselect.css?ver=0.9.8"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/components/style.css?ver=1655290402", "http://localhost:8889/wp-content/plugins/gutenberg/build/components/style.css?ver=1655290402"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/block-editor/style.css?ver=1655290402", "http://localhost:8889/wp-content/plugins/gutenberg/build/block-editor/style.css?ver=1655290402"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/nux/style.css?ver=1655290402", "http://localhost:8889/wp-content/plugins/gutenberg/build/nux/style.css?ver=1655290402"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/reusable-blocks/style.css?ver=1655290402", "http://localhost:8889/wp-content/plugins/gutenberg/build/reusable-blocks/style.css?ver=1655290402"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/editor/style.css?ver=1655290402", "http://localhost:8889/wp-content/plugins/gutenberg/build/editor/style.css?ver=1655290402"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/block-library/reset.css?ver=1655290402", "http://localhost:8889/wp-content/plugins/gutenberg/build/block-library/reset.css?ver=1655290402"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/block-library/style.css?ver=1655290402", "http://localhost:8889/wp-content/plugins/gutenberg/build/block-library/style.css?ver=1655290402"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/edit-post/classic.css?ver=1655290402", "http://localhost:8889/wp-content/plugins/gutenberg/build/edit-post/classic.css?ver=1655290402"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/block-library/editor.css?ver=1655290402", "http://localhost:8889/wp-content/plugins/gutenberg/build/block-library/editor.css?ver=1655290402"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/edit-post/style.css?ver=1655290402", "http://localhost:8889/wp-content/plugins/gutenberg/build/edit-post/style.css?ver=1655290402"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/block-directory/style.css?ver=1655290402", "http://localhost:8889/wp-content/plugins/gutenberg/build/block-directory/style.css?ver=1655290402"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/format-library/style.css?ver=1655290402", "http://localhost:8889/wp-content/plugins/gutenberg/build/format-library/style.css?ver=1655290402"],["GET", "http://localhost:8889/wp-content/themes/twentytwentyone/assets/css/custom-color-overrides.css?ver=1.6", "http://localhost:8889/wp-content/themes/twentytwentyone/assets/css/custom-color-overrides.css?ver=1.6"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/block-library/theme.css?ver=1655290402", "http://localhost:8889/wp-content/plugins/gutenberg/build/block-library/theme.css?ver=1655290402"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/blob/index.min.js?ver=bccaf46e493181a8db9a", "http://localhost:8889/wp-content/plugins/gutenberg/build/blob/index.min.js?ver=bccaf46e493181a8db9a"],["GET", "http://localhost:8889/wp-content/plugins/gutenberg/build/autop/index.min.js?ver=b1a2f86387be4fa46f89", "http://loca
 */
			await createNewPost();
			await clickOnMoreMenuItem( 'Code editor' );
			const codeEditorInput = await page.waitForSelector(
				'.editor-post-text-editor'
			);
			await codeEditorInput.click();

			// The ID used in this `ref` is that which we mock in the request
			// above to ensure we can control the resolution of the Navigation post.
			const markup = `<!-- wp:navigation {"ref":${ testNavId }} /-->`;
			await page.keyboard.type( markup );
			await clickButton( 'Exit code editor' );

			const navBlock = await waitForBlock( 'Navigation' );

			// Check for the spinner to be present whilst loading.
			await navBlock.waitForSelector( '.components-spinner' );

			// Resolve the controlled mocked API request.
			if ( typeof resolveNavigationRequest === 'function' ) {
				resolveNavigationRequest();
			}
		} );

		it( 'shows a loading indicator whilst empty Navigation menu is being created', async () => {
			const testNavId = 1;

			let resolveNavigationRequest;

			// Mock the request for the single Navigation post in order to fully
			// control the resolution of the request. This will enable the ability
			// to assert on how the UI responds during the API resolution without
			// relying on variable factors such as network conditions.
			await setUpResponseMocking( [
				{
					match: ( request ) =>
						request.url().includes( `rest_route` ) &&
						request.url().includes( `navigation` ) &&
						request.url().includes( `${ testNavId }?` ),
					onRequestMatch: ( request ) => {
						// The Promise simulates a REST API request whose resolultion
						// the test has full control over.
						return new Promise( ( resolve ) => {
							// Assign the resolution function to the var in the
							// upper scope to afford control over resolution.
							resolveNavigationRequest = resolve;

							// Call request.continue() is required to fully resolve the mock.
						} ).then( () => request.continue() );
					},
				},
			] );

			await createNewPost();
			await insertBlock( 'Navigation' );

			const navBlock = await waitForBlock( 'Navigation' );

			// Create empty Navigation block with no items
			const navigationSelector = await page.waitForXPath(
				"//button[text()='Select Menu']"
			);
			await navigationSelector.click();

			const createNewMenuButton = await page.waitForXPath(
				'//button[contains(., "Create new menu")]'
			);
			await createNewMenuButton.click();

			// Check for the spinner to be present whilst loading.
			await navBlock.waitForSelector( '.components-spinner' );

			// Resolve the controlled mocked API request.
			if ( typeof resolveNavigationRequest === 'function' ) {
				resolveNavigationRequest();
			}
		} );
	} );

	describe( 'Placeholder', () => {
		describe( 'fallback states', () => {
			it( 'shows page list on insertion of block', async () => {
				await createNewPost();
				await insertBlock( 'Navigation' );
				await waitForBlock( 'Page List' );
			} );

			it( 'shows placeholder preview when block with no menu items is not selected', async () => {
				await createNewPost();
				await insertBlock( 'Navigation' );

				const navigationSelector = await page.waitForXPath(
					"//button[text()='Select Menu']"
				);
				await navigationSelector.click();

				const createNewMenuButton = await page.waitForXPath(
					'//button[contains(., "Create new menu")]'
				);
				await createNewMenuButton.click();

				// Wait for Navigation creation to complete.
				await page.waitForXPath(
					'//*[contains(@class, "components-snackbar")]/*[text()="Navigation Menu successfully created."]'
				);

				// Wait for block to resolve
				let navBlock = await waitForBlock( 'Navigation' );

				// Deselect the Nav block by inserting a new block at the root level
				// outside of the Nav block.
				await insertBlock( 'Paragraph' );

				// Acquire fresh reference to block
				navBlock = await waitForBlock( 'Navigation' );

				// Check Placeholder Preview is visible.
				await navBlock.waitForSelector(
					'.wp-block-navigation-placeholder__preview',
					{ visible: true }
				);

				// Check the block's appender is not visible.
				const blockAppender = await navBlock.$(
					'.block-list-appender'
				);

				expect( blockAppender ).toBeNull();
			} );
		} );

		describe( 'menu selector actions', () => {
			it( 'allows a navigation block to be created from existing menus', async () => {
				await createClassicMenu( { name: 'Test Menu 1' } );
				await createClassicMenu(
					{ name: 'Test Menu 2' },
					menuItemsFixture
				);

				await createNewPost();
				await insertBlock( 'Navigation' );
				await selectClassicMenu( 'Test Menu 2' );

				// Wait for a navigation link block before making assertion.
				await page.waitForSelector(
					'*[aria-label="Block: Custom Link"]'
				);
				expect( await getNavigationMenuRawContent() ).toMatchSnapshot();
			} );

			it( 'creates an empty navigation block when the selected existing menu is also empty', async () => {
				await createClassicMenu( { name: 'Test Menu 1' } );
				await createNewPost();
				await insertBlock( 'Navigation' );
				await selectClassicMenu( 'Test Menu 1' );

				await page.waitForNetworkIdle();

				// Wait for the appender so that we know the navigation menu was created.
				await page.waitForSelector(
					'nav[aria-label="Block: Navigation"] button[aria-label="Add block"]'
				);
				expect( await getNavigationMenuRawContent() ).toMatchSnapshot();
			} );

			it( 'does not display the options to create from existing menus if there are no existing menus', async () => {
				await createNewPost();

				await insertBlock( 'Navigation' );

				const navigationSelector = await page.waitForXPath(
					"//button[text()='Select Menu']"
				);
				await navigationSelector.click();

				await page.waitForXPath(
					'//button[contains(., "Create new menu")]'
				);

				await page.waitForSelector( '.components-menu-group' );

				const placeholderActionsLength = await page.$$eval(
					'.components-menu-group',
					( els ) => els.length
				);

				// Should only be showing "Create new menu".
				expect( placeholderActionsLength ).toEqual( 1 );
			} );
		} );
	} );

	it( 'allows an empty navigation block to be created and manually populated using a mixture of internal and external links', async () => {
		await createNewPost();
		await insertBlock( 'Navigation' );

		await showBlockToolbar();

		const navigationSelector = await page.waitForXPath(
			"//button[text()='Select Menu']"
		);
		await navigationSelector.click();

		const createNewMenuButton = await page.waitForXPath(
			'//button[contains(., "Create new menu")]'
		);
		await createNewMenuButton.click();

		await page.waitForNetworkIdle();

		// Await "success" notice.
		await page.waitForXPath(
			'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
		);

		const appender = await page.waitForSelector(
			'.wp-block-navigation .block-editor-button-block-appender'
		);
		await appender.click();

		// Add a link to the Link block.
		await updateActiveNavigationLink( {
			url: 'https://wordpress.org',
			label: 'WP',
			type: 'url',
		} );

		// Select the parent navigation block to show the appender.
		await showBlockToolbar();
		await page.click( 'button[aria-label="Select Navigation"]' );

		const appenderAgain = await page.waitForSelector(
			'.wp-block-navigation .block-list-appender'
		);
		await appenderAgain.click();

		// After adding a new block, search input should be shown immediately.
		// Verify that Escape would close the popover.
		// Regression: https://github.com/WordPress/gutenberg/pull/19885
		// Wait for URL input to be focused.
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

		// Click the link placeholder.
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

		await publishPost();

		// Expect a Navigation Block with two Links in the snapshot.
		expect( await getNavigationMenuRawContent() ).toMatchSnapshot();
	} );

	it( 'encodes URL when create block if needed', async () => {
		await createNewPost();
		await insertBlock( 'Navigation' );
		const navigationSelector = await page.waitForXPath(
			"//button[text()='Select Menu']"
		);
		await navigationSelector.click();

		const createNewMenuButton = await page.waitForXPath(
			'//button[contains(., "Create new menu")]'
		);
		await createNewMenuButton.click();

		await page.waitForNetworkIdle();

		// Await "success" notice.
		await page.waitForXPath(
			'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
		);

		const appender = await page.waitForSelector(
			'.wp-block-navigation .block-editor-button-block-appender'
		);
		await appender.click();

		// Add a link to the Link block.
		await updateActiveNavigationLink( {
			url: 'https://wordpress.org/шеллы',
			type: 'url',
		} );

		await showBlockToolbar();
		await page.click( 'button[aria-label="Select Navigation"]' );

		const appenderAgain = await page.waitForSelector(
			'.wp-block-navigation .block-list-appender'
		);
		await appenderAgain.click();

		// Wait for URL input to be focused.
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

		// Click the link placeholder.
		const placeholder = await page.waitForSelector(
			'.wp-block-navigation-link__placeholder'
		);
		await placeholder.click();

		// Mocked response for internal page.
		// We are encoding the slug/url in order
		// that we can assert it is not double encoded by the block.
		await mockSearchResponse( [
			{ title: 'お問い合わせ', slug: encodeURI( 'お問い合わせ' ) },
		] );

		// Select the mocked internal page above.
		await updateActiveNavigationLink( {
			url: 'お問い合わせ',
			type: 'entity',
		} );

		await publishPost();

		// Expect a Navigation Block with two Links in the snapshot.
		// The 2nd link should not be double encoded.
		expect( await getNavigationMenuRawContent() ).toMatchSnapshot();
	} );

	it( 'allows pages to be created from the navigation block and their links added to menu', async () => {
		await createNewPost();
		await insertBlock( 'Navigation' );

		const navigationSelector = await page.waitForXPath(
			"//button[text()='Select Menu']"
		);
		await navigationSelector.click();

		const createNewMenuButton = await page.waitForXPath(
			'//button[contains(., "Create new menu")]'
		);
		await createNewMenuButton.click();

		await page.waitForNetworkIdle();

		// Await "success" notice.
		await page.waitForXPath(
			'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
		);

		const appender = await page.waitForSelector(
			'.wp-block-navigation .block-editor-button-block-appender'
		);
		await appender.click();

		// Wait for URL input to be focused
		// Insert name for the new page.
		const pageTitle = 'A really long page name that will not exist';
		const input = await page.waitForSelector(
			'input.block-editor-url-input__input:focus'
		);
		await input.type( pageTitle );

		// When creating a page, the URLControl makes a request to the
		// url-details endpoint to fetch information about the page.
		// Because the draft is inaccessible publicly, this request
		// returns a 404 response. Wait for the response and expect
		// the error to have occurred.
		const createPageButton = await page.waitForSelector(
			'.block-editor-link-control__search-create'
		);
		const responsePromise = page.waitForResponse(
			( response ) =>
				response.url().includes( 'url-details' ) &&
				response.status() === 404
		);
		const createPagePromise = createPageButton.click();
		await Promise.all( [ responsePromise, createPagePromise ] );

		// Creating a draft is async, so wait for a sign of completion. In this
		// case the link that shows in the URL popover once a link is added.
		await page.waitForXPath(
			`//a[contains(@class, "block-editor-link-control__search-item-title") and contains(., "${ pageTitle }")]`
		);

		await publishPost();

		// Expect a Navigation Block with a link for "A really long page name that will not exist".
		expect( await getNavigationMenuRawContent() ).toMatchSnapshot();
		expect( console ).toHaveErroredWith(
			'Failed to load resource: the server responded with a status of 404 (Not Found)'
		);
	} );

	it( 'correctly decodes special characters in the created Page title for display', async () => {
		await createNewPost();
		await insertBlock( 'Navigation' );

		const navigationSelector = await page.waitForXPath(
			"//button[text()='Select Menu']"
		);
		await navigationSelector.click();

		const createNewMenuButton = await page.waitForXPath(
			'//button[contains(., "Create new menu")]'
		);
		await createNewMenuButton.click();

		await page.waitForNetworkIdle();

		// Await "success" notice.
		await page.waitForXPath(
			'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
		);

		const appender = await page.waitForSelector(
			'.wp-block-navigation .block-editor-button-block-appender'
		);
		await appender.click();

		// Wait for URL input to be focused
		// Insert name for the new page.
		const pageTitle = 'This & That & Some < other > chars';
		const input = await page.waitForSelector(
			'input.block-editor-url-input__input:focus'
		);
		await input.type( pageTitle );

		// When creating a page, the URLControl makes a request to the
		// url-details endpoint to fetch information about the page.
		// Because the draft is inaccessible publicly, this request
		// returns a 404 response. Wait for the response and expect
		// the error to have occurred.
		const createPageButton = await page.waitForSelector(
			'.block-editor-link-control__search-create'
		);
		const responsePromise = page.waitForResponse(
			( response ) =>
				response.url().includes( 'url-details' ) &&
				response.status() === 404
		);
		const createPagePromise = createPageButton.click();
		await Promise.all( [ responsePromise, createPagePromise ] );

		await waitForBlock( 'Navigation' );

		const innerLinkBlock = await waitForBlock( 'Custom Link' );

		const linkText = await innerLinkBlock.$eval(
			'[aria-label="Navigation link text"]',
			( element ) => {
				return element.innerText;
			}
		);

		expect( linkText ).toContain( pageTitle );

		expect( console ).toHaveErroredWith(
			'Failed to load resource: the server responded with a status of 404 (Not Found)'
		);
	} );

	it( 'renders buttons for the submenu opener elements when the block is set to open on click instead of hover', async () => {
		await createClassicMenu( { name: 'Test Menu 2' }, menuItemsFixture );
		await createNewPost();
		await insertBlock( 'Navigation' );
		await selectClassicMenu( 'Test Menu 2' );

		await ensureSidebarOpened();
		const openOnClickButton = await page.waitForXPath(
			'//label[contains(text(),"Open on click")]'
		);

		await openOnClickButton.click();

		await saveDraft();

		// Scope element selector to the Editor's "Content" region as otherwise it picks up on
		// block previews.
		const navSubmenuSelector =
			'[aria-label="Editor content"][role="region"] [aria-label="Block: Submenu"]';

		await page.waitForSelector( navSubmenuSelector );

		const navSubmenusLength = await page.$$eval(
			navSubmenuSelector,
			( els ) => els.length
		);

		const navButtonTogglesSelector =
			'[aria-label="Editor content"][role="region"] [aria-label="Block: Submenu"] button.wp-block-navigation-item__content';

		await page.waitForSelector( navButtonTogglesSelector );

		const navButtonTogglesLength = await page.$$eval(
			navButtonTogglesSelector,
			( els ) => els.length
		);

		// Assert the correct number of button toggles are present.
		expect( navSubmenusLength ).toEqual( navButtonTogglesLength );
	} );

	it( 'Shows the quick inserter when the block contains non-navigation specific blocks', async () => {
		await createNewPost();
		await insertBlock( 'Navigation' );

		const navigationSelector = await page.waitForXPath(
			"//button[text()='Select Menu']"
		);
		await navigationSelector.click();

		const createNewMenuButton = await page.waitForXPath(
			'//button[contains(., "Create new menu")]'
		);
		await createNewMenuButton.click();

		await page.waitForNetworkIdle();

		// Await "success" notice.
		await page.waitForXPath(
			'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
		);

		const appender = await page.waitForSelector(
			'.wp-block-navigation .block-editor-button-block-appender'
		);
		await appender.click();

		// Add a link to the Link block.
		await updateActiveNavigationLink( {
			url: 'https://wordpress.org',
			label: 'WP',
			type: 'url',
		} );

		// Now add a different block type.
		await insertBlock( 'Site Title' );

		await showBlockToolbar();
		await page.click( 'button[aria-label="Select Navigation"]' );
		const appenderAgain = await page.waitForSelector(
			'.wp-block-navigation .block-list-appender'
		);
		await appenderAgain.click();

		const quickInserter = await page.waitForSelector(
			'.block-editor-inserter__quick-inserter'
		);

		// Expect the quick inserter to be truthy, which it will be because we
		// waited for it. It's nice to end a test with an assertion though.
		expect( quickInserter ).toBeTruthy();
	} );

	describe( 'Creating and restarting', () => {
		const NAV_ENTITY_SELECTOR =
			'//div[@class="entities-saved-states__panel"]//label//strong[contains(text(), "Navigation")]';

		it( 'respects the nesting level', async () => {
			await createNewPost();

			await insertBlock( 'Navigation' );

			const navBlock = await waitForBlock( 'Navigation' );

			const navigationSelector = await page.waitForXPath(
				"//button[text()='Select Menu']"
			);
			await navigationSelector.click();

			const createNewMenuButton = await page.waitForXPath(
				'//button[contains(., "Create new menu")]'
			);
			await createNewMenuButton.click();

			await page.waitForNetworkIdle();

			// Await "success" notice.
			await page.waitForXPath(
				'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
			);

			const appender = await page.waitForSelector(
				'.wp-block-navigation .block-editor-button-block-appender'
			);
			await appender.click();

			await clickOnMoreMenuItem( 'Code editor' );
			const codeEditorInput = await page.waitForSelector(
				'.editor-post-text-editor'
			);

			let code = await codeEditorInput.evaluate( ( el ) => el.value );
			code = code.replace( '} /-->', ',"maxNestingLevel":0} /-->' );
			await codeEditorInput.evaluate(
				( el, newCode ) => ( el.value = newCode ),
				code
			);
			await clickButton( 'Exit code editor' );

			const blockAppender = navBlock.$( '.block-list-appender' );

			expect( blockAppender ).not.toBeNull();

			// Check the Submenu block is no longer present.
			const navSubmenuSelector =
				'[aria-label="Editor content"][role="region"] [aria-label="Block: Submenu"]';
			const submenuBlock = await page.$( navSubmenuSelector );

			expect( submenuBlock ).toBeFalsy();
		} );

		it( 'retains initial uncontrolled inner blocks whilst there are no modifications to those blocks', async () => {
			await createNewPost();
			await clickOnMoreMenuItem( 'Code editor' );
			const codeEditorInput = await page.waitForSelector(
				'.editor-post-text-editor'
			);
			await codeEditorInput.click();

			const markup =
				'<!-- wp:navigation --><!-- wp:page-list /--><!-- /wp:navigation -->';
			await page.keyboard.type( markup );
			await clickButton( 'Exit code editor' );

			const navBlock = await waitForBlock( 'Navigation' );

			// Select the block
			await navBlock.click();

			const hasUncontrolledInnerBlocks = await page.evaluate( () => {
				const blocks = wp.data
					.select( 'core/block-editor' )
					.getBlocks();
				return !! blocks[ 0 ]?.innerBlocks?.length;
			} );

			expect( hasUncontrolledInnerBlocks ).toBe( true );
		} );

		it( 'converts uncontrolled inner blocks to an entity when modifications are made to the blocks', async () => {
			await rest( {
				method: 'POST',
				path: `/wp/v2/pages/`,
				data: {
					status: 'publish',
					title: 'A Test Page',
					content: 'Hello world',
				},
			} );

			// Insert 'old-school' inner blocks via the code editor.
			await createNewPost();
			await clickOnMoreMenuItem( 'Code editor' );
			const codeEditorInput = await page.waitForSelector(
				'.editor-post-text-editor'
			);
			await codeEditorInput.click();
			const markup =
				'<!-- wp:navigation --><!-- wp:page-list /--><!-- /wp:navigation -->';
			await page.keyboard.type( markup );

			await clickButton( 'Exit code editor' );

			const navBlock = await waitForBlock( 'Navigation' );

			await navBlock.click();

			// Wait for the Page List to have resolved and render as a `<ul>`.
			await page.waitForSelector(
				`[aria-label="Editor content"][role="region"] ul[aria-label="Block: Page List"]`
			);

			// Select the Page List block.
			await openListView();

			const navExpander = await page.waitForXPath(
				`//a[.//span[text()='Navigation']]/span[contains(@class, 'block-editor-list-view__expander')]`
			);

			await navExpander.click();

			const pageListBlock = (
				await getListViewBlocks( 'Page List' )
			 )[ 0 ];

			await pageListBlock.click();

			// Modify the uncontrolled inner blocks by converting Page List.
			await clickBlockToolbarButton( 'Edit' );

			// Must wait for button to be enabled.
			const convertButton = await page.waitForXPath(
				`//button[not(@disabled) and text()="Convert"]`
			);

			await convertButton.click();

			// Wait for new Nav Menu entity to be created as a result of the modification to inner blocks.
			await page.waitForXPath(
				`//*[contains(@class, 'components-snackbar__content')][ text()="New Navigation Menu created." ]`
			);

			await publishPost();

			// Check that the wp_navigation post exists and has the page list block.
			expect( await getNavigationMenuRawContent() ).toMatchSnapshot();
		} );

		it( 'only updates a single entity currently linked with the block', async () => {
			await createNewPost();
			await insertBlock( 'Navigation' );

			const navigationSelector = await page.waitForXPath(
				"//button[text()='Select Menu']"
			);
			await navigationSelector.click();

			const createNewMenuButton = await page.waitForXPath(
				'//button[contains(., "Create new menu")]'
			);
			await createNewMenuButton.click();

			await page.waitForNetworkIdle();

			// Await "success" notice.
			await page.waitForXPath(
				'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
			);

			const appender = await page.waitForSelector(
				'.wp-block-navigation .block-editor-button-block-appender'
			);
			await appender.click();

			// Confirm that the menu entity was updated.
			const publishPanelButton = await page.waitForSelector(
				'.editor-post-publish-panel__toggle:not([aria-disabled="true"])'
			);
			await publishPanelButton.click();

			await page.waitForXPath( NAV_ENTITY_SELECTOR );
			expect( await page.$x( NAV_ENTITY_SELECTOR ) ).toHaveLength( 1 );

			// Publish the post.
			const entitySaveButton = await page.waitForSelector(
				'.editor-entities-saved-states__save-button'
			);
			await entitySaveButton.click();
			const publishButton = await page.waitForSelector(
				'.editor-post-publish-button:not([aria-disabled="true"])'
			);
			await publishButton.click();

			// A success notice should show up.
			await page.waitForXPath(
				`//*[contains(@class, 'components-snackbar__content')][ text()="Post published." ]`
			);

			// Now try inserting another Link block via the quick inserter.
			// await page.click( 'nav[aria-label="Block: Navigation"]' );
			await forceSelectNavigationBlock();

			const newNavigationSelector = await page.waitForXPath(
				"//button[text()='Select Menu']"
			);
			await newNavigationSelector.click();

			const newCreateNewMenuButton = await page.waitForXPath(
				'//button[contains(., "Create new menu")]'
			);
			await newCreateNewMenuButton.click();

			await page.waitForNetworkIdle();

			// Await "success" notice.
			await page.waitForXPath(
				'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
			);

			const newAppender = await page.waitForSelector(
				'.wp-block-navigation .block-editor-button-block-appender'
			);
			await newAppender.click();

			// Confirm that only the last menu entity was updated.
			const publishPanelButton2 = await page.waitForSelector(
				'.editor-post-publish-button__button:not([aria-disabled="true"])'
			);
			await publishPanelButton2.click();

			await page.waitForXPath( NAV_ENTITY_SELECTOR );
			expect( await page.$x( NAV_ENTITY_SELECTOR ) ).toHaveLength( 1 );
		} );
	} );

	it( 'applies accessible label to block element', async () => {
		await createNewPost();
		await insertBlock( 'Navigation' );

		const navigationSelector = await page.waitForXPath(
			"//button[text()='Select Menu']"
		);
		await navigationSelector.click();

		const createNewMenuButton = await page.waitForXPath(
			'//button[contains(., "Create new menu")]'
		);
		await createNewMenuButton.click();

		await page.waitForNetworkIdle();

		// Await "success" notice.
		await page.waitForXPath(
			'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
		);

		const appender = await page.waitForSelector(
			'.wp-block-navigation .block-editor-button-block-appender'
		);
		await appender.click();

		// Add a link to the Link block.
		await updateActiveNavigationLink( {
			url: 'https://wordpress.org',
			label: 'WP',
			type: 'url',
		} );

		const previewPage = await openPreviewPage();
		await previewPage.bringToFront();
		await previewPage.waitForNetworkIdle();

		const isAccessibleLabelPresent = await previewPage.$(
			'nav[aria-label="Navigation"]'
		);

		expect( isAccessibleLabelPresent ).toBeTruthy();
	} );

	it( 'does not load the frontend script if no navigation blocks are present', async () => {
		await createNewPost();
		await insertBlock( 'Paragraph' );
		await page.waitForSelector( 'p[data-title="Paragraph"]:focus' );
		await page.keyboard.type( 'Hello' );

		const previewPage = await openPreviewPage();
		await previewPage.bringToFront();
		await previewPage.waitForNetworkIdle();

		const isScriptLoaded = await previewPage.evaluate(
			() =>
				null !==
				document.querySelector(
					'script[src*="navigation/view.min.js"]'
				)
		);

		expect( isScriptLoaded ).toBe( false );
	} );

	it( 'loads the frontend script only once even when multiple navigation blocks are present', async () => {
		await createNewPost();
		await insertBlock( 'Navigation' );

		const navigationSelector = await page.waitForXPath(
			"//button[text()='Select Menu']"
		);
		await navigationSelector.click();

		const createNewMenuButton = await page.waitForXPath(
			'//button[contains(., "Create new menu")]'
		);
		await createNewMenuButton.click();

		await page.waitForNetworkIdle();

		// Await "success" notice.
		await page.waitForXPath(
			'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
		);

		await insertBlock( 'Navigation' );

		const newNavigationSelector = await page.waitForXPath(
			"//button[text()='Select Menu']"
		);
		await newNavigationSelector.click();

		const newCreateNewMenuButton = await page.waitForXPath(
			'//button[contains(., "Create new menu")]'
		);
		await newCreateNewMenuButton.click();

		await page.waitForNetworkIdle();

		// Await "success" notice.
		await page.waitForXPath(
			'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
		);

		const previewPage = await openPreviewPage();
		await previewPage.bringToFront();
		await previewPage.waitForNetworkIdle();

		const tagCount = await previewPage.evaluate(
			() =>
				document.querySelectorAll(
					'script[src*="navigation/view.min.js"]'
				).length
		);

		expect( tagCount ).toBe( 1 );
	} );

	describe( 'Submenus', () => {
		it( 'shows button which converts submenu to link when submenu is not-populated (empty)', async () => {
			const navSubmenuSelector = `[aria-label="Editor content"][role="region"] [aria-label="Block: Submenu"]`;

			await createNewPost();
			await insertBlock( 'Navigation' );

			const navigationSelector = await page.waitForXPath(
				"//button[text()='Select Menu']"
			);
			await navigationSelector.click();

			const createNewMenuButton = await page.waitForXPath(
				'//button[contains(., "Create new menu")]'
			);
			await createNewMenuButton.click();

			await page.waitForNetworkIdle();

			// Await "success" notice.
			await page.waitForXPath(
				'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
			);

			const appender = await page.waitForSelector(
				'.wp-block-navigation .block-editor-button-block-appender'
			);
			await appender.click();

			await clickBlockToolbarButton( 'Add submenu' );

			await waitForBlock( 'Submenu' );

			// Revert the Submenu back to a Navigation Link block.
			await clickBlockToolbarButton( 'Convert to Link' );

			// Check the Submenu block is no longer present.
			const submenuBlock = await page.$( navSubmenuSelector );

			expect( submenuBlock ).toBeFalsy();
		} );

		it( 'shows button to convert submenu to link in disabled state when submenu is populated', async () => {
			await createNewPost();
			await insertBlock( 'Navigation' );

			const navigationSelector = await page.waitForXPath(
				"//button[text()='Select Menu']"
			);
			await navigationSelector.click();

			const createNewMenuButton = await page.waitForXPath(
				'//button[contains(., "Create new menu")]'
			);
			await createNewMenuButton.click();

			await page.waitForNetworkIdle();

			// Await "success" notice.
			await page.waitForXPath(
				'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
			);

			const appender = await page.waitForSelector(
				'.wp-block-navigation .block-editor-button-block-appender'
			);
			await appender.click();

			await updateActiveNavigationLink( {
				url: 'https://make.wordpress.org/core/',
				label: 'Menu item #1',
				type: 'url',
			} );

			await clickBlockToolbarButton( 'Add submenu' );

			await waitForBlock( 'Submenu' );

			// Add a Link block first.
			const SubAppender = await page.waitForSelector(
				'[aria-label="Block: Submenu"] [aria-label="Add block"]'
			);

			await SubAppender.click();

			await updateActiveNavigationLink( {
				url: 'https://make.wordpress.org/core/',
				label: 'Submenu item #1',
				type: 'url',
			} );

			await clickBlockToolbarButton( 'Select Submenu' );

			// Check button exists but is in disabled state.
			const disabledConvertToLinkButton = await page.$$eval(
				'[aria-label="Block tools"] [aria-label="Convert to Link"][disabled]',
				( els ) => els.length
			);

			expect( disabledConvertToLinkButton ).toEqual( 1 );
		} );

		it( 'shows button to convert submenu to link when submenu is populated with a single incomplete link item', async () => {
			// For context on why this test is required please see:
			// https://github.com/WordPress/gutenberg/pull/38203#issuecomment-1027672948.

			await createNewPost();
			await insertBlock( 'Navigation' );

			await clickBlockToolbarButton( 'Select Menu' );

			const createNewMenuButton = await page.waitForXPath(
				'//button[contains(., "Create new menu")]'
			);
			await createNewMenuButton.click();

			await page.waitForNetworkIdle();

			// Await "success" notice.
			await page.waitForXPath(
				'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
			);

			const appender = await page.waitForSelector(
				'.wp-block-navigation .block-editor-button-block-appender'
			);
			await appender.click();

			await updateActiveNavigationLink( {
				url: 'https://make.wordpress.org/core/',
				label: 'Menu item #1',
				type: 'url',
			} );

			await clickBlockToolbarButton( 'Add submenu' );

			await waitForBlock( 'Submenu' );

			// Add a Link block first.
			const subAppender = await page.waitForSelector(
				'[aria-label="Block: Submenu"] [aria-label="Add block"]'
			);

			await subAppender.click();

			// Here we intentionally do not populate the inserted Navigation Link block.
			// Rather we immediaely click away leaving the link in a state where it has
			// no URL of label and can be considered unpopulated.
			await clickBlockToolbarButton( 'Select Submenu' );

			// Check for non-disabled Convert to Link button.
			const convertToLinkButton = await page.$(
				'[aria-label="Block tools"] [aria-label="Convert to Link"]:not([disabled])'
			);

			expect( convertToLinkButton ).toBeTruthy();
		} );
	} );

	describe( 'Permission based restrictions', () => {
		afterEach( async () => {
			await switchUserToAdmin();
		} );

		it.skip( 'shows a warning if user does not have permission to create navigation menus', async () => {
			const noticeText =
				'You do not have permission to create Navigation Menus.';

			// Switch to a Contributor role user - they should not have
			// permission to update Navigations.
			await loginUser( contributorUsername, contributorPassword );

			await createNewPost();
			await insertBlock( 'Navigation' );

			// Make sure the snackbar error shows up.
			await page.waitForXPath(
				`//*[contains(@class, 'components-snackbar__content')][ text()="${ noticeText }" ]`
			);

			// Expect a console 403 for requests to:
			// * /wp/v2/settings?_locale=user
			// * /wp/v2/templates?context=edit&post_type=post&per_page=100&_locale=user
			expect( console ).toHaveErrored();
		} );
	} );

	describe( 'Initial block insertion state', () => {
		async function createNavigationMenu( menu = {} ) {
			return rest( {
				method: 'POST',
				path: '/wp/v2/navigation',
				data: {
					status: 'publish',
					...menu,
				},
			} );
		}

		afterEach( async () => {
			const navMenusEndpoint = '/wp/v2/navigation';
			const allNavMenus = await rest( { path: navMenusEndpoint } );

			if ( ! allNavMenus?.length ) {
				return;
			}

			return batch(
				allNavMenus.map( ( menu ) => ( {
					method: 'DELETE',
					path: `${ navMenusEndpoint }/${ menu.id }?force=true`,
				} ) )
			);
		} );

		it( 'automatically uses the first Navigation Menu if only one is available', async () => {
			await createNavigationMenu( {
				title: 'Example Navigation',
				content:
					'<!-- wp:navigation-link {"label":"WordPress","type":"custom","url":"http://www.wordpress.org/","kind":"custom","isTopLevelLink":true} /-->',
			} );

			await createNewPost();

			await insertBlock( 'Navigation' );

			await waitForBlock( 'Navigation' );

			const innerLinkBlock = await waitForBlock( 'Custom Link' );

			const linkText = await innerLinkBlock.$eval(
				'[aria-label="Navigation link text"]',
				( element ) => {
					return element.innerText;
				}
			);

			expect( linkText ).toBe( 'WordPress' );
		} );

		it( 'does not automatically use the first Navigation Menu if uncontrolled inner blocks are present', async () => {
			const pageTitle = 'A Test Page';

			await createNavigationMenu( {
				title: 'Example Navigation',
				content:
					'<!-- wp:navigation-link {"label":"First Nav Menu Item","type":"custom","url":"http://www.wordpress.org/","kind":"custom","isTopLevelLink":true} /-->',
			} );

			await rest( {
				method: 'POST',
				path: `/wp/v2/pages/`,
				data: {
					status: 'publish',
					title: pageTitle,
					content: 'Hello world',
				},
			} );

			await createNewPost();

			await clickOnMoreMenuItem( 'Code editor' );

			const codeEditorInput = await page.waitForSelector(
				'.editor-post-text-editor'
			);
			await codeEditorInput.click();

			const markup =
				'<!-- wp:navigation --><!-- wp:page-list /--><!-- /wp:navigation -->';
			await page.keyboard.type( markup );
			await clickButton( 'Exit code editor' );

			await waitForBlock( 'Navigation' );

			const hasUncontrolledInnerBlocks = await page.evaluate( () => {
				const blocks = wp.data
					.select( 'core/block-editor' )
					.getBlocks();
				return !! blocks[ 0 ]?.innerBlocks?.length;
			} );

			expect( hasUncontrolledInnerBlocks ).toBe( true );
		} );

		it( 'automatically uses most recent Navigation Menu if more than one exists', async () => {
			await createNavigationMenu( {
				title: 'Example Navigation',
				content:
					'<!-- wp:navigation-link {"label":"WordPress","type":"custom","url":"http://www.wordpress.org/","kind":"custom","isTopLevelLink":true} /-->',
			} );

			await createNavigationMenu( {
				title: 'Second Example Navigation',
				content:
					'<!-- wp:navigation-link {"label":"WordPress","type":"custom","url":"http://www.wordpress.org/","kind":"custom","isTopLevelLink":true} /-->',
			} );

			await createNewPost();

			await insertBlock( 'Navigation' );

			await waitForBlock( 'Navigation' );

			const navigationSelector = await page.waitForXPath(
				"//button[text()='Select Menu']"
			);
			await navigationSelector.click();

			await page.waitForXPath(
				'//button[@aria-checked="true"][contains(., "Second Example Navigation")]'
			);
		} );

		it( 'allows users to manually create new empty menu when block has automatically selected the first available Navigation Menu', async () => {
			await createNavigationMenu( {
				title: 'Example Navigation',
				content:
					'<!-- wp:navigation-link {"label":"WordPress","type":"custom","url":"http://www.wordpress.org/","kind":"custom","isTopLevelLink":true} /-->',
			} );

			await createNewPost();

			await insertBlock( 'Navigation' );

			const navigationSelector = await page.waitForXPath(
				"//button[text()='Select Menu']"
			);
			await navigationSelector.click();

			const createNewMenuButton = await page.waitForXPath(
				'//button[contains(., "Create new menu")]'
			);
			await createNewMenuButton.click();

			await page.waitForNetworkIdle();

			// Await "success" notice.
			await page.waitForXPath(
				'//div[@class="components-snackbar__content"][contains(text(), "Navigation Menu successfully created.")]'
			);
		} );

		it( 'should always focus select menu button after item selection', async () => {
			// Create some navigation menus to work with.
			await createNavigationMenu( {
				title: 'First navigation',
				content:
					'<!-- wp:navigation-link {"label":"WordPress Example Navigation","type":"custom","url":"http://www.wordpress.org/","kind":"custom","isTopLevelLink":true} /-->',
			} );
			await createNavigationMenu( {
				title: 'Second Navigation',
				content:
					'<!-- wp:navigation-link {"label":"WordPress Second Example Navigation","type":"custom","url":"http://www.wordpress.org/","kind":"custom","isTopLevelLink":true} /-->',
			} );

			// Create new post.
			await createNewPost();

			// Insert new block and wait for the insert to complete.
			await insertBlock( 'Navigation' );
			await waitForBlock( 'Navigation' );

			const navigationSelector = await page.waitForXPath(
				"//button[text()='Select Menu']"
			);
			await navigationSelector.click();

			const theOption = await page.waitForXPath(
				"//button[@aria-checked='false'][contains(., 'First navigation')]"
			);
			await theOption.click();

			// Once the options are closed, does select menu button receive focus?
			const selectMenuDropdown2 = await page.$(
				'[aria-label="Select Menu"]'
			);

			await expect( selectMenuDropdown2 ).toHaveFocus();
		} );
	} );
} );
