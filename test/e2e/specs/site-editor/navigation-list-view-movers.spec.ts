import { test, expect } from '@wordpress/e2e-test-utils-playwright';

// Runs against the classic site editor's navigation sidebar, or, with the
// extensible site editor config, against its navigation screen.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

const link = ( label: string ) =>
	`<!-- wp:navigation-link {"label":"${ label }","url":"https://example.com/${ label.toLowerCase() }","kind":"custom"} /-->`;

test.describe( 'Navigation menu screen: List View movers', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMenus();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMenus();
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'moving down past an expanded submenu goes into it', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Main menu',
			content: `${ link(
				'Home'
			) }<!-- wp:navigation-submenu {"label":"Bravo","url":"https://example.com/bravo","kind":"custom"} -->${ link(
				'Team'
			) }<!-- /wp:navigation-submenu -->`,
		} );

		if ( isSiteEditorV2 ) {
			await admin.visitAdminPage(
				'admin.php',
				`page=site-editor-v2&p=${ encodeURIComponent(
					`/navigation/edit/${ menu.id }`
				) }`
			);
		} else {
			await admin.visitSiteEditor( {
				postId: menu.id,
				postType: 'wp_navigation',
			} );
		}

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const row = ( label: string ) =>
			listView.getByRole( 'row' ).filter( {
				has: page.getByRole( 'gridcell', {
					name: new RegExp( `^${ label }\\b` ),
				} ),
			} );
		await expect( row( 'Team' ) ).toHaveAttribute( 'aria-level', '2' );

		await row( 'Home' ).hover();
		await row( 'Home' ).getByRole( 'button', { name: 'Options' } ).click();
		await page.getByRole( 'menuitem', { name: 'Move down' } ).click();

		// Home is now Bravo's first child, above Team.
		await expect( row( 'Home' ) ).toHaveAttribute( 'aria-level', '2' );
		await expect(
			listView.getByRole( 'row', { level: 2 } ).first()
		).toContainText( 'Home' );
	} );
} );
