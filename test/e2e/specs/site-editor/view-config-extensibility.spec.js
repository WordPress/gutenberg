/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const PLUGIN_SLUG = 'gutenberg-test-view-config-extensibility';
const MATCHING_PAGE_TITLE = 'Published in 2021';
const NONMATCHING_PAGE_TITLE = 'Published in 2020';

test.describe( 'View config extensibility', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.activatePlugin( PLUGIN_SLUG );
		await requestUtils.resetPreferences();
		await requestUtils.deleteAllPages();

		await requestUtils.createPage( {
			title: NONMATCHING_PAGE_TITLE,
			status: 'publish',
			date: '2020-01-01T12:00:00',
		} );
		await requestUtils.createPage( {
			title: MATCHING_PAGE_TITLE,
			status: 'publish',
			date: '2021-01-01T12:00:00',
		} );
		await requestUtils.createPage( {
			title: 'Draft Included',
			status: 'draft',
			date: '2019-01-01T12:00:00',
		} );
		await requestUtils.createPage( {
			title: 'Draft Excluded',
			status: 'draft',
			date: '2017-01-01T12:00:00',
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( PLUGIN_SLUG );
		await requestUtils.resetPreferences();
		await requestUtils.deleteAllPages();
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'applies the filtered configuration throughout the Pages UI', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();
		await page.getByRole( 'button', { name: 'Pages' } ).click();

		// The filtered view list reaches the Site Editor sidebar.
		await expect(
			page.getByRole( 'button', { name: 'Published', exact: true } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'In progress', exact: true } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', {
				name: 'Published after 2020',
				exact: true,
			} )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Drafts', exact: true } )
		).toHaveCount( 0 );
		await expect(
			page.getByRole( 'button', { name: 'Scheduled', exact: true } )
		).toHaveCount( 0 );
		await expect(
			page.getByRole( 'button', { name: 'Pending', exact: true } )
		).toBeVisible();

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
		await page
			.getByRole( 'button', {
				name: 'Published after 2020',
				exact: true,
			} )
			.click();
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

		// The existing Drafts view keeps its status filter and gains the date filter.
		await page
			.getByRole( 'button', { name: 'In progress', exact: true } )
			.click();
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

		await page
			.getByRole( 'button', { name: 'Published', exact: true } )
			.click();
		await expect(
			table.getByRole( 'row', {
				name: new RegExp( MATCHING_PAGE_TITLE ),
			} )
		).toBeVisible();

		// The filtered form reaches the Quick Edit DataForm.
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
