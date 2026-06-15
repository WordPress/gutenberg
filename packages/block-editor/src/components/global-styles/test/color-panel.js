/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { click, render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import ColorPanel from '../color-panel';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

// Two palette entries that share the same decoded hex value (#000) but carry
// distinct slugs. This mirrors the duplicate-color scenario that motivated
// the slug-based selection work.
const DUPLICATE_PALETTE_SETTINGS = {
	color: {
		text: true,
		link: false, // keep the panel simple so button queries are unambiguous
		background: false,
		custom: false,
		customGradient: false,
		defaultPalette: false,
		palette: {
			theme: [
				{
					color: '#000',
					name: 'Dark Background',
					slug: 'dark-background',
				},
				{ color: '#000', name: 'Dark Text', slug: 'dark-text' },
			],
		},
	},
};

// ---------------------------------------------------------------------------
// ColorPanel — setTextColor behaviour (render tests)
// ---------------------------------------------------------------------------

describe( 'ColorPanel — setTextColor', () => {
	// Helper: open the Text-color dropdown and return the rendered swatches.
	async function openTextDropdown() {
		await click(
			screen.getByRole( 'button', { name: /Text/, expanded: false } )
		);
		// `findAllByRole` waits for the Popover/portal content to appear.
		return screen.findAllByRole( 'option' );
	}

	it( 'encodes a slug-selected color as var:preset|color|<slug> rather than falling back to a hex-value lookup', async () => {
		const onChange = jest.fn();

		await render(
			<ColorPanel
				value={ {} }
				inheritedValue={ {} }
				settings={ DUPLICATE_PALETTE_SETTINGS }
				panelId="test"
				onChange={ onChange }
			/>
		);

		const swatches = await openTextDropdown();
		// swatch[0] = 'dark-background', swatch[1] = 'dark-text'
		await click( swatches[ 1 ] );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		const result = onChange.mock.calls[ 0 ][ 0 ];
		// The slug must be encoded directly: not looked up by hex value.
		expect( result?.color?.text ).toBe( 'var:preset|color|dark-text' );
	} );

	it( 'syncs the link color when text and link share the same raw preset reference', async () => {
		const onChange = jest.fn();
		const sharedRef = 'var:preset|color|dark-background';

		await render(
			<ColorPanel
				value={ {} }
				inheritedValue={ {
					color: { text: sharedRef },
					elements: { link: { color: { text: sharedRef } } },
				} }
				settings={ DUPLICATE_PALETTE_SETTINGS }
				panelId="test"
				onChange={ onChange }
			/>
		);

		const swatches = await openTextDropdown();
		await click( swatches[ 1 ] );

		const result = onChange.mock.calls[ 0 ][ 0 ];
		expect( result?.color?.text ).toBe( 'var:preset|color|dark-text' );
		// Link must be kept in sync because text and link shared the same ref.
		expect( result?.elements?.link?.color?.text ).toBe(
			'var:preset|color|dark-text'
		);
	} );

	it( 'does NOT sync the link color when text and link have different raw refs, even if their decoded hex values match', async () => {
		const onChange = jest.fn();

		await render(
			<ColorPanel
				value={ {} }
				inheritedValue={ {
					// Both resolve to #000, but they are different preset references.
					color: { text: 'var:preset|color|dark-background' },
					elements: {
						link: {
							color: { text: 'var:preset|color|dark-text' },
						},
					},
				} }
				settings={ DUPLICATE_PALETTE_SETTINGS }
				panelId="test"
				onChange={ onChange }
			/>
		);

		const swatches = await openTextDropdown();
		await click( swatches[ 1 ] );

		const result = onChange.mock.calls[ 0 ][ 0 ];
		expect( result?.color?.text ).toBe( 'var:preset|color|dark-text' );
		// Link must NOT be updated: raw-ref identity is what matters,
		// not decoded-value equality.
		expect( result?.elements?.link?.color?.text ).toBeUndefined();
	} );
} );
