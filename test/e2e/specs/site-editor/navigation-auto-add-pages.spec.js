const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// The screen under test is the extensible site editor's navigation menu
// screen, which lives at `admin.php?page=site-editor-v2`.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

const META_KEY = 'wp_navigation_auto_add_pages';

test.describe( 'Navigation sidebar: Auto add pages', () => {
	test.skip(
		isSiteEditorV2,
		'The extensible site editor has no navigation sidebar.'
	);

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
		] );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'the setting is shown after the list and saved with the menu', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Main menu',
			content:
				'<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->',
		} );

		await admin.visitSiteEditor( {
			postId: menu.id,
			postType: 'wp_navigation',
		} );

		const sidebar = page.getByRole( 'region', {
			name: 'Navigation',
		} );
		await expect(
			sidebar.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} )
		).toBeVisible();

		// The setting follows the menu's items and their appender.
		await expect(
			sidebar.locator(
				'xpath=.//*[@role="treegrid"]/following::*[@role="switch"]'
			)
		).toHaveAccessibleName( 'Auto add pages' );
		const toggle = sidebar.getByRole( 'switch', {
			name: 'Auto add pages',
		} );
		await expect( toggle ).not.toBeChecked();
		await toggle.click();
		await expect( toggle ).toBeChecked();

		await page.getByRole( 'button', { name: 'Review 1 change…' } ).click();
		await page
			.getByRole( 'dialog', { name: 'Review changes' } )
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();

		await expect
			.poll( async () => {
				const savedMenu = await requestUtils.rest( {
					path: `/wp/v2/navigation/${ menu.id }`,
					params: { context: 'edit' },
				} );
				return savedMenu.meta[ META_KEY ];
			} )
			.toBe( true );
	} );
} );

test.describe( 'Navigation menu screen: Auto add pages', () => {
	test.skip(
		! isSiteEditorV2,
		'Only the extensible site editor has a navigation menu screen.'
	);

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
		] );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'the setting is saved with the menu', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Main menu',
			content:
				'<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->',
		} );

		await admin.visitAdminPage(
			'admin.php',
			`page=site-editor-v2&p=${ encodeURIComponent(
				`/navigation/edit/${ menu.id }`
			) }`
		);

		// The setting follows the menu's items and their appender.
		await expect(
			page.locator(
				'xpath=//*[@role="treegrid"]/following::*[@role="switch"]'
			)
		).toHaveAccessibleName( 'Auto add pages' );
		const toggle = page.getByRole( 'switch', { name: 'Auto add pages' } );
		await expect( toggle ).not.toBeChecked();
		await toggle.click();
		await expect( toggle ).toBeChecked();

		// The change is a pending edit to the menu until it is saved.
		const reviewButton = page.getByRole( 'button', {
			name: 'Review 1 change…',
		} );
		await expect( reviewButton ).toBeVisible();
		const pendingMenu = await requestUtils.rest( {
			path: `/wp/v2/navigation/${ menu.id }`,
			params: { context: 'edit' },
		} );
		expect( pendingMenu.meta[ META_KEY ] ).toBe( false );

		await reviewButton.click();
		await page
			.getByRole( 'dialog', { name: 'Review changes' } )
			.getByRole( 'button', { name: 'Save', exact: true } )
			.click();

		await expect
			.poll( async () => {
				const savedMenu = await requestUtils.rest( {
					path: `/wp/v2/navigation/${ menu.id }`,
					params: { context: 'edit' },
				} );
				return savedMenu.meta[ META_KEY ];
			} )
			.toBe( true );

		const about = await requestUtils.createPage( {
			title: 'About',
			status: 'publish',
		} );
		const updatedMenu = await requestUtils.rest( {
			path: `/wp/v2/navigation/${ menu.id }`,
			params: { context: 'edit' },
		} );
		expect( updatedMenu.content.raw ).toContain( `"id":${ about.id }` );
	} );
} );
