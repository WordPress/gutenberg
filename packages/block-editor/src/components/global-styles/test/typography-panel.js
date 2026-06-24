/**
 * External dependencies
 */
import { renderHook, screen } from '@testing-library/react';
import { click, render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import TypographyPanel, { useHasTypographyPanel } from '../typography-panel';

const settingsWithColors = ( overrides = {} ) => ( {
	color: {
		palette: {
			theme: [ { slug: 'red', color: '#ff0000', name: 'Red' } ],
		},
		...overrides,
	},
} );

describe( 'useHasTypographyPanel', () => {
	// After moving top-level text color into TypographyPanel, text color
	// alone should be enough to open the panel.
	it( 'should be true when only text color is enabled', () => {
		const { result } = renderHook( () =>
			useHasTypographyPanel( settingsWithColors( { text: true } ) )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'should be true when only font family is enabled', () => {
		const { result } = renderHook( () =>
			useHasTypographyPanel( {
				typography: {
					fontFamilies: {
						theme: [ { slug: 'sans', fontFamily: 'sans-serif' } ],
					},
				},
			} )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'should be true when only line height is enabled', () => {
		const { result } = renderHook( () =>
			useHasTypographyPanel( { typography: { lineHeight: true } } )
		);
		expect( result.current ).toBeTruthy();
	} );

	it( 'should be false when no typography or text color controls are enabled', () => {
		const { result } = renderHook( () => useHasTypographyPanel( {} ) );
		expect( result.current ).toBeFalsy();
	} );

	it( 'should be false when text color is enabled but no colors or custom support exist', () => {
		const { result } = renderHook( () =>
			useHasTypographyPanel( { color: { text: true } } )
		);
		expect( result.current ).toBeFalsy();
	} );

	it( 'should be true when text color is enabled with custom colors support', () => {
		const { result } = renderHook( () =>
			useHasTypographyPanel( { color: { text: true, custom: true } } )
		);
		expect( result.current ).toBeTruthy();
	} );
} );

// ---------------------------------------------------------------------------
// TypographyPanel — setTextColor link-sync behaviour (render tests)
// ---------------------------------------------------------------------------

// Setting the text color should keep an in-sync link color following it (e.g.
// a Button's link color tracks its text color). The two palette entries below
// share the same decoded hex value (#000) but carry distinct slugs, ensuring
// the sync keys off the raw preset reference rather than the decoded hex.
const DUPLICATE_PALETTE_SETTINGS = {
	color: {
		text: true,
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

describe( 'TypographyPanel — setTextColor link sync', () => {
	// Helper: open the text Color dropdown and return the rendered swatches.
	async function openTextColorDropdown() {
		await click(
			screen.getByRole( 'button', { name: /Color/, expanded: false } )
		);
		// `findAllByRole` waits for the Popover/portal content to appear.
		return screen.findAllByRole( 'option' );
	}

	it( 'syncs the link color when text and link share the same raw preset reference', async () => {
		const onChange = jest.fn();
		const sharedRef = 'var:preset|color|dark-background';

		await render(
			<TypographyPanel
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

		const swatches = await openTextColorDropdown();
		// swatch[0] = 'dark-background', swatch[1] = 'dark-text'
		await click( swatches[ 1 ] );

		const result = onChange.mock.calls[ 0 ][ 0 ];
		expect( result?.color?.text ).toBe( 'var:preset|color|dark-text' );
		// Link must follow because text and link shared the same ref.
		expect( result?.elements?.link?.color?.text ).toBe(
			'var:preset|color|dark-text'
		);
	} );

	it( 'does NOT sync the link color when text and link have different raw refs, even if their decoded hex values match', async () => {
		const onChange = jest.fn();

		await render(
			<TypographyPanel
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

		const swatches = await openTextColorDropdown();
		await click( swatches[ 1 ] );

		const result = onChange.mock.calls[ 0 ][ 0 ];
		expect( result?.color?.text ).toBe( 'var:preset|color|dark-text' );
		// Link must NOT be updated: raw-ref identity is what matters,
		// not decoded-value equality.
		expect( result?.elements?.link?.color?.text ).toBeUndefined();
	} );
} );
