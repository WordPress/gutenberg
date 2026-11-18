import type { Locator } from '@playwright/test';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * In forced colors mode, pressed and selected states should be filled with
 * `Highlight` / `HighlightText`, which follow the active palette. Chromium
 * resolves `SelectedItem` / `SelectedItemText` to fixed colors instead.
 *
 * @see https://github.com/WordPress/gutenberg/issues/86851
 *
 * @param background Element painting the fill.
 * @param text       Element holding the text.
 * @param pseudo     Pseudo-element painting the fill.
 */
async function expectHighlightColors(
	background: Locator,
	text: Locator,
	pseudo?: string
) {
	const { highlight, highlightText } = await text.evaluate( ( el ) => {
		// Resolve the palette's system colors in the element's own document,
		// which may be the editor canvas iframe.
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

	// Poll and `toHaveCSS` retry, so color transitions can finish.
	await expect
		.poll(
			() =>
				background.evaluate(
					( el, pseudoElement ) =>
						window.getComputedStyle( el, pseudoElement )
							.backgroundColor,
					pseudo ?? null
				),
			{ message: 'background is Highlight' }
		)
		.toBe( highlight );
	await expect
		.soft( text, 'text is HighlightText' )
		.toHaveCSS( 'color', highlightText );
	// Without opting out, Chromium paints a Canvas backplate behind the text.
	await expect
		.soft( text, 'text has no backplate' )
		.toHaveCSS( 'forced-color-adjust', 'none' );
}

for ( const colorScheme of [ 'light', 'dark' ] as const ) {
	test.describe( `Forced colors selected state (${ colorScheme })`, () => {
		test.beforeEach( async ( { admin, page } ) => {
			await page.emulateMedia( { forcedColors: 'active', colorScheme } );
			await admin.createNewPost();
		} );

		test( 'pressed Document Overview button', async ( { page } ) => {
			const toggle = page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Document Overview' } );
			await toggle.click();
			await expect( toggle ).toHaveClass( /is-pressed/ );

			await expectHighlightColors( toggle, toggle );
		} );

		test( 'selected List View row', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Hello' },
			} );
			await pageUtils.pressKeys( 'access+o' );

			const row = page
				.getByRole( 'treegrid', { name: 'Block navigation structure' } )
				.locator( 'tr.is-selected' );
			await expect( row ).toBeVisible();

			await expectHighlightColors(
				row.locator( 'td' ).first(),
				row.locator(
					'.block-editor-list-view-block-select-button__title'
				)
			);
		} );

		test( 'pressed block toolbar button', async ( { editor, page } ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: '<strong>Hello</strong>' },
			} );
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.getByText( 'Hello' )
				.click();

			const bold = page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Bold' } );
			await expect( bold ).toHaveAttribute( 'aria-pressed', 'true' );

			// The toolbar paints the pressed fill on the `::before`.
			await expectHighlightColors( bold, bold, '::before' );
		} );

		test( 'active block style', async ( { editor, page } ) => {
			await editor.insertBlock( {
				name: 'core/buttons',
				innerBlocks: [
					{ name: 'core/button', attributes: { text: 'Click' } },
				],
			} );
			await editor.canvas
				.getByRole( 'textbox', { name: 'Button text' } )
				.click();
			await editor.openDocumentSettingsSidebar();

			const activeStyle = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'radiogroup', { name: 'Styles' } )
				.getByRole( 'radio', { checked: true } );
			await expect( activeStyle ).toHaveText( 'Fill' );

			await expectHighlightColors( activeStyle, activeStyle );
		} );
	} );
}
