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
 * @param element Element painting the fill.
 * @param text    Elements holding the text, if not the element itself.
 */
async function expectHighlightColors(
	element: Locator,
	text: Locator[] = [ element ]
) {
	const { highlight, highlightText } = await element.evaluate( ( el ) => {
		const probe = el.ownerDocument.createElement( 'div' );
		probe.style.cssText =
			'background-color: Highlight; color: HighlightText; forced-color-adjust: none;';
		el.ownerDocument.body.append( probe );
		const style = window.getComputedStyle( probe );
		const result = {
			highlight: style.backgroundColor,
			highlightText: style.color,
		};
		probe.remove();
		return result;
	} );

	// `toHaveCSS` retries, so color transitions can finish.
	await expect
		.soft( element, 'background is Highlight' )
		.toHaveCSS( 'background-color', highlight );

	for ( const locator of text ) {
		await expect
			.soft( locator, 'text is HighlightText' )
			.toHaveCSS( 'color', highlightText );
		// Without opting out, Chromium paints a Canvas backplate behind the text.
		await expect
			.soft( locator, 'text has no backplate' )
			.toHaveCSS( 'forced-color-adjust', 'none' );
	}
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

			const labelId = await chip.getAttribute( 'aria-labelledby' );
			await expectHighlightColors( chip, [
				page.locator( `[id="${ labelId }"]` ),
				chip.getByRole( 'button' ),
			] );
			// Only the label and the remove button opt out, so the chip keeps its forced border.
			await expect( chip ).toHaveCSS( 'forced-color-adjust', 'auto' );
		} );
	} );
}
