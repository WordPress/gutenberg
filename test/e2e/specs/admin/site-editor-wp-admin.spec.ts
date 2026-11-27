import type { Page } from '@playwright/test';
import type { Admin } from '@wordpress/e2e-test-utils-playwright';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

declare global {
	interface Window {
		__siteEditorDocumentMarker?: boolean;
	}
}

const PAGE = 'site-editor-v2-wp-admin';

// Appearance submenu items added by the experiment, with the route each one
// links to, the heading it shows, and the route it settles on.
const SECTIONS = [
	[ 'Identity', '/identity', 'Identity', '/identity' ],
	[ 'Styles', '/styles', 'Styles', '/styles' ],
	[ 'Navigation', '/navigation', 'Navigation', '/navigation/list' ],
	[ 'Templates', '/templates', 'Templates', '/templates/list/all' ],
	[
		'Template Parts',
		'/template-parts',
		'Template Parts',
		'/template-parts/list/all-parts',
	],
	[ 'Patterns', '/patterns', 'Patterns', '/patterns/list/all' ],
];

async function visitRoute( admin: Admin, path: string ) {
	await admin.visitAdminPage(
		'themes.php',
		`page=${ PAGE }&p=${ encodeURIComponent( path ) }`
	);
}

function getAppearanceMenu( page: Page ) {
	return page.locator( '#menu-appearance' );
}

function getCurrentMenuItem( page: Page ) {
	return getAppearanceMenu( page ).locator( 'a[aria-current="page"]' );
}

function getRoutePath( page: Page ) {
	return new URL( page.url() ).searchParams.get( 'p' );
}

