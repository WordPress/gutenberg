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
			'style-variations'
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

	test( 'Should have three variations available with the first one being active', async ( {
		editor,
		siteEditorStyleVariations,
	} ) => {
		await editor.toggleGlobalStyles();
		await siteEditorStyleVariations.openOtherStyles();
		const variations = await siteEditorStyleVariations.getAvailableStyleVariations();
		expect( variations ).toHaveLength( 3 );
		expect(
			await (
				await variations[ 0 ].getProperty( 'className' )
			 ).jsonValue()
		).toContain( 'is-active' );
		expect(
			await (
				await variations[ 1 ].getProperty( 'className' )
			 ).jsonValue()
		).not.toContain( 'is-active' );
		expect(
			await (
				await variations[ 2 ].getProperty( 'className' )
			 ).jsonValue()
		).not.toContain( 'is-active' );
	} );
	test( 'Should apply preset colors and font sizes in a variation', async () => {} );
	test( 'Should apply custom colors and font sizes in a variation', async () => {} );
	test( 'Should apply a color palette in a variation', async () => {} );
	test( 'Should reflect style variations in the styles applied to the editor', async () => {} );
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
		const selector = 'css=.edit-site-global-styles-variations_item';
		await this.page.waitForSelector( selector );
		return this.page.locator( selector );
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
				XPathResult.ANY_TYPE,
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
		const paletteOptions = await this.page.locator(
			`xpath=//div[./*/h2[text()="${ paletteSource }"]]//button[contains(@class,"components-circular-option-picker__option")]`
		);
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
