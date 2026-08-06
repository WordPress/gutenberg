const {
	test: base,
	expect,
} = require( '@wordpress/e2e-test-utils-playwright' );

// Whether the run targets the extensible site editor (v2). Its Patterns page
// is a single region with view tabs instead of the classic editor's
// navigation-and-content split with a category sidebar.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

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

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllBlocks();
		// Drop persisted view state (search and filters) so one test's
		// filtering doesn't hide another test's fixtures.
		await requestUtils.resetPreferences();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'create a new pattern', async ( {
		page,
		editor,
		admin,
		patterns,
	} ) => {
		await admin.visitSiteEditor( { postType: 'wp_block' } );
		await expect(
			( isSiteEditorV2
				? patterns.content
				: patterns.navigation
			).getByRole( 'heading', {
				name: 'Patterns',
				level: isSiteEditorV2 ? 2 : 1,
			} )
		).toBeVisible();
		await expect( patterns.content ).toContainText( 'No results' );

		await patterns.content
			.getByRole( 'button', { name: 'add pattern' } )
			.click();

		// The classic editor's button opens a menu offering a pattern or a
		// template part; the extensible editor's opens the dialog directly.
		if ( ! isSiteEditorV2 ) {
			const addNewMenuItem = page
				.getByRole( 'menu', {
					name: 'add pattern',
				} )
				.getByRole( 'menuitem', {
					name: 'add pattern',
				} );
			await expect( addNewMenuItem ).toBeFocused();
			await addNewMenuItem.click();
		}

		const createPatternDialog = page.getByRole( 'dialog', {
			name: 'add pattern',
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
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'My pattern' );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save' } )
			.click();
		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toContainText( 'Pattern updated' );

		if ( isSiteEditorV2 ) {
			await page
				.getByRole( 'button', { name: 'Back', exact: true } )
				.click();

			// The extensible editor's Patterns page filters through view tabs
			// without per-category counts.
			await expect(
				page.getByRole( 'tab', { name: 'All patterns' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'tab', { name: 'My patterns' } )
			).toBeVisible();
		} else {
			await page
				.getByRole( 'button', { name: 'Open navigation' } )
				.click();

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
		}
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

		const searchBox = patterns.content.getByRole( 'searchbox', {
			name: 'Search',
		} );
		await searchBox.fill( 'footer' );
		await expect( patterns.item ).toHaveCount( 2 );
		expect(
			// The title element: a button in the classic editor, a link in
			// the extensible one, so target the title field wrapper.
			// eslint-disable-next-line playwright/prefer-web-first-assertions -- toHaveText doesn't support expect.arrayContaining
			await patterns.itemTitle.allInnerTexts()
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
			// The title element: a button in the classic editor, a link in
			// the extensible one, so target the title field wrapper.
			// eslint-disable-next-line playwright/prefer-web-first-assertions -- toHaveText doesn't support expect.arrayContaining
			await patterns.itemTitle.allInnerTexts()
		).toEqual(
			expect.arrayContaining( [ 'Unsynced header', 'Unsynced footer' ] )
		);

		await searchBox.fill( 'footer' );
		await expect( patterns.item ).toHaveCount( 1 );
		await expect( patterns.item ).toContainText( 'Unsynced footer' );
	} );

	test( 'sort patterns', async ( {
		admin,
		requestUtils,
		patterns,
		page,
	} ) => {
		await Promise.all( [
			requestUtils.createBlock( {
				title: 'Animal',
				status: 'publish',
				content: `<!-- wp:paragraph -->\n<p>Animal</p>\n<!-- /wp:paragraph -->`,
				wp_pattern_category: [],
			} ),
			requestUtils.createBlock( {
				title: 'Berry',
				status: 'publish',
				content: `<!-- wp:paragraph -->\n<p>Berry</p>\n<!-- /wp:paragraph -->`,
				wp_pattern_category: [],
			} ),
			requestUtils.createBlock( {
				title: 'Starter',
				status: 'publish',
				content: `<!-- wp:paragraph -->\n<p>Starter</p>\n<!-- /wp:paragraph -->`,
				wp_pattern_category: [],
			} ),
		] );

		await admin.visitSiteEditor( { postType: 'wp_block' } );
		await expect( patterns.item ).toHaveCount( 3 );

		// Open view options and switch to descending sort.
		await page.getByRole( 'button', { name: 'View options' } ).click();
		await page.getByRole( 'radio', { name: 'Sort descending' } ).click();

		// Close the view options.
		await page.keyboard.press( 'Escape' );

		await expect( patterns.itemTitle ).toHaveText( [
			'Starter',
			'Berry',
			'Animal',
		] );

		// Open view options and switch back to ascending sort.
		await page.getByRole( 'button', { name: 'View options' } ).click();
		await page.getByRole( 'radio', { name: 'Sort ascending' } ).click();

		// Close the view options.
		await page.keyboard.press( 'Escape' );

		await expect( patterns.itemTitle ).toHaveText( [
			'Animal',
			'Berry',
			'Starter',
		] );
	} );
} );

class Patterns {
	/** @type {import('@playwright/test').Page} */
	#page;

	constructor( { page } ) {
		this.#page = page;

		this.content = this.#page.getByRole( 'region', {
			name: isSiteEditorV2 ? 'Patterns' : 'All patterns',
		} );
		this.navigation = this.#page.getByRole( 'region', {
			name: 'Navigation',
		} );
		this.itemsList = this.content.locator( '.dataviews-view-grid' );
		this.item = this.itemsList.locator( '.dataviews-view-grid__card' );
		this.itemTitle = this.itemsList.locator(
			'.dataviews-view-grid__title-field'
		);
	}
}
