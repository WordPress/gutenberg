/**
 * WordPress dependencies
 */
const {
	test: base,
	expect,
} = require( '@wordpress/e2e-test-utils-playwright' );

/** @type {ReturnType<typeof base.extend<{patterns: Patterns}>>} */
const test = base.extend( {
	patterns: async ( { page }, use ) => {
		await use( new Patterns( { page } ) );
	},
} );

test.describe( 'Patterns', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllBlocks();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllBlocks();
	} );

	test( 'create a new pattern', async ( {
		page,
		editor,
		admin,
		patterns,
	} ) => {
		await admin.visitSiteEditor( { postType: 'wp_block' } );
		await expect(
			patterns.navigation.getByRole( 'heading', {
				name: 'Patterns',
				level: 1,
			} )
		).toBeVisible();
		await expect( patterns.content ).toContainText( 'No results' );

		await patterns.content
			.getByRole( 'button', { name: 'add new pattern' } )
			.click();

		const addNewMenuItem = page
			.getByRole( 'menu', {
				name: 'add new pattern',
			} )
			.getByRole( 'menuitem', {
				name: 'add new pattern',
			} );
		await expect( addNewMenuItem ).toBeFocused();
		await addNewMenuItem.click();

		const createPatternDialog = page.getByRole( 'dialog', {
			name: 'add new pattern',
		} );
		await createPatternDialog
			.getByRole( 'textbox', { name: 'Name' } )
			.fill( 'My pattern' );
		await page.keyboard.press( 'Enter' );

		await expect( page ).toHaveTitle( /^My pattern/ );
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'heading', { name: 'My pattern', level: 1 } )
		).toBeVisible();

		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'My pattern' );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();
		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toContainText( 'Pattern updated' );

		await page.getByRole( 'button', { name: 'Open navigation' } ).click();

		await expect(
			patterns.navigation.getByRole( 'button', {
				name: 'All patterns',
			} )
		).toContainText( '1' );
		await expect(
			patterns.navigation.getByRole( 'button', {
				name: 'My patterns',
			} )
		).toContainText( '1' );
		await expect(
			patterns.navigation.getByRole( 'button', {
				name: 'Uncategorized',
			} )
		).toContainText( '1' );

		await expect(
			patterns.content.getByRole( 'heading', {
				name: 'All patterns',
				level: 2,
			} )
		).toBeVisible();
		await expect( patterns.item ).toHaveCount( 1 );
		await expect(
			patterns.itemsList.getByText( 'My pattern', {
				exact: true,
			} )
		).toBeVisible();
	} );

	test( 'search and filter patterns', async ( {
		admin,
		requestUtils,
		patterns,
		page,
	} ) => {
		await Promise.all( [
			requestUtils.createBlock( {
				title: 'Unsynced header',
				meta: { wp_pattern_sync_status: 'unsynced' },
				status: 'publish',
				content: `<!-- wp:heading -->\n<h2>Unsynced header</h2>\n<!-- /wp:heading -->`,
				wp_pattern_category: [],
			} ),
			requestUtils.createBlock( {
				title: 'Unsynced footer',
				meta: { wp_pattern_sync_status: 'unsynced' },
				status: 'publish',
				content: `<!-- wp:paragraph -->\n<p>Unsynced footer</p>\n<!-- /wp:paragraph -->`,
				wp_pattern_category: [],
			} ),
			requestUtils.createBlock( {
				title: 'Synced footer',
				status: 'publish',
				content: `<!-- wp:paragraph -->\n<p>Synced footer</p>\n<!-- /wp:paragraph -->`,
				wp_pattern_category: [],
			} ),
		] );

		await admin.visitSiteEditor( { postType: 'wp_block' } );

		await expect( patterns.item ).toHaveCount( 3 );

		await patterns.content
			.getByRole( 'button', {
				name: 'Toggle filter display',
				exact: true,
			} )
			.click();

		const searchBox = patterns.content.getByRole( 'searchbox', {
			name: 'Search',
		} );
		await searchBox.fill( 'footer' );
		await expect( patterns.item ).toHaveCount( 2 );
		expect(
			await patterns.item.getByRole( 'button' ).allInnerTexts()
		).toEqual(
			expect.arrayContaining( [ 'Unsynced footer', 'Synced footer' ] )
		);

		await searchBox.fill( 'no match' );
		await expect( patterns.content ).toContainText( 'No results' );

		await patterns.content
			.getByRole( 'button', { name: 'Reset search', exact: true } )
			.click();
		await expect( searchBox ).toHaveValue( '' );
		await expect( patterns.item ).toHaveCount( 3 );

		await patterns.content
			.getByRole( 'button', { name: 'Sync Status' } )
			.click();
		await page.getByRole( 'option', { name: /^Synced/ } ).click();

		await expect( patterns.item ).toHaveCount( 1 );
		await expect( patterns.item ).toContainText( 'Synced footer' );

		await page.getByRole( 'option', { name: /^Not synced/ } ).click();
		await expect( patterns.item ).toHaveCount( 2 );
		expect(
			await patterns.item.getByRole( 'button' ).allInnerTexts()
		).toEqual(
			expect.arrayContaining( [ 'Unsynced header', 'Unsynced footer' ] )
		);

		await searchBox.fill( 'footer' );
		await expect( patterns.item ).toHaveCount( 1 );
		await expect( patterns.item ).toContainText( 'Unsynced footer' );
	} );
} );

class Patterns {
	/** @type {import('@playwright/test').Page} */
	#page;

	constructor( { page } ) {
		this.#page = page;

		this.content = this.#page.getByRole( 'region', {
			name: 'Patterns content',
		} );
		this.navigation = this.#page.getByRole( 'region', {
			name: 'Navigation',
		} );
		this.itemsList = this.content.locator( '.dataviews-view-grid' );
		this.item = this.itemsList.locator( '.dataviews-view-grid__card' );
	}
}
