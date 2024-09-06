/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	siteEditorStyleVariations: async ( { page }, use ) => {
		await use( new SiteEditorStyleVariations( { page } ) );
	},
} );

test.describe( 'Global styles variations', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme(
			'gutenberg-test-themes/style-variations'
		);
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'should have three variations available with the first one being active', async ( {
		admin,
		page,
		siteEditorStyleVariations,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		await siteEditorStyleVariations.browseStyles();

		// TODO: instead of locating these elements by class,
		//  we could update the source code to group them in a <section> or other container,
		//  then add `aria-labelledby` and `aria-describedby` etc to provide accessible information,
		const variations = page.locator(
			'.edit-site-global-styles-variations_item'
		);

		await expect( variations ).toHaveCount( 3 );

		await expect( variations.first() ).toHaveAttribute(
			'aria-current',
			'true'
		);
		await expect( variations.nth( 1 ) ).toHaveAttribute(
			'aria-current',
			'false'
		);
		await expect( variations.nth( 2 ) ).toHaveAttribute(
			'aria-current',
			'false'
		);
	} );

	test( 'should apply preset colors and font sizes in a variation', async ( {
		admin,
		page,
		siteEditorStyleVariations,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await siteEditorStyleVariations.browseStyles();
		await page.click( 'role=button[name="pink"i]' );
		await page.click( 'role=button[name="Back"i]' );
		await page.click( 'role=button[name="Colors"i]' );

		await expect(
			page.locator(
				'role=button[name="Background"i] >> .component-color-indicator'
			)
		).toHaveCSS( 'background', /rgb\(202, 105, 211\)/ );

		await expect(
			page.locator(
				'role=button[name="Text"i] >> .component-color-indicator'
			)
		).toHaveCSS( 'background', /rgb\(74, 7, 74\)/ );

		await page.click( 'role=button[name="Back"i]' );
		await page.click( 'role=button[name="Typography"i]' );
		await page.click( 'role=button[name="Text"i]' );

		await expect(
			page.locator( 'css=.components-font-size-picker__header__hint' )
		).toHaveText( 'Medium' );
	} );

	test( 'should apply custom colors and font sizes in a variation', async ( {
		admin,
		page,
		siteEditorStyleVariations,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await siteEditorStyleVariations.browseStyles();
		await page.click( 'role=button[name="yellow"i]' );
		await page.click( 'role=button[name="Back"i]' );
		await page.click( 'role=button[name="Colors"i]' );

		await expect(
			page.locator(
				'role=button[name="Background"i] >> .component-color-indicator'
			)
		).toHaveCSS( 'background', /rgb\(255, 239, 11\)/ );

		await expect(
			page.locator(
				'role=button[name="Text"i] >> .component-color-indicator'
			)
		).toHaveCSS( 'background', /rgb\(25, 25, 17\)/ );

		await page.click( 'role=button[name="Back"i]' );
		await page.click( 'role=button[name="Typography"i]' );
		await page.click( 'role=button[name="Text"i]' );

		// TODO: to avoid use classnames to locate these elements,
		//  we could provide accessible attributes to the source code in packages/components/src/font-size-picker/index.js.
		await expect(
			page.locator( 'css=.components-font-size-picker__header__hint' )
		).toHaveText( 'Custom' );

		await expect(
			page.locator( 'role=spinbutton[name="Custom"i]' )
		).toHaveValue( '15' );
	} );

	test( 'should apply a color palette in a variation', async ( {
		admin,
		page,
		siteEditorStyleVariations,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await siteEditorStyleVariations.browseStyles();
		await page.click( 'role=button[name="pink"i]' );
		await page.click( 'role=button[name="Back"i]' );
		await page.click( 'role=button[name="Colors"i]' );
		await page.click( 'role=button[name="Edit palette"i]' );

		await expect(
			page.locator( 'role=option[name="Color: Foreground"i]' )
		).toHaveCSS( 'background-color', 'rgb(74, 7, 74)' );

		await expect(
			page.locator( 'role=option[name="Color: Background"i]' )
		).toHaveCSS( 'background-color', 'rgb(202, 105, 211)' );

		await expect(
			page.locator( 'role=option[name="Color: Awesome pink"i]' )
		).toHaveCSS( 'background-color', 'rgba(204, 0, 255, 0.77)' );
	} );

	test( 'should reflect style variations in the styles applied to the editor', async ( {
		admin,
		page,
		siteEditorStyleVariations,
		editor,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await siteEditorStyleVariations.browseStyles();
		await page.click( 'role=button[name="yellow"i]' );

		const paragraph = editor.canvas.locator(
			'text="My awesome paragraph"'
		);
		await expect( paragraph ).toHaveCSS( 'color', 'rgb(25, 25, 17)' );

		const body = editor.canvas.locator( 'css=body' );
		await expect( body ).toHaveCSS(
			'background-color',
			'rgb(255, 239, 11)'
		);
	} );
} );

class SiteEditorStyleVariations {
	constructor( { page } ) {
		this.page = page;
	}

	async browseStyles() {
		await this.page.click( 'role=button[name="Styles"i]' );
		await this.page.click( 'role=button[name="Browse styles"i]' );
	}
}
