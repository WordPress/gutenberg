import type { Page } from '@playwright/test';
import type {
	Editor,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

async function insertNavigation(
	editor: Editor,
	requestUtils: RequestUtils,
	attributes: Record< string, unknown > = {}
) {
	const menu = await requestUtils.createNavigationMenu( {
		title: 'Overlay viewports menu',
		content:
			'<!-- wp:navigation-link {"label":"Overlay Link One","type":"custom","url":"#one","kind":"custom"} /-->' +
			'<!-- wp:navigation-link {"label":"Overlay Link Two","type":"custom","url":"#two","kind":"custom"} /-->',
	} );

	await editor.insertBlock( {
		name: 'core/navigation',
		attributes: { ref: menu.id, ...attributes },
	} );

	const navigationBlock = editor.canvas.getByRole( 'document', {
		name: 'Block: Navigation',
		exact: true,
	} );
	await expect( navigationBlock ).toBeVisible();
	await editor.selectBlocks( navigationBlock );
}

async function switchDevicePreview( page: Page, device: string ) {
	await page.getByRole( 'button', { name: 'View', exact: true } ).click();
	await page.getByRole( 'menuitemradio', { name: device } ).click();
	await page.keyboard.press( 'Escape' );
}

// These tests intentionally run on the suite's default classic theme
// (Twenty Twenty-One), which prints the generated block-supports styles in
// the footer rather than the head, so the front-end tests cover that path.
test.describe( 'Navigation block - Overlay viewports', () => {
	test.beforeEach( async ( { admin, page } ) => {
		// Leave room for the 781px Tablet preview beside the settings sidebar.
		await page.setViewportSize( { width: 1600, height: 900 } );
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test( 'shows the Tablet overlay in the Tablet preview only', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await insertNavigation( editor, requestUtils, {
			overlayMenu: 'tablet',
		} );

		const openMenuButton = editor.canvas.getByRole( 'button', {
			name: 'Open menu',
		} );
		const link = editor.canvas
			.getByRole( 'textbox', { name: 'Navigation link text' } )
			.filter( { hasText: 'Overlay Link One' } );

		await switchDevicePreview( page, 'Tablet' );
		await expect( openMenuButton ).toBeVisible();
		await expect( link ).toBeHidden();

		await switchDevicePreview( page, 'Desktop' );
		await expect( link ).toBeVisible();
		await expect( openMenuButton ).toBeHidden();
	} );

	test( 'sets the Tablet overlay from the block inspector', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await insertNavigation( editor, requestUtils );

		await editor.openDocumentSettingsSidebar();
		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await editorSettings.getByRole( 'tab', { name: 'Settings' } ).click();
		await editorSettings
			.getByRole( 'radiogroup', { name: 'Configure overlay visibility' } )
			.getByRole( 'radio', { name: 'Tablet' } )
			.click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/navigation',
				attributes: { overlayMenu: 'tablet' },
			},
		] );
	} );

	test( 'collapses the Tablet overlay at the tablet breakpoint on the front end', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await insertNavigation( editor, requestUtils, {
			overlayMenu: 'tablet',
		} );
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const openMenuButton = page.getByRole( 'button', {
			name: 'Open menu',
		} );
		const link = page.getByRole( 'link', { name: 'Overlay Link One' } );

		await page.setViewportSize( { width: 700, height: 800 } );
		await expect( openMenuButton ).toBeVisible();
		await expect( link ).toBeHidden();

		await page.setViewportSize( { width: 900, height: 800 } );
		await expect( link ).toBeVisible();
		await expect( openMenuButton ).toBeHidden();
	} );

	test( 'keeps the Mobile overlay collapsing below 600px on the front end', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		// Mobile is the default Overlay Visibility.
		await insertNavigation( editor, requestUtils );
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const openMenuButton = page.getByRole( 'button', {
			name: 'Open menu',
		} );
		const link = page.getByRole( 'link', { name: 'Overlay Link One' } );

		await page.setViewportSize( { width: 590, height: 800 } );
		await expect( openMenuButton ).toBeVisible();
		await expect( link ).toBeHidden();

		await page.setViewportSize( { width: 610, height: 800 } );
		await expect( link ).toBeVisible();
		await expect( openMenuButton ).toBeHidden();
	} );

	test.describe( 'with a per-language filter', () => {
		// The plugin shows the overlay on mobile and tablet for `de`, and
		// leaves other languages unfiltered.
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-navigation-overlay-viewports-locale'
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-navigation-overlay-viewports-locale'
			);
		} );

		test( 'updates the editor when the language changes', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			await insertNavigation( editor, requestUtils );

			const openMenuButton = editor.canvas.getByRole( 'button', {
				name: 'Open menu',
			} );
			const link = editor.canvas
				.getByRole( 'textbox', { name: 'Navigation link text' } )
				.filter( { hasText: 'Overlay Link One' } );
			const setLanguage = ( language: string ) =>
				page.evaluate( ( value ) => {
					window.wp.data
						.dispatch(
							'gutenberg-test/navigation-overlay-viewports-locale'
						)
						.setLanguage( value );
				}, language );

			// The Tablet preview is wider than the default 600px breakpoint.
			await switchDevicePreview( page, 'Tablet' );
			await expect( link ).toBeVisible();
			await expect( openMenuButton ).toBeHidden();

			await setLanguage( 'de' );
			await expect( openMenuButton ).toBeVisible();
			await expect( link ).toBeHidden();

			await setLanguage( '' );
			await expect( link ).toBeVisible();
			await expect( openMenuButton ).toBeHidden();
		} );

		test( 'uses the language from the query on the front end', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			await insertNavigation( editor, requestUtils );
			const postId = await editor.publishPost();

			const openMenuButton = page.getByRole( 'button', {
				name: 'Open menu',
			} );
			const link = page.getByRole( 'link', { name: 'Overlay Link One' } );

			await page.setViewportSize( { width: 700, height: 800 } );
			await page.goto( `/?p=${ postId }` );
			await expect( link ).toBeVisible();
			await expect( openMenuButton ).toBeHidden();

			await page.goto( `/?p=${ postId }&lang=de` );
			await expect( openMenuButton ).toBeVisible();
			await expect( link ).toBeHidden();

			await page.setViewportSize( { width: 900, height: 800 } );
			await expect( link ).toBeVisible();
			await expect( openMenuButton ).toBeHidden();
		} );
	} );
} );
