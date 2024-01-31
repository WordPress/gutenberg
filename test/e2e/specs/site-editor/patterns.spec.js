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

// Skip these tests for now as we plan to adapt them to
// the new patterns UI.
test.describe.skip( 'Patterns', () => {
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
		await admin.visitSiteEditor();

		await patterns.navigation
			.getByRole( 'button', { name: 'Patterns' } )
			.click();

		await expect(
			patterns.navigation.getByRole( 'heading', {
				name: 'Patterns',
				level: 1,
			} )
		).toBeVisible();
		await expect( patterns.content ).toContainText( 'No patterns found.' );

		await patterns.navigation
			.getByRole( 'button', { name: 'Create pattern' } )
			.click();

		const createPatternMenu = page.getByRole( 'menu', {
			name: 'Create pattern',
		} );
		await expect(
			createPatternMenu.getByRole( 'menuitem', {
				name: 'Create pattern',
			} )
		).toBeFocused();
		await createPatternMenu
			.getByRole( 'menuitem', { name: 'Create pattern' } )
			.click();

		const createPatternDialog = page.getByRole( 'dialog', {
			name: 'Create pattern',
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
		await page
			.getByRole( 'region', { name: 'Save panel' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();
		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toContainText( 'Site updated' );

		await page.getByRole( 'button', { name: 'Open navigation' } ).click();
		await patterns.navigation
			.getByRole( 'button', { name: 'Back' } )
			.click();
		// TODO: await expect( page ).toHaveTitle( /^Patterns/ );

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
		await expect( patterns.list.getByRole( 'listitem' ) ).toHaveCount( 1 );
		await expect(
			patterns.list
				.getByRole( 'heading', { name: 'My pattern' } )
				.getByRole( 'button', { name: 'My pattern', exact: true } )
		).toBeVisible();
	} );

	test( 'search and filter patterns', async ( {
		admin,
		requestUtils,
		patterns,
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

		await admin.visitSiteEditor( { path: '/patterns' } );

		await expect( patterns.list.getByRole( 'listitem' ) ).toHaveCount( 3 );

		await patterns.content
			.getByRole( 'searchbox', { name: 'Search patterns' } )
			.fill( 'footer' );
		await expect( patterns.list.getByRole( 'listitem' ) ).toHaveCount( 2 );
		expect(
			await patterns.list
				.getByRole( 'listitem' )
				.getByRole( 'heading' )
				.allInnerTexts()
		).toEqual(
			expect.arrayContaining( [ 'Unsynced footer', 'Synced footer' ] )
		);

		const searchBox = patterns.content.getByRole( 'searchbox', {
			name: 'Search patterns',
		} );

		await searchBox.fill( 'no match' );
		await expect( patterns.content ).toContainText( 'No patterns found.' );

		await patterns.content
			.getByRole( 'button', { name: 'Reset search' } )
			.click();
		await expect( searchBox ).toHaveValue( '' );
		await expect( patterns.list.getByRole( 'listitem' ) ).toHaveCount( 3 );

		const syncFilter = patterns.content.getByRole( 'radiogroup', {
			name: 'Filter by sync status',
		} );
		await expect(
			syncFilter.getByRole( 'radio', { name: 'All' } )
		).toBeChecked();

		await syncFilter
			.getByRole( 'radio', { name: 'Synced', exact: true } )
			.click();
		await expect( patterns.list.getByRole( 'listitem' ) ).toHaveCount( 1 );
		await expect( patterns.list.getByRole( 'listitem' ) ).toContainText(
			'Synced footer'
		);

		await syncFilter.getByRole( 'radio', { name: 'Not synced' } ).click();
		await expect( patterns.list.getByRole( 'listitem' ) ).toHaveCount( 2 );
		expect(
			await patterns.list
				.getByRole( 'listitem' )
				.getByRole( 'heading' )
				.allInnerTexts()
		).toEqual(
			expect.arrayContaining( [ 'Unsynced header', 'Unsynced footer' ] )
		);

		await searchBox.fill( 'footer' );
		await expect( patterns.list.getByRole( 'listitem' ) ).toHaveCount( 1 );
		await expect( patterns.list.getByRole( 'listitem' ) ).toContainText(
			'Unsynced footer'
		);

		await syncFilter.getByRole( 'radio', { name: 'All' } ).click();
		await expect( patterns.list.getByRole( 'listitem' ) ).toHaveCount( 2 );
		expect(
			await patterns.list
				.getByRole( 'listitem' )
				.getByRole( 'heading' )
				.allInnerTexts()
		).toEqual(
			expect.arrayContaining( [ 'Unsynced footer', 'Synced footer' ] )
		);
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
		this.list = this.content.getByRole( 'list' );
	}
}
