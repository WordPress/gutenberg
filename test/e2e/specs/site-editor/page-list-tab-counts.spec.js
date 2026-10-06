const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Whether the run targets the extensible site editor (v2). Only its Pages
// screen renders the view list as tabs, which is where the counts show.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

// Each tab trails its label with the item count, as in "Drafts 3".
const getTab = ( page, label ) =>
	page.getByRole( 'tab', { name: new RegExp( `^${ label } [\\d,]+$` ) } );

async function expectCounts( page, counts ) {
	for ( const [ label, count ] of Object.entries( counts ) ) {
		await expect( getTab( page, label ) ).toHaveAccessibleName(
			`${ label } ${ count }`
		);
	}
}

async function openRowActions( page, title ) {
	const row = page.getByRole( 'row', { name: new RegExp( title ) } );
	await row.hover();
	await row.getByRole( 'button', { name: 'Actions' } ).click();
}

test.describe( 'Page List status tab counts', () => {
	test.skip( ! isSiteEditorV2, 'Only the v2 Pages screen renders tabs.' );

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin, page, requestUtils } ) => {
		await requestUtils.deleteAllPages();
		await requestUtils.createPage( {
			title: 'Draft Page',
			status: 'draft',
		} );
		await requestUtils.createPage( {
			title: 'Published Page',
			status: 'publish',
		} );
		await admin.visitSiteEditor( { postType: 'page' } );

		// Use the table layout, both for its row actions and so a later check
		// can confirm refreshing the counts leaves the saved view alone.
		await page.getByRole( 'button', { name: 'Layout' } ).click();
		await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();
		await page.keyboard.press( 'Escape' );
		await expect( page.getByRole( 'table' ) ).toBeVisible();
	} );

	test.afterEach( async ( { page } ) => {
		await page.getByRole( 'button', { name: 'View options' } ).click();
		await page.getByRole( 'button', { name: 'Reset view' } ).click();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deleteAllPages();
	} );

	// The assertions are in `expectCounts`.
	// eslint-disable-next-line playwright/expect-expect
	test( 'shows the item count of each status', async ( { page } ) => {
		await expectCounts( page, {
			'All Pages': 2,
			Published: 1,
			Scheduled: 0,
			Drafts: 1,
			Pending: 0,
			Private: 0,
			Trash: 0,
		} );
	} );

	test( 'updates the counts when a page is trashed, restored, and permanently deleted', async ( {
		page,
	} ) => {
		await openRowActions( page, 'Draft Page' );
		await page.getByRole( 'menuitem', { name: 'Trash…' } ).click();
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Trash' } )
			.click();
		await expectCounts( page, { 'All Pages': 1, Drafts: 0, Trash: 1 } );

		await getTab( page, 'Trash' ).click();
		await openRowActions( page, 'Draft Page' );
		await page.getByRole( 'menuitem', { name: 'Restore' } ).click();
		await expectCounts( page, { 'All Pages': 2, Drafts: 1, Trash: 0 } );

		// Trash it again to delete it for good.
		await getTab( page, 'All Pages' ).click();
		await openRowActions( page, 'Draft Page' );
		await page.getByRole( 'menuitem', { name: 'Trash…' } ).click();
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Trash' } )
			.click();
		await getTab( page, 'Trash' ).click();
		await openRowActions( page, 'Draft Page' );
		await page
			.getByRole( 'menuitem', { name: 'Permanently delete…' } )
			.click();
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Delete permanently' } )
			.click();
		await expectCounts( page, { 'All Pages': 1, Drafts: 0, Trash: 0 } );

		// Refreshing the counts keeps the table layout the user chose. The
		// trash is empty by now, so check on a tab that still lists a page.
		await getTab( page, 'All Pages' ).click();
		await expect( page.getByRole( 'table' ) ).toBeVisible();
	} );

	test( 'updates the counts when a page is duplicated', async ( {
		page,
	} ) => {
		await openRowActions( page, 'Published Page' );
		await page.getByRole( 'menuitem', { name: 'Duplicate…' } ).click();
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Duplicate' } )
			.click();

		// Duplicates are created as drafts.
		await expectCounts( page, { 'All Pages': 3, Published: 1, Drafts: 2 } );
		await expect( page.getByRole( 'table' ) ).toBeVisible();
	} );

	test( 'updates the counts when Quick Edit changes the status', async ( {
		page,
	} ) => {
		const row = page.getByRole( 'row', { name: /Published Page/ } );
		await row.hover();
		await row.getByRole( 'button', { name: 'Quick Edit' } ).click();

		const editStatus = page.getByRole( 'button', { name: 'Edit Status' } );
		await editStatus.locator( '..' ).hover();
		await editStatus.click();
		await page.getByRole( 'radio', { name: 'Draft' } ).click();
		await page.getByRole( 'button', { name: 'Done' } ).click();

		await expectCounts( page, { 'All Pages': 2, Published: 0, Drafts: 2 } );
		await expect( page.getByRole( 'table' ) ).toBeVisible();
	} );
} );
