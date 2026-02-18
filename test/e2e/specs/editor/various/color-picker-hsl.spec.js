/**
 * WordPress dependencies
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'ColorPicker HSL inputs', () => {
	test.beforeEach( async ( { admin, editor, page } ) => {
		await admin.createNewPost();

		// Insert a paragraph block and open the text color picker in HSL mode.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Test paragraph' },
		} );

		await editor.openDocumentSettingsSidebar();

		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Text' } )
			.click();

		await page
			.getByRole( 'button', { name: 'Custom color picker' } )
			.click();

		// Switch to HSL mode.
		await page
			.getByRole( 'combobox', { name: 'Color format' } )
			.selectOption( 'hsl' );
	} );

	test( 'should preserve hue and saturation when lightness is set to white', async ( {
		page,
	} ) => {
		const hueSlider = page.getByRole( 'slider', { name: 'Hue' } ).last();
		const saturationSlider = page.getByRole( 'slider', {
			name: 'Saturation',
		} );
		const lightnessSlider = page.getByRole( 'slider', {
			name: 'Lightness',
		} );

		// Set an initial chromatic color: hsl(180, 50%, 50%).
		await hueSlider.fill( '180' );
		await saturationSlider.fill( '50' );
		await lightnessSlider.fill( '50' );

		await expect( hueSlider ).toHaveValue( '180' );
		await expect( saturationSlider ).toHaveValue( '50' );

		// Set lightness to 100 (white) — hue and saturation should be preserved.
		await lightnessSlider.fill( '100' );

		await expect( hueSlider ).toHaveValue( '180' );
		await expect( saturationSlider ).toHaveValue( '50' );
		await expect( lightnessSlider ).toHaveValue( '100' );

		// Restore lightness — the original color should return.
		await lightnessSlider.fill( '50' );

		await expect( hueSlider ).toHaveValue( '180' );
		await expect( saturationSlider ).toHaveValue( '50' );
	} );

	test( 'should preserve hue and saturation when lightness is set to black', async ( {
		page,
	} ) => {
		const hueSlider = page.getByRole( 'slider', { name: 'Hue' } ).last();
		const saturationSlider = page.getByRole( 'slider', {
			name: 'Saturation',
		} );
		const lightnessSlider = page.getByRole( 'slider', {
			name: 'Lightness',
		} );

		// Set an initial chromatic color: hsl(270, 80%, 60%).
		await hueSlider.fill( '270' );
		await saturationSlider.fill( '80' );
		await lightnessSlider.fill( '60' );

		await expect( hueSlider ).toHaveValue( '270' );
		await expect( saturationSlider ).toHaveValue( '80' );

		// Set lightness to 0 (black) — hue and saturation should be preserved.
		await lightnessSlider.fill( '0' );

		await expect( hueSlider ).toHaveValue( '270' );
		await expect( saturationSlider ).toHaveValue( '80' );
		await expect( lightnessSlider ).toHaveValue( '0' );

		// Restore lightness — the original color should return.
		await lightnessSlider.fill( '60' );

		await expect( hueSlider ).toHaveValue( '270' );
		await expect( saturationSlider ).toHaveValue( '80' );
	} );

	test( 'should preserve hue and saturation across multiple achromatic round-trips', async ( {
		page,
	} ) => {
		const hueSlider = page.getByRole( 'slider', { name: 'Hue' } ).last();
		const saturationSlider = page.getByRole( 'slider', {
			name: 'Saturation',
		} );
		const lightnessSlider = page.getByRole( 'slider', {
			name: 'Lightness',
		} );

		// Start with hsl(30, 90%, 50%).
		await hueSlider.fill( '30' );
		await saturationSlider.fill( '90' );
		await lightnessSlider.fill( '50' );

		// Round-trip through white.
		await lightnessSlider.fill( '100' );
		await expect( hueSlider ).toHaveValue( '30' );
		await expect( saturationSlider ).toHaveValue( '90' );

		// Back to chromatic.
		await lightnessSlider.fill( '50' );
		await expect( hueSlider ).toHaveValue( '30' );
		await expect( saturationSlider ).toHaveValue( '90' );

		// Round-trip through black.
		await lightnessSlider.fill( '0' );
		await expect( hueSlider ).toHaveValue( '30' );
		await expect( saturationSlider ).toHaveValue( '90' );

		// Back to chromatic — values should still be intact.
		await lightnessSlider.fill( '50' );
		await expect( hueSlider ).toHaveValue( '30' );
		await expect( saturationSlider ).toHaveValue( '90' );
	} );
} );
