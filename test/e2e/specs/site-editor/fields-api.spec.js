const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const PLUGIN_SLUG = 'gutenberg-test-fields-api';

// 200 words per minute, see packages/e2e-tests/plugins/fields-api/reading-time.js.
const words = ( count ) => Array( count ).fill( 'word' ).join( ' ' );
const PAGES = [
	{
		title: 'Empty Page',
		content: '',
		menu_order: 1,
		comment_status: 'closed',
		subtitle: '',
	},
	{
		title: 'Short Page',
		content: words( 300 ),
		menu_order: 2,
		comment_status: 'open',
		subtitle: 'A short read',
	},
	{
		title: 'Long Page',
		content: words( 2200 ),
		menu_order: 3,
		comment_status: 'closed',
		subtitle: 'A long read',
	},
];

/**
 * Switches the Pages list to the table layout and shows the given fields,
 * which the default view does not display.
 *
 * @param {import('@playwright/test').Page} page   The page.
 * @param {string[]}                        labels The labels of the fields.
 */
async function showFieldsInTable( page, labels ) {
	await page.getByRole( 'button', { name: 'Layout', exact: true } ).click();
	await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();

	if ( labels.length ) {
		await page.getByRole( 'button', { name: 'View options' } ).click();
		for ( const label of labels ) {
			await page
				.getByRole( 'button', { name: label, exact: true } )
				.click();
		}
		await page.keyboard.press( 'Escape' );
	}

	await expect( page.getByRole( 'table' ) ).toBeVisible();
}

/**
 * The cell of the given column in a table row.
 *
 * @param {import('@playwright/test').Locator} table  The table.
 * @param {import('@playwright/test').Locator} row    The row.
 * @param {string}                             column The column header.
 */
async function getCell( table, row, column ) {
	// Text content rather than inner text: the header is styled uppercase
	// and the sorted column appends an arrow.
	const headers = await table.getByRole( 'columnheader' ).allTextContents();
	const index = headers.findIndex( ( text ) => text.startsWith( column ) );
	expect( index, `Column "${ column }" not found` ).toBeGreaterThan( -1 );
	return row.getByRole( 'cell' ).nth( index );
}

