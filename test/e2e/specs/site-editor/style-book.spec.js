/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	styleBook: async ( { page }, use ) => {
		await use( new StyleBook( { page } ) );
	},
} );

test.describe( 'Style Book', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin, editor, styleBook, page } ) => {
		await admin.visitSiteEditor();
		await editor.canvas.locator( 'body' ).click();
		await styleBook.open();
		await expect(
			page.locator( 'role=region[name="Style Book"i]' )
		).toBeVisible();
	} );

	test( 'should disable toolbar buttons when open', async ( { page } ) => {
		await expect(
			page.locator( 'role=button[name="Toggle block inserter"i]' )
		).toBeHidden();
		await expect(
			page.locator( 'role=button[name="Tools"i]' )
		).toBeHidden();
		await expect(
			page.locator( 'role=button[name="Undo"i]' )
		).toBeHidden();
		await expect(
			page.locator( 'role=button[name="Redo"i]' )
		).toBeHidden();
		await expect(
			page.locator( 'role=button[name="View"i]' )
		).toBeDisabled();
	} );

	test( 'should have tabs containing block examples', async ( { page } ) => {
		await expect( page.locator( 'role=tab[name="Text"i]' ) ).toBeVisible();
		await expect( page.locator( 'role=tab[name="Media"i]' ) ).toBeVisible();
		await expect(
			page.locator( 'role=tab[name="Design"i]' )
		).toBeVisible();
		await expect(
			page.locator( 'role=tab[name="Widgets"i]' )
		).toBeVisible();
		await expect( page.locator( 'role=tab[name="Theme"i]' ) ).toBeVisible();

		// Buttons to select block examples are rendered within the Style Book iframe.
		const styleBookIframe = page.frameLocator(
			'[name="style-book-canvas"]'
		);

		await expect(
			styleBookIframe.getByRole( 'button', {
				name: 'Open Headings styles in Styles panel',
			} )
		).toBeVisible();
		await expect(
			styleBookIframe.getByRole( 'button', {
				name: 'Open Paragraph styles in Styles panel',
			} )
		).toBeVisible();

		await page.click( 'role=tab[name="Media"i]' );

		await expect(
			styleBookIframe.getByRole( 'button', {
				name: 'Open Image styles in Styles panel',
			} )
		).toBeVisible();
		await expect(
			styleBookIframe.getByRole( 'button', {
				name: 'Open Gallery styles in Styles panel',
			} )
		).toBeVisible();
	} );

	test( 'should open correct Global Styles panel when example is clicked', async ( {
		page,
	} ) => {
		await page
			.frameLocator( '[name="style-book-canvas"]' )
			.getByRole( 'button', {
				name: 'Open Headings styles in Styles panel',
			} )
			.click();

		await expect(
			page.locator(
				'role=region[name="Editor settings"i] >> role=heading[name="Heading"i]'
			)
		).toBeVisible();
	} );

	test( 'should allow to return Global Styles root when example is clicked', async ( {
		page,
	} ) => {
		await page.click( 'role=button[name="Blocks styles"]' );
		await page.click( 'role=button[name="Heading block styles"]' );

		await page
			.frameLocator( '[name="style-book-canvas"]' )
			.getByRole( 'button', {
				name: 'Open Quote styles in Styles panel',
			} )
			.click();

		await page.click( 'role=button[name="Back"]' );
		await page.click( 'role=button[name="Back"]' );

		await expect(
			page.locator( 'role=button[name="Blocks styles"]' )
		).toBeVisible();
	} );

	test( 'should disappear when closed via click event or Escape key', async ( {
		page,
	} ) => {
		const styleBookRegion = page.getByRole( 'region', {
			name: 'Style Book',
		} );

		// Close Style Book via click event.
		await styleBookRegion.getByRole( 'button', { name: 'Close' } ).click();

		await expect(
			styleBookRegion,
			'should close when close button is clicked'
		).toBeHidden();

		// Open Style Book again.
		await page.getByRole( 'button', { name: 'Style Book' } ).click();
		await expect(
			styleBookRegion,
			'style book should be visible'
		).toBeVisible();

		// Close Style Book via Escape key.
		await page.keyboard.press( 'Escape' );
		await expect(
			styleBookRegion,
			'should close when Escape key is pressed'
		).toBeHidden();
	} );

	test( 'should persist when navigating the global styles sidebar', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Browse styles' } )
			.click();

		const styleBookRegion = page.getByRole( 'region', {
			name: 'Style Book',
		} );
		await expect(
			styleBookRegion,
			'style book should be visible'
		).toBeVisible();

		await page.click( 'role=button[name="Back"]' );

		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Typography' } )
			.click();

		await expect(
			styleBookRegion,
			'style book should be visible'
		).toBeVisible();
	} );
} );

class StyleBook {
	constructor( { page } ) {
		this.page = page;
	}

	async open() {
		await this.page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();
		await this.page.getByRole( 'button', { name: 'Style Book' } ).click();
	}
}
