/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	siteEditorStyleVariations: async (
		{ admin, editor, page, pageUtils, requestUtils },
		use
	) => {
		await use(
			new SiteEditorStyleVariations( {
				admin,
				editor,
				page,
				pageUtils,
				requestUtils,
			} )
		);
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
		} );
		await page.click( 'role=button[name="Styles"i]' );
		await siteEditorStyleVariations.openOtherStyles();

		const variations = page.locator(
			'.edit-site-global-styles-variations_item'
		);

		await expect( variations ).toHaveCount( 3 );

		// To avoid having to assert class names, https://github.com/WordPress/gutenberg/pull/41591
		// adds aria-label and aria-current attributes to the style variation buttons.
		// Once that PR is merged we can refactor this, e.g., await expect( variations.first() ).toHaveAttribute( 'aria-current', true );
		await expect( await variations.first() ).toHaveClass( /is\-active/ );
		await expect( await variations.nth( 1 ) ).not.toHaveClass(
			/is\-active/
		);
		await expect( await variations.nth( 2 ) ).not.toHaveClass(
			/is\-active/
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
		} );
		await siteEditorStyleVariations.applyPinkVariation();
		await siteEditorStyleVariations.openPreviousGlobalStylesPanel();

		await siteEditorStyleVariations.openColorsPanel();

		await expect(
			page.locator(
				'css=[aria-label="Colors background styles"] .component-color-indicator'
			)
		).toHaveCSS( 'background', /rgb\(202, 105, 211\)/ );

		await expect(
			page.locator(
				'css=[aria-label="Colors text styles"] .component-color-indicator'
			)
		).toHaveCSS( 'background', /rgb\(74, 7, 74\)/ );

		await siteEditorStyleVariations.openPreviousGlobalStylesPanel();
		await siteEditorStyleVariations.openTypographyPanel();
		await siteEditorStyleVariations.openTextPanel();

		expect( await siteEditorStyleVariations.getFontSizeHint() ).toBe(
			'Medium(px)'
		);
	} );

	test( 'should apply custom colors and font sizes in a variation', async ( {
		admin,
		page,
		siteEditorStyleVariations,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditorStyleVariations.applyYellowVariation();
		await siteEditorStyleVariations.openPreviousGlobalStylesPanel();
		await siteEditorStyleVariations.openColorsPanel();

		await expect(
			page.locator(
				'css=[aria-label="Colors background styles"] .component-color-indicator'
			)
		).toHaveCSS( 'background', /rgb\(255, 239, 11\)/ );

		await expect(
			page.locator(
				'css=[aria-label="Colors text styles"] .component-color-indicator'
			)
		).toHaveCSS( 'background', /rgb\(25, 25, 17\)/ );

		await siteEditorStyleVariations.openPreviousGlobalStylesPanel();
		await siteEditorStyleVariations.openTypographyPanel();
		await siteEditorStyleVariations.openTextPanel();

		expect( await siteEditorStyleVariations.getFontSizeHint() ).toBe(
			'(Custom)'
		);
		expect( await siteEditorStyleVariations.getCustomFontSizeValue() ).toBe(
			'15'
		);
	} );

	test( 'should apply a color palette in a variation', async ( {
		admin,
		page,
		siteEditorStyleVariations,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditorStyleVariations.applyPinkVariation();
		await siteEditorStyleVariations.openPreviousGlobalStylesPanel();
		await siteEditorStyleVariations.openColorsPanel();
		await page.click( `role=button[name="Color palettes"i]` );

		await expect(
			page.locator( 'role=button[name="Color: Foreground"i]' )
		).toHaveCSS( 'background', /rgb\(74, 7, 74\)/ );

		await expect(
			page.locator( 'role=button[name="Color: Background"i]' )
		).toHaveCSS( 'background', /rgb\(202, 105, 211\)/ );

		await expect(
			page.locator( 'role=button[name="Color: Awesome pink"i]' )
		).toHaveCSS( 'background', /rgba\(204, 0, 255, 0\.77\)/ );
	} );

	test( 'should reflect style variations in the styles applied to the editor', async ( {
		admin,
		page,
		siteEditorStyleVariations,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditorStyleVariations.applyYellowVariation();
		const frame = page.frameLocator(
			'css=.edit-site-visual-editor iframe'
		);
		const paragraph = frame.locator(
			'xpath=//p[text()="My awesome paragraph"]'
		);
		const paragraphColor = await paragraph.evaluate( ( el ) => {
			return window.getComputedStyle( el ).color;
		} );
		expect( paragraphColor ).toBe( 'rgb(25, 25, 17)' );
		const body = frame.locator( 'css=body' );
		const backgroundColor = await body.evaluate( ( el ) => {
			return window.getComputedStyle( el ).backgroundColor;
		} );
		expect( backgroundColor ).toBe( 'rgb(255, 239, 11)' );
	} );
} );

class SiteEditorStyleVariations {
	constructor( { admin, editor, page, pageUtils, requestUtils } ) {
		this.admin = admin;
		this.editor = editor;
		this.page = page;
		this.pageUtils = pageUtils;
		this.requestUtils = requestUtils;
	}

	async openOtherStyles() {
		await this.page
			.locator( 'role=button[name="Browse styles"i]' )
			.waitFor( { state: 'attached' } ); // Wait for the element to appear after the navigation animation.

		await this.page.click( 'role=button[name="Browse styles"i]' );
	}

	async applyVariation( label ) {
		await this.page.click( 'role=button[name="Styles"i]' );
		await this.openOtherStyles();
		await this.page.click( `role=button[name="${ label }"i]` );
	}

	async applyPinkVariation() {
		await this.applyVariation( 'pink' );
	}

	async applyYellowVariation() {
		await this.applyVariation( 'yellow' );
	}

	async openColorsPanel() {
		await this.openGlobalStylesPanel( 'Colors styles' );
	}

	async openTypographyPanel() {
		await this.openGlobalStylesPanel( 'Typography styles' );
	}

	async openTextPanel() {
		await this.openGlobalStylesPanel( 'Typography Text styles' );
	}

	async getFontSizeHint() {
		const element = this.page.locator(
			'css=.components-font-size-picker__header__hint'
		);
		return await element.evaluate( ( el ) => el.textContent );
	}

	async getCustomFontSizeValue() {
		const element = this.page.locator(
			'css=.components-font-size-picker input[aria-label="Custom"]'
		);
		return await element.evaluate( ( el ) => el.value );
	}

	async openPreviousGlobalStylesPanel() {
		await this.page.click(
			'role=button[name="Navigate to the previous view"i]'
		);
	}

	async openGlobalStylesPanel( panelName ) {
		await this.page.click( `role=button[name="${ panelName }"i]` );
	}
}
