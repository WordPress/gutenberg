const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const PLUGIN_SLUG = 'gutenberg-test-entity-actions-api';

/**
 * Creates a published page.
 *
 * @param {Object} requestUtils The request utils.
 * @param {Object} data         The data of the page.
 * @return {Promise<Object>} The page.
 */
function createPage( requestUtils, data ) {
	return requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/pages',
		data: { ...data, status: 'publish' },
	} );
}

/**
 * Switches the Pages list to the table layout and opens the actions menu of
 * the row of a page.
 *
 * @param {import('@playwright/test').Page} page  The page.
 * @param {string}                          title The title of the page.
 */
async function openRowActions( page, title ) {
	await page.getByRole( 'button', { name: 'Layout', exact: true } ).click();
	await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();
	await page
		.getByRole( 'row', { name: new RegExp( title ) } )
		.getByRole( 'button', { name: 'Actions' } )
		.click();
	await expect( page.getByRole( 'menuitem' ).first() ).toBeVisible();
}

test.describe( 'Entity actions API', () => {
	// Switching the theme writes the `template` and the `stylesheet` options
	// one after the other, so a request that lands between the two reads a
	// theme that does not exist and answers 500. Keep it on its own.
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.activatePlugin( PLUGIN_SLUG );
	} );

	// The layout persists in the user preferences.
	test.beforeEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.resetPreferences(),
			requestUtils.deleteAllPages(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deactivatePlugin( PLUGIN_SLUG ),
			requestUtils.resetPreferences(),
			requestUtils.deleteAllPages(),
		] );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'adds an action from a script module', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const [ openPage ] = await Promise.all( [
			createPage( requestUtils, {
				title: 'Open Page',
				comment_status: 'open',
			} ),
			createPage( requestUtils, {
				title: 'Closed Page',
				comment_status: 'closed',
			} ),
		] );
		await admin.visitSiteEditor( { postType: 'page' } );

		// The eligibility of the action comes from its script module.
		await openRowActions( page, 'Closed Page' );
		await expect(
			page.getByRole( 'menuitem', { name: 'Rename…' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'menuitem', { name: 'Close comments' } )
		).toHaveCount( 0 );
		await page.keyboard.press( 'Escape' );

		// So does its callback.
		await page
			.getByRole( 'row', { name: /Open Page/ } )
			.getByRole( 'button', { name: 'Actions' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Close comments' } ).click();
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Comments closed.' } )
		).toBeVisible();
		await expect
			.poll(
				async () =>
					(
						await requestUtils.rest( {
							path: `/wp/v2/pages/${ openPage.id }`,
						} )
					).comment_status
			)
			.toBe( 'closed' );
	} );

	test( 'ignores an action defined only in a script module', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await createPage( requestUtils, {
			title: 'Open Page',
			comment_status: 'open',
		} );
		await admin.visitSiteEditor( { postType: 'page' } );
		await openRowActions( page, 'Open Page' );

		// The module loaded: the action registered with it shows.
		await expect(
			page.getByRole( 'menuitem', { name: 'Close comments' } )
		).toBeVisible();

		// The same module exports a complete definition of an `archive`
		// action no PHP registration names. A module only augments the
		// actions it was registered with, so the action is not shown.
		await expect(
			page.getByRole( 'menuitem', { name: 'Archive' } )
		).toHaveCount( 0 );
	} );

	test( 'replaces a core action, keeping its JavaScript parts', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const binPage = await createPage( requestUtils, {
			title: 'Bin Page',
		} );
		await admin.visitSiteEditor( { postType: 'page' } );
		await openRowActions( page, 'Bin Page' );

		// The core action is gone, under its label and as a primary action.
		await expect(
			page.getByRole( 'menuitem', { name: 'Trash…' } )
		).toHaveCount( 0 );
		await expect(
			page
				.getByRole( 'row', { name: /Bin Page/ } )
				.getByRole( 'button', { name: 'Trash', exact: true } )
		).toHaveCount( 0 );

		// The substitute opens the confirmation of the core action.
		await page.getByRole( 'menuitem', { name: 'Move to bin…' } ).click();
		const dialog = page.getByRole( 'dialog' );
		await expect( dialog ).toContainText(
			'Are you sure you want to move "Bin Page" to the trash?'
		);
		await dialog.getByRole( 'button', { name: 'Trash' } ).click();
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: '"Bin Page" moved to the trash.' } )
		).toBeVisible();
		await expect
			.poll(
				async () =>
					(
						await requestUtils.rest( {
							path: `/wp/v2/pages/${ binPage.id }`,
						} )
					).status
			)
			.toBe( 'trash' );
	} );

	test( 'removes a core action', async ( { admin, page, requestUtils } ) => {
		await createPage( requestUtils, { title: 'Single Page' } );
		await admin.visitSiteEditor( { postType: 'page' } );
		await openRowActions( page, 'Single Page' );

		await expect(
			page.getByRole( 'menuitem', { name: 'Rename…' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'menuitem', { name: 'Duplicate…' } )
		).toHaveCount( 0 );
	} );

	test( 'shows the actions in the editor inspector', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const openPage = await createPage( requestUtils, {
			title: 'Open Page',
			comment_status: 'open',
		} );
		await admin.editPost( openPage.id );
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Actions' } )
			.click();

		await expect(
			page.getByRole( 'menuitem', { name: 'Close comments' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'menuitem', { name: 'Move to bin…' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'menuitem', { name: 'Duplicate…' } )
		).toHaveCount( 0 );
	} );
} );
