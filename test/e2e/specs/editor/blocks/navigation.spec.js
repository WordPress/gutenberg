/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Internal dependencies
 */
const menuItemsFixture = require( './fixtures/menu-items-request-fixture.js' );

/**
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator
 * @typedef {import('@wordpress/e2e-test-utils-playwright').PageUtils} PageUtils
 * @typedef {import('@wordpress/e2e-test-utils-playwright').RequestUtils} RequestUtils
 */

test.use( {
	navBlockUtils: async ( { page, requestUtils }, use ) => {
		await use( new NavigationBlockUtils( { page, requestUtils } ) );
	},
} );

test.describe( 'Navigation block', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllPosts( 'pages' ),
			requestUtils.deleteAllPosts( 'navigation' ),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllPosts( 'pages' ),
			requestUtils.deleteAllPosts( 'navigation' ),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test.describe( 'block placeholder and menu creation', async () => {
		// shows placeholder on insertion of block.
		test( 'allows a navigation menu to be created via the start empty option in the placeholder', async ( {
			admin,
			editor,
			navBlockUtils,
			page,
		} ) => {
			await admin.createNewPost();
			await editor.insertBlock( { name: 'core/navigation' } );
			const navigationBlock = page.locator(
				'role=document[name="Block: Navigation"i]'
			);
			await expect( navigationBlock ).toBeVisible();

			await navBlockUtils.selectStartEmptyFromPlaceholder(
				navigationBlock
			);

			// Await the block appender.
			await navigationBlock
				.locator( 'role=button[name="Add block"i]' )
				.waitFor();

			const navigationMenuContent =
				await navBlockUtils.getNavigationMenuContent( navigationBlock );

			expect( navigationMenuContent ).toEqual( '' );
		} );

		// does not automatically use first Navigation Menu if more than one exists
		test( 'allows selection of an existing navigation menu within the placeholder', async ( {
			admin,
			editor,
			navBlockUtils,
			page,
		} ) => {
			// Create two navigation menus. If only one menu is present, it'll
			// be automatically used by the block and the placeholder bypassed.
			await Promise.all( [
				navBlockUtils.createNavigationMenu( {
					title: 'Test Menu 1',
					content: '<!-- wp:page-list /-->',
				} ),
				navBlockUtils.createNavigationMenu( {
					title: 'Test Menu 2',
					content: '',
				} ),
			] );

			// Insert the block and select the first menu.
			await admin.createNewPost();
			await editor.insertBlock( { name: 'core/navigation' } );
			const navigationBlock = page.locator(
				'role=document[name="Block: Navigation"i]'
			);
			await expect( navigationBlock ).toBeVisible();

			await navBlockUtils.selectNavigationMenuFromPlaceholder(
				navigationBlock,
				'Test Menu 1'
			);

			// Expect the menu's page list content to be visible.
			const pageListBlock = navigationBlock.locator(
				'role=document[name="Block: Page List"i]'
			);
			await expect( pageListBlock ).toBeVisible();
		} );

		// allows a navigation block to be created from existing menus.
		test( 'allows a navigation menu to be created from a classic menu within the placeholder', async ( {
			admin,
			editor,
			navBlockUtils,
			page,
			requestUtils,
		} ) => {
			await requestUtils.createMenu( { name: 'Test Menu 1' } );
			await requestUtils.createMenu(
				{ name: 'Test Menu 2' },
				menuItemsFixture
			);

			await admin.createNewPost();
			await editor.insertBlock( { name: 'core/navigation' } );
			const navigationBlock = page.locator(
				'role=document[name="Block: Navigation"i]'
			);
			await expect( navigationBlock ).toBeVisible();

			await navBlockUtils.selectClassicMenuFromPlaceholder(
				navigationBlock,
				'Test Menu 2'
			);

			// The select menu button should be hidden and inner blocks should
			// be shown.
			await page.waitForSelector(
				'role=document[name="Block: Custom Link"i]',
				{ strict: false }
			);

			const navigationMenuContent =
				await navBlockUtils.getNavigationMenuContent( navigationBlock );

			expect( navigationMenuContent ).toMatchSnapshot();
		} );

		// shows placeholder preview when unconfigured block is not selected.
		test( 'shows the placeholder preview when the block is unselected and has no selected navigation menu', async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.createNewPost();
			await editor.insertBlock( { name: 'core/navigation' } );
			const navigationBlock = page.locator(
				'role=document[name="Block: Navigation"i]'
			);

			// Deselect the block by selecting the post title.
			await page.click( 'role=textbox[name="Add title"i]' );

			const placeholderPreview = navigationBlock.locator(
				'.wp-block-navigation-placeholder__preview >> text="Navigation"'
			);
			await expect( placeholderPreview ).toBeVisible();
		} );

		// shows placeholder preview when block with no menu items is not selected.
		test( 'shows the placeholder preview when the block is unselected and an empty navigation menu is selected', async ( {
			admin,
			editor,
			navBlockUtils,
			page,
		} ) => {
			await admin.createNewPost();
			await editor.insertBlock( { name: 'core/navigation' } );
			const navigationBlock = page.locator(
				'role=document[name="Block: Navigation"i]'
			);

			await navBlockUtils.selectStartEmptyFromPlaceholder(
				navigationBlock
			);

			// Await the block appender.
			await navigationBlock
				.locator( 'role=button[name="Add block"i]' )
				.waitFor();

			// Deselect the block by selecting the post title.
			const postTitle = page.locator( 'role=textbox[name="Add title"i]' );
			await postTitle.click();
			await expect( postTitle ).toBeFocused();

			const placeholderPreview = navigationBlock.locator(
				'.wp-block-navigation-placeholder__preview >> text=Navigation'
			);
			await expect( placeholderPreview ).toBeVisible();
		} );

		// creates an empty navigation block when the selected existing menu is also empty.
		test( 'creates an empty navigation menu when selecting an empty classic menu from the placeholder', async ( {
			admin,
			editor,
			navBlockUtils,
			page,
			requestUtils,
		} ) => {
			await requestUtils.createMenu( { name: 'Test Menu 1' } );
			await admin.createNewPost();
			await editor.insertBlock( { name: 'core/navigation' } );
			const navigationBlock = page.locator(
				'role=document[name="Block: Navigation"i]'
			);
			await expect( navigationBlock ).toBeVisible();

			await navBlockUtils.selectClassicMenuFromPlaceholder(
				navigationBlock,
				'Test Menu 1'
			);

			// Await the block appender.
			await navigationBlock
				.locator( 'role=button[name="Add block"i]' )
				.waitFor();

			const navigationMenuContent =
				await navBlockUtils.getNavigationMenuContent( navigationBlock );

			expect( navigationMenuContent ).toEqual( '' );
		} );

		// does not display the options to create from existing menus if there are no existing menus.
		test( 'does not display the option to create from existing menus in the placeholder if there are no existing menus', async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.createNewPost();
			await editor.insertBlock( { name: 'core/navigation' } );
			const navigationBlock = page.locator(
				'role=document[name="Block: Navigation"i]'
			);

			const selectMenuButton = await navigationBlock.locator(
				'role=button[name="Select Menu"i]'
			);
			await expect( selectMenuButton ).not.toBeVisible();
		} );

		// automatically uses the first Navigation Menu if only one is available
		test( 'automatically selects the navigation menu when only one exists', async ( {
			admin,
			editor,
			navBlockUtils,
			page,
		} ) => {
			await navBlockUtils.createNavigationMenu( {
				title: 'Test Menu 1',
				content: '<!-- wp:page-list /-->',
			} );

			// Insert the block and select the first menu.
			await admin.createNewPost();
			await editor.insertBlock( { name: 'core/navigation' } );
			const navigationBlock = page.locator(
				'role=document[name="Block: Navigation"i]'
			);
			await expect( navigationBlock ).toBeVisible();

			// Expect the menu's page list content to be visible.
			const pageListBlock = navigationBlock.locator(
				'role=document[name="Block: Page List"i]'
			);
			await expect( pageListBlock ).toBeVisible();
		} );

		// allows users to manually create new empty menu when block has automatically selected the first available Navigation Menu
		test( 'allows creation of a new navigation menu using the block toolbar when the block has an existing menu selected', async ( {
			admin,
			editor,
			navBlockUtils,
			page,
		} ) => {
			await navBlockUtils.createNavigationMenu( {
				title: 'Test Menu 1',
				content:
					'<!-- wp:navigation-link {"label":"WordPress","type":"custom","url":"http://www.wordpress.org/","kind":"custom","isTopLevelLink":true} /-->',
			} );

			await admin.createNewPost();
			await editor.insertBlock( { name: 'core/navigation' } );

			const navigationBlock = page.locator(
				'role=document[name="Block: Navigation"i]'
			);
			await expect( navigationBlock ).toBeVisible();
			const customLink = navigationBlock.locator(
				'role=document[name="Block: Custom Link"i]'
			);
			await expect( customLink ).toBeVisible();

			await editor.clickBlockToolbarButton( 'Select Menu' );
			await page.click(
				'role=menu[name="Select Menu"i] >> role=menuitem[name="Create new menu"]'
			);

			await expect( customLink ).not.toBeVisible();

			await navBlockUtils.selectStartEmptyFromPlaceholder(
				navigationBlock
			);

			// Await the block appender.
			await navigationBlock
				.locator( 'role=button[name="Add block"i]' )
				.waitFor();

			const navigationMenuContent =
				await navBlockUtils.getNavigationMenuContent( navigationBlock );

			expect( navigationMenuContent ).toEqual( '' );
		} );
	} );

	test.describe( 'permissions', async () => {
		const user = {
			username: 'contributor',
			password: 'password',
			email: 'contributor@wordpress.org',
			roles: 'contributor',
		};

		let userId;

		test.beforeAll( async ( { requestUtils } ) => {
			// Be a contributor for these tests.
			const userData = await requestUtils.createUser( user );
			userId = userData.id;
			await requestUtils.login( user );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			// Log back in as the normal test user.
			await requestUtils.login();
			await requestUtils.deleteUser( userId );
		} );

		// shows a warning if user does not have permission to create navigation menus
		test.only( 'shows a warning if user does not have permission to create navigation menus', async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.createNewPost();
			await editor.insertBlock( { name: 'core/navigation' } );

			// Make sure the snackbar error shows up.
			const noticeText =
				'You do not have permission to create Navigation Menus.';
			const snackbar = await page.locator(
				`.components-snackbar__content >> text=${ noticeText }`
			);

			await expect( snackbar ).toBeVisible();

			// Expect a console 403 for requests to:
			// * /wp/v2/settings?_locale=user
			// * /wp/v2/templates?context=edit&post_type=post&per_page=100&_locale=user
			expect( console ).toHaveErrored();
		} );

		// shows a warning if user does not have permission to edit or update navigation menus
		test( 'shows a warning if user does not have permission to edit or update navigation menus', async () => {} );
	} );

	test.describe( 'loading states', async () => {
		// shows a loading indicator whilst empty Navigation menu is being created
		test( 'shows a loading indicator when a new empty navigation menu is being created', async () => {} );

		// shows a loading indicator whilst ref resolves to Navigation post items
		test( 'shows a loading indicator when the selected navigation menu is loading', async () => {} );

		// does not show a loading indicator if there is no ref to a Navigation post and Nav Menus have loaded
		test( 'does not show a loading indicator if all navigation menus have loaded and there is no selected menu', async () => {} );
	} );

	test.describe( 'editing', () => {
		// Shows the quick inserter when the block contains non-navigation specific blocks
		test( 'shows the quick inserter when blocks other than a link or submenu are present', async () => {} );

		// respects the nesting level
		test( 'does not allow creating submenus beyond the max nesting level', async () => {} );

		// retains initial uncontrolled inner blocks whilst there are no modifications to those blocks
		test( 'retains initial uncontrolled inner blocks whilst there are no modifications', async () => {} );

		// converts uncontrolled inner blocks to an entity when modifications are made to the blocks
		test( 'converts uncontrolled inner blocks to a new navigation menu when modifications are made', async () => {} );

		// only updates a single entity currently linked with the block
		test( 'only updates the currently selected navigation menu when editing inner blocks', async () => {} );

		// should always focus select menu button after item selection
		test( 'focuses the select menu toolbar item after choosing a menu in the dropdown', async () => {} );
	} );

	test.describe( 'navigation link block', async () => {
		// allows an empty navigation block to be created and manually populated using a mixture of internal and external links
		test( 'allows internal and external links', async () => {} );

		// allows pages to be created from the navigation block and their links added to menu
		test( 'allows creation of new pages', async () => {} );

		// encodes URL when create block if needed
		test( 'encodes URLs', async () => {} );

		// correctly decodes special characters in the created Page title for display
		test( 'decodes special characters in a page title', async () => {} );
	} );

	test.describe( 'submenu block', async () => {
		// renders buttons for the submenu opener elements when the block is set to open on click instead of hover'
		test( 'uses buttons for submenus when the open on click option is enabled', async () => {} );

		// shows button which converts submenu to link when submenu is not-populated (empty)
		// shows button to convert submenu to link in disabled state when submenu is populated
		// shows button to convert submenu to link when submenu is populated with a single incomplete link item
		test( 'has a toolbar button that converts an empty submenu to a link', async () => {} );
	} );

	test.describe( 'frontend', async () => {
		// applies accessible label to block element
		test( 'has an accessible label', async () => {} );

		// does not load the frontend script if no navigation blocks are present
		test( 'does not load the frontend script if no navigation blocks are present', async () => {} );

		// loads the frontend script only once even when multiple navigation blocks are present
		test( 'loads the frontend script only once even when multiple navigation blocks are present', async () => {} );
	} );
} );

