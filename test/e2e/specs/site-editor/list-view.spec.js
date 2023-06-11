/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site Editor List View', () => {
	test.use( {
		listViewUtils: async ( { page, pageUtils, editor }, use ) => {
			await use( new ListViewUtils( { page, pageUtils, editor } ) );
		},
	} );

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin, editor } ) => {
		// Select a template part with a few blocks.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
		} );
		await editor.canvas.click( 'body' );
	} );

	// If list view sidebar is open and focus is not inside the sidebar, move
	// focus to the sidebar when using the shortcut. If focus is inside the
	// sidebar, shortcut should close the sidebar.
	test( 'ensures List View global shortcut works properly', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Current starting focus should be at Open Navigation button.
		const openNavigationButton = page.getByRole( 'button', {
			name: 'Open Navigation',
			exact: true,
		} );
		await openNavigationButton.focus();
		await expect( openNavigationButton ).toBeFocused();

		// Open List View.
		await pageUtils.pressKeys( 'access+o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		await expect( listView ).toBeVisible();

		// The site title block should have focus.
		await expect(
			listView.getByRole( 'link', {
				name: 'Site Title',
				exact: true,
			} )
		).toBeFocused();

		// Navigate to the site tagline block.
		await page.keyboard.press( 'ArrowDown' );
		const siteTaglineItem = listView.getByRole( 'link', {
			name: 'Site Tagline',
			exact: true,
		} );
		await expect( siteTaglineItem ).toBeFocused();

		// Hit enter to focus the site tagline block in the canvas.
		await page.keyboard.press( 'Enter' );
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Site Tagline',
			} )
		).toBeFocused();

		// Since focus is now at the site tagline block in the canvas,
		// pressing the list view shortcut should bring focus back to the site tagline
		// block in the list view.
		await pageUtils.pressKeys( 'access+o' );
		await expect( siteTaglineItem ).toBeFocused();

		// Since focus is now inside the list view, the shortcut should close
		// the sidebar.
		await pageUtils.pressKeys( 'access+o' );
		await expect( listView ).not.toBeVisible();

		// Focus should now be on the Open Navigation button since that is
		// where we opened the list view sidebar. This is not a perfect
		// solution, but current functionality prevents a better way at
		// the moment.
		await expect( openNavigationButton ).toBeFocused();

		// Open List View.
		await pageUtils.pressKeys( 'access+o' );
		await expect( listView ).toBeVisible();

		// Focus the list view close button and make sure the shortcut will
		// close the list view. This is to catch a bug where elements could be
		// out of range of the sidebar region. Must shift+tab 1 time to reach
		// close button before list view area.
		await pageUtils.pressKeys( 'shift+Tab' );
		await page.keyboard.press( 'Enter' );
		await expect( listView ).not.toBeVisible();
		await expect( openNavigationButton ).toBeFocused();
	} );
} );

/** @typedef {import('@playwright/test').Locator} Locator */
class ListViewUtils {
	#page;
	#pageUtils;
	#editor;

	constructor( { page, pageUtils, editor } ) {
		this.#page = page;
		this.#pageUtils = pageUtils;
		this.#editor = editor;

		/** @type {Locator} */
		this.listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
	}

	/**
	 * @return {Promise<Locator>} The list view locator.
	 */
	openListView = async () => {
		await this.#pageUtils.pressKeys( 'access+o' );
		return this.listView;
	};

	getBlocksWithA11yAttributes = async () => {
		const selectedRows = await this.listView
			.getByRole( 'row' )
			.filter( {
				has: this.#page.getByRole( 'gridcell', { selected: true } ),
			} )
			.all();
		const selectedClientIds = await Promise.all(
			selectedRows.map( ( row ) => row.getAttribute( 'data-block' ) )
		);
		const focusedRows = await this.listView
			.getByRole( 'row' )
			.filter( { has: this.#page.locator( ':focus' ) } )
			.all();
		const focusedClientId =
			focusedRows.length > 0
				? await focusedRows[ focusedRows.length - 1 ].getAttribute(
						'data-block'
				  )
				: null;
		// Don't use the util to get the unmodified default block when it's empty.
		const blocks = await this.#page.evaluate( () =>
			window.wp.data.select( 'core/block-editor' ).getBlocks()
		);
		function recursivelyApplyAttributes( _blocks ) {
			return _blocks.map( ( block ) => ( {
				name: block.name,
				selected: selectedClientIds.includes( block.clientId ),
				focused: block.clientId === focusedClientId,
				innerBlocks: recursivelyApplyAttributes( block.innerBlocks ),
			} ) );
		}
		return recursivelyApplyAttributes( blocks );
	};
}
