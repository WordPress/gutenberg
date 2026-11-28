const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Whether the run targets the extensible site editor (v2).
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

test.describe( 'Style Book preference in Styles', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		// Start as a user who has never turned the Style Book on or off.
		await requestUtils.resetPreferences();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.resetPreferences();
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	const styleBookButton = ( page ) =>
		page.getByRole( 'button', { name: 'Style Book', exact: true } );
	const styleBook = ( page ) =>
		page.locator( 'iframe[name="style-book-canvas"]' );
	const stylesPanel = ( page ) =>
		page.locator( '.edit-site-styles, .routes-styles__page' );

	async function expectStyleBook( page, isShown ) {
		await expect( styleBookButton( page ) ).toHaveAttribute(
			'aria-pressed',
			String( isShown )
		);
		if ( isShown ) {
			await expect( styleBook( page ) ).toBeVisible();
		} else {
			await expect( styleBook( page ) ).toBeHidden();
		}
	}

	// Opens Styles from the site editor's navigation, as a user would.
	async function openStyles( admin, page ) {
		await admin.visitSiteEditor();
		await page
			.getByRole( isSiteEditorV2 ? 'link' : 'button', {
				name: 'Styles',
				exact: true,
			} )
			.click();
	}

	async function getSavedPreference( requestUtils ) {
		const user = await requestUtils.rest( {
			path: '/wp/v2/users/me',
			params: { context: 'edit' },
		} );
		return user.meta?.persisted_preferences?.[ 'core/edit-site' ]
			?.showStyleBook;
	}

	test( 'shows the Style Book by default and remembers when it is turned off', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await openStyles( admin, page );
		await expectStyleBook( page, true );

		await stylesPanel( page )
			.getByRole( 'button', { name: 'Typography', exact: true } )
			.click();
		await expectStyleBook( page, true );

		await styleBookButton( page ).click();
		await expectStyleBook( page, false );

		await stylesPanel( page )
			.getByRole( 'button', { name: 'Back', exact: true } )
			.click();
		await stylesPanel( page )
			.getByRole( 'button', { name: 'Colors', exact: true } )
			.click();
		await expectStyleBook( page, false );

		// The preference is saved in the background.
		await expect
			.poll( () => getSavedPreference( requestUtils ) )
			.toBe( false );

		await openStyles( admin, page );
		await expectStyleBook( page, false );

		await styleBookButton( page ).click();
		await expectStyleBook( page, true );
		await expect
			.poll( () => getSavedPreference( requestUtils ) )
			.toBe( true );
	} );

	test( 'keeps the site preview for Additional CSS', async ( {
		admin,
		page,
	} ) => {
		await openStyles( admin, page );
		await expectStyleBook( page, true );

		await stylesPanel( page )
			.getByRole( 'button', { name: 'More', exact: true } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Additional CSS' } ).click();
		await expect(
			stylesPanel( page ).getByRole( 'textbox', {
				name: 'Additional CSS',
				exact: true,
			} )
		).toBeVisible();
		await expectStyleBook( page, false );

		await stylesPanel( page )
			.getByRole( 'button', { name: 'Back', exact: true } )
			.click();
		await expectStyleBook( page, true );
	} );
} );
