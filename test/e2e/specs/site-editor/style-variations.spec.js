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
		await requestUtils.activateTheme( 'style-variations' );
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
		editor,
		siteEditorStyleVariations,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'style-variations//index',
			postType: 'wp_template',
		} );
		await editor.toggleGlobalStyles();
		await siteEditorStyleVariations.openOtherStyles();

		const variations = await siteEditorStyleVariations.getAvailableStyleVariations();

		expect( await variations.count() ).toEqual( 3 );
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
		editor,
		siteEditorStyleVariations,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditorStyleVariations.applyPinkVariation();
		await editor.openPreviousGlobalStylesPanel();

		await siteEditorStyleVariations.openColorsPanel();
		expect(
			await siteEditorStyleVariations.getBackgroundColorValue()
		).toBe( 'rgb(202, 105, 211)' );
		expect( await siteEditorStyleVariations.getTextColorValue() ).toBe(
			'rgb(74, 7, 74)'
		);

		await editor.openPreviousGlobalStylesPanel();
		await siteEditorStyleVariations.openTypographyPanel();
		await siteEditorStyleVariations.openTextPanel();

		expect( await siteEditorStyleVariations.getFontSizeHint() ).toBe(
			'Medium(px)'
		);
	} );

	test( 'should apply custom colors and font sizes in a variation', async ( {
		admin,
		editor,
		siteEditorStyleVariations,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditorStyleVariations.applyYellowVariation();
		await editor.openPreviousGlobalStylesPanel();
		await siteEditorStyleVariations.openColorsPanel();

		expect(
			await siteEditorStyleVariations.getBackgroundColorValue()
		).toBe( 'rgb(255, 239, 11)' );
		expect( await siteEditorStyleVariations.getTextColorValue() ).toBe(
			'rgb(25, 25, 17)'
		);

		await editor.openPreviousGlobalStylesPanel();
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
		editor,
		siteEditorStyleVariations,
	} ) => {
		await admin.visitSiteEditor( {
			postId: 'style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditorStyleVariations.applyPinkVariation();
		await editor.openPreviousGlobalStylesPanel();
		await siteEditorStyleVariations.openColorsPanel();
		await siteEditorStyleVariations.openPalettePanel();

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
			postId: 'style-variations//index',
			postType: 'wp_template',
		} );
		await siteEditorStyleVariations.applyYellowVariation();
		const frame = await page.frameLocator(
			'css=.edit-site-visual-editor iframe'
		);
		const paragraph = await frame.locator(
			'xpath=//p[text()="My awesome paragraph"]'
		);
		const paragraphColor = await paragraph.evaluate( ( el ) => {
			return window.getComputedStyle( el ).color;
		} );
		expect( paragraphColor ).toBe( 'rgb(25, 25, 17)' );
		const body = await frame.locator( 'css=body' );
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
		const selector = 'xpath=//div[contains(text(),"Browse styles")]';
		await ( await this.page.locator( selector ) ).click();
	}

	async getAvailableStyleVariations() {
		return await this.page.locator(
			'.edit-site-global-styles-variations_item'
		);
	}

	async applyVariation( label ) {
		await this.editor.toggleGlobalStyles();
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
		await this.editor.openGlobalStylesPanel( 'Colors' );
	}

	async openTypographyPanel() {
		await this.editor.openGlobalStylesPanel( 'Typography' );
	}

	async openTextPanel() {
		await this.editor.openGlobalStylesPanel( 'Text' );
	}

	async openPalettePanel() {
		const selector = `xpath=//div[./h2[text()="Palette"]]//button`;
		await ( await this.page.locator( selector ) ).click();
	}

	async getFontSizeHint() {
		const element = await this.page.locator(
			'css=.components-font-size-picker__header__hint'
		);
		return element.evaluate( ( el ) => el.textContent );
	}

	async getCustomFontSizeValue() {
		const element = await this.page.locator(
			'css=.components-font-size-picker input[aria-label="Custom"]'
		);
		return element.evaluate( ( el ) => el.value );
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
}
