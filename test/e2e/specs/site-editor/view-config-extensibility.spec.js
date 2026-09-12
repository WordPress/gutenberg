const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Whether the run targets the extensible site editor (v2). Its Pages screen
// renders the view list as tabs, the classic editor's as sidebar buttons.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

const getViewItem = ( page, name ) =>
	page.getByRole( isSiteEditorV2 ? 'tab' : 'button', { name, exact: true } );

const PLUGIN_SLUG = 'gutenberg-test-view-config-extensibility';
const MATCHING_PAGE_TITLE = 'Published in 2021';
const NONMATCHING_PAGE_TITLE = 'Published in 2020';

test.describe( 'View config extensibility', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.activatePlugin( PLUGIN_SLUG ),
			requestUtils.resetPreferences(),
			requestUtils.deleteAllPages(),
		] );

		await Promise.all( [
			requestUtils.createPage( {
				title: NONMATCHING_PAGE_TITLE,
				status: 'publish',
				date: '2020-01-01T12:00:00',
			} ),
			requestUtils.createPage( {
				title: MATCHING_PAGE_TITLE,
				status: 'publish',
				date: '2021-01-01T12:00:00',
			} ),
			requestUtils.createPage( {
				title: 'Draft Included',
				status: 'draft',
				date: '2019-01-01T12:00:00',
			} ),
			requestUtils.createPage( {
				title: 'Draft Excluded',
				status: 'draft',
				date: '2017-01-01T12:00:00',
			} ),
			// Excluded from "Published after 2020" solely by its status, so
			// it proves that view's status filter is applied. Its date must
			// pass the view's after-2020 filter yet predate the newest
			// published fixture, which the default view expects first.
			requestUtils.createPage( {
				title: 'Draft After 2020',
				status: 'draft',
				date: '2021-01-01T06:00:00',
			} ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deactivatePlugin( PLUGIN_SLUG ),
			requestUtils.resetPreferences(),
			requestUtils.deleteAllPages(),
			requestUtils.activateTheme( 'twentytwentyone' ),
		] );
	} );

	test( 'applies the filtered configuration throughout the Pages UI', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor( { postType: 'page' } );

		// The filtered view list reaches the Site Editor sidebar.
		await expect( getViewItem( page, 'Published' ) ).toBeVisible();
		await expect( getViewItem( page, 'In progress' ) ).toBeVisible();
		await expect(
			getViewItem( page, 'Published after 2020' )
		).toBeVisible();
		await expect( getViewItem( page, 'Drafts' ) ).toHaveCount( 0 );
		await expect( getViewItem( page, 'Scheduled' ) ).toHaveCount( 0 );
		await expect( getViewItem( page, 'Pending' ) ).toBeVisible();

		// The default view and the only allowed layout reach DataViews.
		const table = page.getByRole( 'table' );
		await expect( table ).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Layout', exact: true } )
		).toHaveCount( 0 );
		await expect( table.getByRole( 'row' ).nth( 1 ) ).toHaveAccessibleName(
			new RegExp( MATCHING_PAGE_TITLE )
		);

		const statusHeader = table.getByRole( 'columnheader', {
			name: /Status/,
		} );
		await expect( statusHeader ).toBeVisible();
		await expect(
			table.getByRole( 'columnheader', { name: /Author/ } )
		).toHaveCount( 0 );
		await expect( statusHeader ).toHaveAttribute(
			'style',
			/width:\s*240px/
		);

		await page.getByRole( 'button', { name: 'View options' } ).click();
		await expect( page.getByLabel( 'Sort by' ) ).toHaveValue( 'date' );
		await expect(
			page.getByRole( 'radio', { name: 'Sort descending' } )
		).toBeChecked();
		await page.keyboard.press( 'Escape' );

		// A newly added view applies all of its custom filters.
		await getViewItem( page, 'Published after 2020' ).click();
		await expect(
			table.getByRole( 'row', {
				name: new RegExp( MATCHING_PAGE_TITLE ),
			} )
		).toBeVisible();
		await expect(
			table.getByRole( 'row', {
				name: new RegExp( NONMATCHING_PAGE_TITLE ),
			} )
		).toHaveCount( 0 );
		await expect(
			table.getByRole( 'row', { name: /Draft Included/ } )
		).toHaveCount( 0 );
		await expect(
			table.getByRole( 'row', { name: /Draft Excluded/ } )
		).toHaveCount( 0 );
		// This page passes the date filter, so only the status filter
		// excludes it.
		await expect(
			table.getByRole( 'row', { name: /Draft After 2020/ } )
		).toHaveCount( 0 );

		// The existing Drafts view keeps its status filter and gains the date filter.
		await getViewItem( page, 'In progress' ).click();
		await expect(
			table.getByRole( 'row', { name: /Draft Included/ } )
		).toBeVisible();
		await expect(
			table.getByRole( 'row', { name: /Draft Excluded/ } )
		).toHaveCount( 0 );
		await expect(
			table.getByRole( 'row', {
				name: new RegExp( MATCHING_PAGE_TITLE ),
			} )
		).toHaveCount( 0 );
		await expect(
			table.getByRole( 'row', {
				name: new RegExp( NONMATCHING_PAGE_TITLE ),
			} )
		).toHaveCount( 0 );

		await getViewItem( page, 'Published' ).click();
		await expect(
			table.getByRole( 'row', {
				name: new RegExp( MATCHING_PAGE_TITLE ),
			} )
		).toBeVisible();
	} );

	// v2 gap: the extensible site editor's Pages screen consumes the view
	// config for its views and layouts, but its Quick Edit form does not
	// consume the form section yet.
	test( 'applies the filtered form to the Quick Edit DataForm @site-editor-v1-only', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor( { postType: 'page' } );

		const table = page.getByRole( 'table' );
		const matchingPageRow = table.getByRole( 'row', {
			name: new RegExp( MATCHING_PAGE_TITLE ),
		} );
		await matchingPageRow
			.getByRole( 'button', { name: 'Quick Edit' } )
			.click();

		const quickEditModal = page.locator(
			'.dataviews-action-modal__quick-edit'
		);
		await expect( quickEditModal ).toBeVisible();
		await expect(
			quickEditModal.getByRole( 'textbox', { name: 'Link' } )
		).toBeVisible();
		await expect(
			quickEditModal.getByRole( 'button', { name: 'Edit Slug' } )
		).toHaveCount( 0 );
		await expect(
			quickEditModal.getByRole( 'button', { name: 'Edit Status' } )
		).toHaveCount( 0 );
	} );
} );
