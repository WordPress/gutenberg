import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { gotoStoryId } from '../utils';

/**
 * In forced colors mode, pressed and selected states should be filled with
 * `Highlight` / `HighlightText`, which follow the active palette. Chromium
 * resolves `SelectedItem` / `SelectedItemText` to fixed colors instead.
 *
 * @see https://github.com/WordPress/gutenberg/issues/86851
 *
 * @param element Element painting the fill and holding the text.
 */
async function expectHighlightColors( element: Locator ) {
	const {
		backgroundColor,
		color,
		forcedColorAdjust,
		highlight,
		highlightText,
	} = await element.evaluate( ( el ) => {
		const probe = el.ownerDocument.createElement( 'div' );
		probe.style.cssText =
			'background-color: Highlight; color: HighlightText; forced-color-adjust: none;';
		el.ownerDocument.body.append( probe );
		const probeStyle = window.getComputedStyle( probe );
		const style = window.getComputedStyle( el );
		const result = {
			backgroundColor: style.backgroundColor,
			color: style.color,
			forcedColorAdjust: style.forcedColorAdjust,
			highlight: probeStyle.backgroundColor,
			highlightText: probeStyle.color,
		};
		probe.remove();
		return result;
	} );

	expect.soft( backgroundColor, 'background is Highlight' ).toBe( highlight );
	expect.soft( color, 'text is HighlightText' ).toBe( highlightText );
	// Without opting out, Chromium paints a Canvas backplate behind the text.
	expect.soft( forcedColorAdjust, 'text has no backplate' ).toBe( 'none' );
}

for ( const colorScheme of [ 'light', 'dark' ] as const ) {
	test.describe( `Forced colors selected state (${ colorScheme })`, () => {
		test.beforeEach( async ( { page } ) => {
			await page.emulateMedia( { forcedColors: 'active', colorScheme } );
		} );

		test( 'pressed minimal Button', async ( { page } ) => {
			await gotoStoryId(
				page,
				'design-system-components-button--variant-states'
			);
			// Columns are solid, outline, minimal, unstyled.
			const button = page
				.locator( 'tr', {
					has: page.locator( 'th', { hasText: /^pressed$/ } ),
				} )
				.getByRole( 'button' )
				.nth( 2 );
			await expect( button ).toBeVisible();

			await expectHighlightColors( button );
		} );

		test( 'focused Combobox chip', async ( { page } ) => {
			await gotoStoryId(
				page,
				'design-system-components-form-primitives-searchablechipselect--with-chips'
			);
			await page.getByRole( 'combobox' ).first().focus();
			// Moves focus from the input to the last chip.
			await page.keyboard.press( 'ArrowLeft' );
			const chip = page.locator( ':focus' );
			await expect( chip ).not.toHaveRole( 'combobox' );

			await expectHighlightColors( chip );
		} );
	} );
}