test.describe( 'Fields API', () => {
	let authorId;

	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.activatePlugin( PLUGIN_SLUG ),
			requestUtils.deleteAllPages(),
		] );

		const [ user ] = await Promise.all( [
			requestUtils.rest( { path: '/wp/v2/users/me' } ),
			...PAGES.map( ( data ) =>
				requestUtils.rest( {
					method: 'POST',
					path: '/wp/v2/pages',
					data: { ...data, status: 'publish' },
				} )
			),
		] );
		authorId = user.id;
	} );

	// The layout and the fields shown persist in the user preferences.
	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.resetPreferences();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deactivatePlugin( PLUGIN_SLUG ),
			requestUtils.resetPreferences(),
			requestUtils.deleteAllPages(),
			requestUtils.activateTheme( 'twentytwentyone' ),
		] );
	} );

	test( 'shows the registered fields in the Pages list', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor( { postType: 'page' } );
		await showFieldsInTable( page, [ 'Order', 'Reading time' ] );
		const table = page.getByRole( 'table' );

		// The declarative field reads its value from the record.
		const shortPage = table.getByRole( 'row', { name: /Short Page/ } );
		await expect( await getCell( table, shortPage, 'Order' ) ).toHaveText(
			'2'
		);

		// The field backed by the script module computes its value and
		// renders it, styled by the stylesheet the plugin enqueues.
		const readingTime = ( row ) =>
			row.locator( '.gutenberg-test-reading-time' );
		await expect( readingTime( shortPage ) ).toHaveText( '2 min' );
		await expect( readingTime( shortPage ) ).toHaveCSS(
			'background-color',
			'rgb(56, 88, 233)'
		);

		const emptyPage = table.getByRole( 'row', { name: /Empty Page/ } );
		await expect( readingTime( emptyPage ) ).toHaveText( 'Empty' );
		await expect( readingTime( emptyPage ) ).toHaveCSS(
			'background-color',
			'rgb(148, 148, 148)'
		);

		const longPage = table.getByRole( 'row', { name: /Long Page/ } );
		await expect( readingTime( longPage ) ).toHaveText( '11 min' );
		await expect( readingTime( longPage ) ).toHaveCSS(
			'background-color',
			'rgb(204, 24, 24)'
		);
	} );

	test( 'updates a default field', async ( { admin, page } ) => {
		await admin.visitSiteEditor( { postType: 'page' } );
		// The update field makes it hideable, hence showable.
		await showFieldsInTable( page, [ 'Comments' ] );
		const table = page.getByRole( 'table' );

		// The field keeps its label and elements, and renders with
		// the plugin's render.
		const commentStatus = ( row ) =>
			row.locator( '.gutenberg-test-comment-status' );
		const shortPage = table.getByRole( 'row', { name: /Short Page/ } );
		await expect( commentStatus( shortPage ) ).toHaveText( 'Open' );
		await expect( commentStatus( shortPage ) ).toHaveClass( /is-open/ );
		const emptyPage = table.getByRole( 'row', { name: /Empty Page/ } );
		await expect( commentStatus( emptyPage ) ).toHaveText( 'Closed' );
		await expect( commentStatus( emptyPage ) ).toHaveClass( /is-closed/ );

		// The update makes the field sortable.
		await page.getByRole( 'button', { name: 'View options' } ).click();
		await expect(
			page
				.getByLabel( 'Sort by' )
				.locator( 'option', { hasText: 'Comments' } )
		).toHaveCount( 1 );
		await page.keyboard.press( 'Escape' );
	} );

	test( 'replaces a default field', async ( { admin, page } ) => {
		await admin.visitSiteEditor( { postType: 'page' } );
		await showFieldsInTable( page, [] );
		const table = page.getByRole( 'table' );

		// The new field is a plain integer: without the default render, it
		// shows the user id the record holds, under its new label.
		await expect(
			table.getByRole( 'columnheader', { name: /Author/ } )
		).toHaveCount( 0 );
		const shortPage = table.getByRole( 'row', { name: /Short Page/ } );
		await expect(
			await getCell( table, shortPage, 'Written by' )
		).toHaveText( String( authorId ) );
	} );

	test( 'shows the replaced field in the Quick Edit form', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor( { postType: 'page' } );
		await showFieldsInTable( page, [] );

		await page
			.getByRole( 'row', { name: /Short Page/ } )
			.getByRole( 'button', { name: 'Quick Edit' } )
			.click();
		const quickEditModal = page.locator(
			'.dataviews-action-modal__quick-edit'
		);
		await expect( quickEditModal ).toBeVisible();

		// The replaced field offers the control of its new type.
		await quickEditModal
			.getByRole( 'button', { name: 'Edit Written by' } )
			.click();
		await expect(
			page.getByRole( 'spinbutton', { name: 'Written by' } )
		).toHaveValue( String( authorId ) );
	} );

	test( 'reads and writes a field backed by data the plugin adds to the REST endpoint', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await admin.visitSiteEditor( { postType: 'page' } );
		// The column is shown after the edit: a popover opened before the
		// Quick Edit modal leaves its container hidden from assistive
		// technology, and the form control would not be found by role.
		await showFieldsInTable( page, [] );
		const table = page.getByRole( 'table' );

		// The field is not read-only: the Quick Edit form saves the edit
		// with the record, and the REST field the plugin registers writes
		// it.
		const shortPage = table.getByRole( 'row', { name: /Short Page/ } );
		await shortPage.getByRole( 'button', { name: 'Quick Edit' } ).click();
		const quickEditModal = page.locator(
			'.dataviews-action-modal__quick-edit'
		);
		await expect( quickEditModal ).toBeVisible();
		await quickEditModal
			.getByRole( 'button', { name: 'Edit Subtitle' } )
			.click();
		const subtitleInput = page.getByRole( 'textbox', { name: 'Subtitle' } );
		await expect( subtitleInput ).toHaveValue( 'A short read' );
		await subtitleInput.fill( 'An even shorter read' );
		await quickEditModal.getByRole( 'button', { name: 'Done' } ).click();
		await expect( quickEditModal ).toBeHidden();

		// The value reached the server.
		const [ saved ] = await requestUtils.rest( {
			path: '/wp/v2/pages',
			params: { search: 'Short Page' },
		} );
		expect( saved.subtitle ).toBe( 'An even shorter read' );

		// The REST field carries the value in the record, where the
		// declarative field reads it.
		await page.getByRole( 'button', { name: 'View options' } ).click();
		await page
			.getByRole( 'button', { name: 'Subtitle', exact: true } )
			.click();
		await page.keyboard.press( 'Escape' );
		await expect(
			await getCell( table, shortPage, 'Subtitle' )
		).toHaveText( 'An even shorter read' );
		const emptyPage = table.getByRole( 'row', { name: /Empty Page/ } );
		await expect(
			await getCell( table, emptyPage, 'Subtitle' )
		).toHaveText( '' );
	} );

	test( 'ignores a field defined only in a script module', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor( { postType: 'page' } );
		await showFieldsInTable( page, [ 'Reading time' ] );
		const table = page.getByRole( 'table' );

		// The module loaded: the field registered with it renders.
		await expect(
			table
				.getByRole( 'row', { name: /Short Page/ } )
				.locator( '.gutenberg-test-reading-time' )
		).toHaveText( '2 min' );

		// The same module exports a complete definition of a `word_count`
		// field no PHP registration names. A module only augments the
		// fields it was registered with, so the field is neither a column
		// nor offered from the view options.
		await expect(
			table.getByRole( 'columnheader', { name: /Word count/ } )
		).toHaveCount( 0 );
		await expect(
			page.locator( '.gutenberg-test-word-count' )
		).toHaveCount( 0 );
		await page.getByRole( 'button', { name: 'View options' } ).click();
		await expect(
			page.getByRole( 'button', { name: 'Word count', exact: true } )
		).toHaveCount( 0 );
		await page.keyboard.press( 'Escape' );
	} );

	test( 'loads the fields in the extensible site editor embedded in wp-admin', async ( {
		admin,
		page,
	} ) => {
		// The page renders inside the wp-admin chrome, on a submenu the test
		// plugin registers: the field modules must reach its import map and
		// the plugin enqueues its stylesheet from the page's `_init` action.
		await admin.visitAdminPage(
			'admin.php',
			'page=site-editor-v2-wp-admin&p=/types/page'
		);
		await showFieldsInTable( page, [ 'Reading time' ] );

		const readingTime = page
			.getByRole( 'row', { name: /Long Page/ } )
			.locator( '.gutenberg-test-reading-time' );
		await expect( readingTime ).toHaveText( '11 min' );
		await expect( readingTime ).toHaveCSS(
			'background-color',
			'rgb(204, 24, 24)'
		);
	} );
} );
