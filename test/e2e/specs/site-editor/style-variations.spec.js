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

		const variations = await siteEditorStyleVariations.getAvailableStyleVariations();

		await expect( variations ).toHaveCount( 3 );
		expect( await variations.first().getAttribute( 'class' ) ).toContain(
			'is-active'
		);
		expect(
			await variations.nth( 1 ).getAttribute( 'class' )
		).not.toContain( 'is-active' );
		expect(
			await variations.nth( 2 ).getAttribute( 'class' )
		).not.toContain( 'is-active' );
	} );

	test( 'should apply preset colors and font sizes in a variation', async ( {
		admin,
		siteEditorStyleVariations,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'gutenberg-test-themes/style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditorStyleVariations.applyPinkVariation();
		await siteEditorStyleVariations.openPreviousGlobalStylesPanel();

		await siteEditorStyleVariations.openColorsPanel();
		expect(
			await siteEditorStyleVariations.getBackgroundColorValue()
		).toBe( 'rgb(202, 105, 211)' );
		expect( await siteEditorStyleVariations.getTextColorValue() ).toBe(
			'rgb(74, 7, 74)'
		);

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

		expect(
			await siteEditorStyleVariations.getThemePalette()
		).toMatchObject( [
			{
				color: 'rgb(74, 7, 74)',
				name: 'Foreground',
			},
			{
				color: 'rgb(202, 105, 211)',
				name: 'Background',
			},
			{
				color: 'rgba(204, 0, 255, 0.77)',
				name: 'Awesome pink',
			},
		] );
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
			.waitFor(); // Wait for the element to appear after the navigation animation.

		await this.page.click( 'role=button[name="Browse styles"i]' );
	}

	async getAvailableStyleVariations() {
		return await this.page.locator(
			'.edit-site-global-styles-variations_item'
		);
	}

	async applyVariation( label ) {
		await this.page.click( 'role=button[name="Styles"i]' );
		await this.openOtherStyles();
		const variation = await this.page.locator(
			`xpath=//*[@role="button"][@aria-label="${ label }"]`
		);
		await variation.click();
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

	async getColorValue( colorType ) {
		return this.page.evaluate( ( _colorType ) => {
			return document.evaluate(
				`substring-before(substring-after(//div[contains(@class, "edit-site-global-styles-sidebar__panel")]//button[.//*[text()="${ _colorType }"]]//*[contains(@class,"component-color-indicator")]/@style, "background: "), ";")`,
				document,
				null,
				window.XPathResult.ANY_TYPE,
				null
			).stringValue;
		}, colorType );
	}

	async getBackgroundColorValue() {
		return this.getColorValue( 'Background' );
	}

	async getTextColorValue() {
		return this.getColorValue( 'Text' );
	}

	async getColorPalette( paletteSource ) {
		const paletteOptions = await this.page
			.locator(
				`xpath=//div[./*/h2[text()="${ paletteSource }"]]//button[contains(@class,"components-circular-option-picker__option")]`
			)
			.elementHandles();
		return Promise.all(
			paletteOptions.map( ( element ) => {
				return element.evaluate( ( el ) => {
					const color = el.style.backgroundColor;
					const name = el
						.getAttribute( 'aria-label' )
						.substring( 'Color: '.length );
					return { color, name };
				} );
			} )
		);
	}
	async getThemePalette() {
		return this.getColorPalette( 'Theme' );
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
