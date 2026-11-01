const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Whether the run targets the extensible site editor (v2). Its Pages screen
// renders the view list as tabs, the classic editor's as sidebar buttons.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

// Each view trails its label with the item count, as in "Drafts 3".
const getCountName = ( label, count = '[\\d,]+' ) =>
	new RegExp( `^${ label } ?${ count }$` );

const getTab = ( page, label ) =>
	page.getByRole( isSiteEditorV2 ? 'tab' : 'button', {
		name: getCountName( label ),
	} );

async function expectCounts( page, counts ) {
	for ( const [ label, count ] of Object.entries( counts ) ) {
		await expect( getTab( page, label ) ).toHaveAccessibleName(
			getCountName( label, count )
		);
	}
}

async function openRowActions( page, title ) {
	const row = page.getByRole( 'row', { name: new RegExp( title ) } );
	await row.hover();
	await row.getByRole( 'button', { name: 'Actions' } ).click();
}

// Fails every request that would change the given page, so a bulk action on it
// and another page only partly succeeds.
async function failChangesToPage( page, id ) {
	await page.route(
		( url ) =>
			( url.searchParams.get( 'rest_route' ) ?? url.pathname ).endsWith(
				`/wp/v2/pages/${ id }`
			),
		async ( route ) => {
			if ( route.request().method() === 'GET' ) {
				await route.continue();
				return;
			}
			await route.fulfill( {
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify( {
					code: 'rest_failed',
					message: 'The request failed.',
				} ),
			} );
		}
	);
}

// Creates two pages in the trash: one an action can change, and one whose
// changes fail.
async function trashTwoPages( page, requestUtils ) {
	const changed = await requestUtils.createPage( {
		title: 'Changed Page',
		status: 'draft',
	} );
	const failing = await requestUtils.createPage( {
		title: 'Failing Page',
		status: 'draft',
	} );
	for ( const { id } of [ changed, failing ] ) {
		await requestUtils.rest( {
			method: 'DELETE',
			path: `/wp/v2/pages/${ id }`,
		} );
	}
	await failChangesToPage( page, failing.id );
}

// The bulk actions show in a toolbar over the table header, outside the table
// and apart from each row's own actions, such as Restore.
const getBulkAction = ( page, name ) =>
	page
		.locator( '.dataviews-view-table__bulk-actions-overlay' )
		.getByRole( 'button', { name, exact: true } );

async function selectAllInTrash( page ) {
	await getTab( page, 'Trash' ).click();
	await page
		.getByRole( 'table' )
		.getByRole( 'checkbox', { name: 'Select all' } )
		.click();
	await expect(
		page.getByRole( 'checkbox', { name: 'Deselect all', exact: true } )
	).toBeChecked();
}

test.describe( 'Page List status counts', () => {
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

	test( 'updates the counts after publishing a draft in the editor', async ( {
		page,
	} ) => {
		// The row opens the editor from both the thumbnail and the title: as
		// links in v2, as buttons in the classic editor.
		await page
			.getByRole( 'row', { name: /Draft Page/ } )
			.getByRole( isSiteEditorV2 ? 'link' : 'button', {
				name: 'Draft Page',
			} )
			.last()
			.click();
		// The site editor publishes from the header, without a pre-publish panel.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Publish', exact: true } )
			.click();
		await expect(
			page.getByRole( 'button', { name: 'Dismiss this notice' } )
		).toContainText( 'published' );

		// Go back within the app, so the counts come from the store rather
		// than a fresh page load.
		await page.goBack();

		await expectCounts( page, { 'All Pages': 2, Published: 2, Drafts: 0 } );
		await expect( page.getByRole( 'table' ) ).toBeVisible();
	} );

	test( 'updates the counts when a bulk restore only partly succeeds', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await trashTwoPages( page, requestUtils );
		await admin.visitSiteEditor( { postType: 'page' } );
		await expectCounts( page, { 'All Pages': 2, Drafts: 1, Trash: 2 } );

		await selectAllInTrash( page );
		await getBulkAction( page, 'Restore' ).click();

		// Restored pages become drafts; the failing page stays in the trash.
		await expectCounts( page, { 'All Pages': 3, Drafts: 2, Trash: 1 } );
	} );

	test( 'updates the counts when a bulk permanent delete only partly succeeds', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await trashTwoPages( page, requestUtils );
		await admin.visitSiteEditor( { postType: 'page' } );
		await expectCounts( page, { 'All Pages': 2, Trash: 2 } );

		await selectAllInTrash( page );
		await getBulkAction( page, 'Permanently delete' ).click();
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Delete permanently' } )
			.click();

		await expectCounts( page, { 'All Pages': 2, Trash: 1 } );
	} );
} );
