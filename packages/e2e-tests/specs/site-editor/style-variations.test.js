/**
 * WordPress dependencies
 */
import {
	trashAllPosts,
	activateTheme,
	visitSiteEditor,
	toggleGlobalStyles,
	openGlobalStylesPanel,
	openPreviousGlobalStylesPanel,
} from '@wordpress/e2e-test-utils';

async function openOtherStyles() {
	const OTHER_STYLES_SELECTOR = '//div[contains(text(),"Other styles")]';
	await ( await page.waitForXPath( OTHER_STYLES_SELECTOR ) ).click();
}

async function getAvailableStyleVariations() {
	const VARIATION_ITEMS_STYLES_SELECTOR =
		'.edit-site-global-styles-variations_item';
	await page.waitForSelector( VARIATION_ITEMS_STYLES_SELECTOR );
	return page.$$( VARIATION_ITEMS_STYLES_SELECTOR );
}

async function applyVariation( number ) {
	await toggleGlobalStyles();
	await openOtherStyles();
	const variations = await getAvailableStyleVariations();
	await variations[ number ].click();
}

async function applyPinkVariation() {
	await applyVariation( 1 );
}

async function applyYellowVariation() {
	await applyVariation( 2 );
}

async function openColorsPanel() {
	await openGlobalStylesPanel( 'Colors' );
}

async function openTypographyPanel() {
	await openGlobalStylesPanel( 'Typography' );
}

async function openTextPanel() {
	await openGlobalStylesPanel( 'Text' );
}

async function openPalettePanel() {
	const selector = `//div[./h2[text()="Palette"]]//button`;
	await ( await page.waitForXPath( selector ) ).click();
}

async function getFontSizeHint() {
	const element = await page.$(
		'.components-font-size-picker__header__hint'
	);
	return element.evaluate( ( el ) => el.textContent );
}

async function getCustomFontSizeValue() {
	const element = await page.$(
		'.components-font-size-picker input[aria-label="Custom"]'
	);
	return element.evaluate( ( el ) => el.value );
}

async function getColorValue( colorType ) {
	return page.evaluate( ( _colorType ) => {
		return document.evaluate(
			`substring-before(substring-after(//div[contains(@class, "edit-site-global-styles-sidebar__panel")]//button[.//*[text()="${ _colorType }"]]//*[contains(@class,"component-color-indicator")]/@style, "background: "), ";")`,
			document,
			null,
			XPathResult.ANY_TYPE,
			null
		).stringValue;
	}, colorType );
}

async function getBackgroundColorValue() {
	return getColorValue( 'Background' );
}

async function getTextColorValue() {
	return getColorValue( 'Text' );
}

async function getColorPalette( paletteSource ) {
	const paletteOptions = await page.$x(
		`//div[./*/h2[text()="${ paletteSource }"]]//button[contains(@class,"components-circular-option-picker__option")]`
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

async function getThemePalette() {
	return getColorPalette( 'Theme' );
}

describe( 'Global styles variations', () => {
	beforeAll( async () => {
		await activateTheme( 'gutenberg-test-themes/style-variations' );
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
	} );
	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );
	} );
	beforeEach( async () => {
		await visitSiteEditor();
	} );

	it( 'Should have three variations available with the first one being active', async () => {
		await toggleGlobalStyles();
		await openOtherStyles();
		const variations = await getAvailableStyleVariations();
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

	it( 'Should apply preset colors and font sizes in a variation', async () => {
		await applyPinkVariation();
		await openPreviousGlobalStylesPanel();
		await openColorsPanel();
		expect( await getBackgroundColorValue() ).toBe( 'rgb(202, 105, 211)' );
		expect( await getTextColorValue() ).toBe( 'rgb(74, 7, 74)' );
		await openPreviousGlobalStylesPanel();
		await openTypographyPanel();
		await openTextPanel();
		expect( await getFontSizeHint() ).toBe( 'Medium(px)' );
	} );

	it( 'Should apply custom colors and font sizes in a variation', async () => {
		await applyYellowVariation();
		await openPreviousGlobalStylesPanel();
		await openColorsPanel();
		expect( await getBackgroundColorValue() ).toBe( 'rgb(255, 239, 11)' );
		expect( await getTextColorValue() ).toBe( 'rgb(25, 25, 17)' );
		await openPreviousGlobalStylesPanel();
		await openTypographyPanel();
		await openTextPanel();
		expect( await getFontSizeHint() ).toBe( '(Custom)' );
		expect( await getCustomFontSizeValue() ).toBe( '15' );
	} );

	it( 'Should apply a color palette in a variation', async () => {
		await applyPinkVariation();
		await openPreviousGlobalStylesPanel();
		await openColorsPanel();
		await openPalettePanel();
		expect( await getThemePalette() ).toMatchObject( [
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

	it( 'Should reflect style variations in the styles applied to the editor', async () => {
		await applyYellowVariation();
		const frame = await (
			await page.waitForSelector( '.edit-site-visual-editor iframe' )
		 ).contentFrame();
		const paragraph = await frame.waitForXPath(
			`//p[text()="My awesome paragraph"]`
		);
		const paragraphColor = await paragraph.evaluate( ( el ) => {
			return window.getComputedStyle( el ).color;
		} );
		expect( paragraphColor ).toBe( 'rgb(25, 25, 17)' );
		const body = await frame.$( 'body' );
		const backgroundColor = await body.evaluate( ( el ) => {
			return window.getComputedStyle( el ).backgroundColor;
		} );
		expect( backgroundColor ).toBe( 'rgb(255, 239, 11)' );
	} );
} );
