const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// The screen under test is the extensible site editor's navigation menu
// screen, which lives at `admin.php?page=site-editor-v2`.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

const META_KEY = 'wp_navigation_auto_add_pages';

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

	test( 'the setting is saved as soon as it is changed', async ( {
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

		const toggle = page.getByRole( 'switch', { name: 'Auto add pages' } );
		await expect( toggle ).not.toBeChecked();
		await toggle.click();
		await expect( toggle ).toBeChecked();

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