test.describe( 'Site editor in wp-admin', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-extensible-site-editor',
			'gutenberg-site-editor-wp-admin',
		] );
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.resetPreferences();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.resetPreferences();
		await requestUtils.setGutenbergExperiments( [] );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'lists the site editor sections under Appearance', async ( {
		admin,
		page,
	} ) => {
		await admin.visitAdminPage( 'index.php' );

		const menu = getAppearanceMenu( page );
		const editorLink = menu.getByRole( 'link', {
			name: 'Editor',
			exact: true,
		} );
		const editorUrl = new URL(
			( await editorLink.getAttribute( 'href' ) ) ?? '',
			page.url()
		);
		expect( editorUrl.pathname ).toMatch( /\/wp-admin\/themes\.php$/ );
		expect( editorUrl.searchParams.get( 'page' ) ).toBe( PAGE );
		expect( editorUrl.searchParams.get( 'p' ) ).toBeNull();

		for ( const [ label, path ] of SECTIONS ) {
			const link = menu.getByRole( 'link', { name: label, exact: true } );
			const url = new URL(
				( await link.getAttribute( 'href' ) ) ?? '',
				page.url()
			);
			expect( url.searchParams.get( 'page' ) ).toBe( PAGE );
			expect( url.searchParams.get( 'p' ) ).toBe( path );
		}

		await expect(
			menu.getByRole( 'link', { name: 'Pages', exact: true } )
		).toHaveCount( 0 );
	} );

	test( 'opens each section with the admin menu visible and highlighted', async ( {
		admin,
		page,
	} ) => {
		await admin.visitAdminPage( 'themes.php', `page=${ PAGE }` );
		await expect( getCurrentMenuItem( page ) ).toHaveText( 'Editor' );

		for ( const [ label, path, heading, settledPath ] of SECTIONS ) {
			await visitRoute( admin, path );

			await expect(
				page.getByRole( 'heading', { name: heading, exact: true } )
			).toBeVisible();
			await expect( page.locator( '#adminmenuwrap' ) ).toBeVisible();
			await expect( getCurrentMenuItem( page ) ).toHaveText( label );
			expect( getRoutePath( page ) ).toBe( settledPath );
		}
	} );

	test( 'switches sections from the admin menu without reloading', async ( {
		admin,
		page,
	} ) => {
		await visitRoute( admin, '/styles' );
		await page.evaluate( () => {
			window.__siteEditorDocumentMarker = true;
		} );

		await getAppearanceMenu( page )
			.getByRole( 'link', { name: 'Patterns', exact: true } )
			.click();

		await expect(
			page.getByRole( 'heading', { name: 'Patterns', exact: true } )
		).toBeVisible();
		await expect( getCurrentMenuItem( page ) ).toHaveText( 'Patterns' );
		expect( getRoutePath( page ) ).toBe( '/patterns/list/all' );
		expect(
			await page.evaluate( () => window.__siteEditorDocumentMarker )
		).toBe( true );
	} );

	test( 'keeps the section highlighted while editing one of its items', async ( {
		admin,
		page,
	} ) => {
		await visitRoute( admin, '/template-parts' );
		await page.evaluate( () => {
			window.__siteEditorDocumentMarker = true;
		} );

		await page.getByRole( 'link', { name: 'Header', exact: true } ).click();

		await expect(
			page.getByRole( 'region', { name: 'Editor top bar' } )
		).toBeVisible();
		expect( getRoutePath( page ) ).toBe(
			'/types/wp_template_part/edit/emptytheme%2F%2Fheader'
		);
		await expect( getCurrentMenuItem( page ) ).toHaveText(
			'Template Parts'
		);
		expect(
			await page.evaluate( () => window.__siteEditorDocumentMarker )
		).toBe( true );
	} );

	test( 'redirects site-editor.php links to the matching route', async ( {
		admin,
		page,
	} ) => {
		// The shape of the "Edit site" link in the admin bar.
		await admin.visitAdminPage(
			'site-editor.php',
			'postType=wp_template&postId=emptytheme//index&canvas=edit'
		);

		await expect( page ).toHaveURL( new RegExp( `page=${ PAGE }` ) );
		expect( getRoutePath( page ) ).toBe(
			'/types/wp_template/edit/emptytheme%2F%2Findex'
		);
		await expect( getCurrentMenuItem( page ) ).toHaveText( 'Templates' );

		await admin.visitAdminPage( 'site-editor.php' );

		await expect( page ).toHaveURL( new RegExp( `page=${ PAGE }` ) );
		expect( getRoutePath( page ) ).toBeNull();
		await expect( getCurrentMenuItem( page ) ).toHaveText( 'Editor' );
	} );

	test( 'toggles fullscreen mode while editing', async ( {
		admin,
		page,
	} ) => {
		await visitRoute(
			admin,
			'/types/wp_template_part/edit/emptytheme%2F%2Fheader'
		);

		const adminMenu = page.locator( '#adminmenuwrap' );
		const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
		const backButton = topBar.getByRole( 'button', { name: 'Back' } );
		const fullscreenItem = page.getByRole( 'menuitemcheckbox', {
			name: /Fullscreen mode/,
		} );
		const entityUrl = page.url();

		// On by default.
		await expect( topBar ).toBeVisible();
		await expect( adminMenu ).toBeHidden();
		await expect( backButton ).toBeVisible();

		await topBar.getByRole( 'button', { name: 'Options' } ).click();
		await expect( fullscreenItem ).toBeChecked();
		await fullscreenItem.click();

		await expect( adminMenu ).toBeVisible();
		await expect( backButton ).toBeHidden();
		await expect( page ).toHaveURL( entityUrl );

		// The canvas sits beside the admin menu, not under it.
		const adminMenuBox = await adminMenu.boundingBox();
		const topBarBox = await topBar.boundingBox();
		expect( adminMenuBox ).not.toBeNull();
		expect( topBarBox ).not.toBeNull();
		expect( topBarBox!.x ).toBeGreaterThanOrEqual(
			adminMenuBox!.x + adminMenuBox!.width
		);

		await fullscreenItem.click();

		await expect( adminMenu ).toBeHidden();
		await expect( backButton ).toBeVisible();
		await expect( page ).toHaveURL( entityUrl );
	} );
} );