class NavigationBlockUtils {
	constructor( { editor, page, requestUtils } ) {
		this.editor = editor;
		this.page = page;
		this.requestUtils = requestUtils;
	}

	/**
	 * Create a navigation menu
	 *
	 * @param {Object} menuData navigation menu post data.
	 * @return {string} Menu content.
	 */
	async createNavigationMenu( menuData ) {
		return this.requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/navigation/`,
			data: {
				status: 'publish',
				...menuData,
			},
		} );
	}

	/**
	 * Get navigation block content by fetching the navigation menu.
	 *
	 * @param {Locator} navigationBlock A locator for the navigation block.
	 * @return {string} Menu content.
	 */
	async getNavigationMenuContent( navigationBlock ) {
		const menuRef = await navigationBlock.evaluate( ( blockElement ) => {
			const clientId = blockElement.dataset.block;
			// eslint-disable-next-line no-undef
			const block = wp.data
				.select( 'core/block-editor' )
				.getBlock( clientId );
			return block?.attributes.ref;
		} );

		if ( ! menuRef ) {
			throw 'NavigationBlockUtils.getRawContent was unable to find a ref attribute on the navigation block';
		}

		const response = await this.requestUtils.rest( {
			path: `/wp/v2/navigation/${ menuRef }`,
			params: {
				context: 'edit',
			},
		} );

		// Replace unique ids in nav block content, since these won't be consistent
		// between test runs.
		return response.content.raw
			.replace( /page_id=\d+/gm, 'page_id=[number]' )
			.replace( /"id":\d+/gm, '"id":[number]' );
	}

	async selectStartEmptyFromPlaceholder( navigationBlock ) {
		const startEmptyButton = navigationBlock.locator(
			'role=button[name="Start empty"i]'
		);
		await startEmptyButton.click();
		await expect( startEmptyButton ).not.toBeVisible();
	}

	async selectClassicMenuFromPlaceholder( navigationBlock, classicMenuName ) {
		const selectMenuButton = navigationBlock.locator(
			'role=button[name="Select Menu"i]'
		);
		await selectMenuButton.click();
		await this.page.click(
			`role=menu[name="Select Menu"i] >> role=menuitem[name="Create from '${ classicMenuName }'"i]`
		);

		await expect( selectMenuButton ).not.toBeVisible();
	}

	async selectNavigationMenuFromPlaceholder( navigationBlock, menuName ) {
		const selectMenuButton = navigationBlock.locator(
			'role=button[name="Select Menu"i]'
		);
		await selectMenuButton.click();
		await this.page.click(
			`role=menu[name="Select Menu"i] >> role=menuitemradio[name="${ menuName }"i]`
		);
		await expect( selectMenuButton ).not.toBeVisible();
	}
}
