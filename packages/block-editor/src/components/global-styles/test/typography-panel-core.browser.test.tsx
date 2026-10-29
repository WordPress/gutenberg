import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import TypographyPanel from '../typography-panel';
import type { PanelStyle } from '../types';

// Three presets with distinct slugs and distinct hex values, enough to drive the
// text color dropdown and to tell "left alone" apart from "synced".
const PALETTE_SETTINGS = {
	color: {
		text: true,
		custom: false,
		customGradient: false,
		defaultPalette: false,
		palette: {
			theme: [
				{ color: '#0000ff', name: 'Blue', slug: 'blue' },
				{ color: '#ff0000', name: 'Red', slug: 'red' },
				{ color: '#00ff00', name: 'Green', slug: 'green' },
			],
		},
	},
};

describe( 'TypographyPanel color reset', () => {
	it( 'renders the default color reset button when a local color shadows an inherited one', async () => {
		await render(
			<TypographyPanel
				value={ { color: { text: 'var:preset|color|blue' } } }
				inheritedValue={ { color: { text: 'var:preset|color|red' } } }
				settings={ PALETTE_SETTINGS }
				panelId="test"
				onChange={ vi.fn() }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: /^reset$/i } )
		).toBeInTheDocument();
	} );
} );

describe( 'TypographyPanel setTextColor link sync', () => {
	async function pickRed( value: PanelStyle, inheritedValue?: PanelStyle ) {
		const onChange = vi.fn();
		await render(
			<TypographyPanel
				value={ value }
				inheritedValue={ inheritedValue }
				settings={ PALETTE_SETTINGS }
				panelId="test"
				onChange={ onChange }
			/>
		);
		await userEvent.click(
			screen.getByRole( 'button', { name: /Color/, expanded: false } )
		);
		// `findAllByRole` waits for the Popover/portal content to appear.
		const swatches = await screen.findAllByRole( 'option' );
		// swatch[0] = 'Blue', swatch[1] = 'Red'
		await userEvent.click( swatches[ 1 ] );
		return onChange.mock.calls[ 0 ][ 0 ];
	}

	const BLUE = 'var:preset|color|blue';
	const RED = 'var:preset|color|red';
	const GREEN = 'var:preset|color|green';

	it( 'starts a link color tracking when nothing is set', async () => {
		const result = await pickRed( {} );

		expect( result?.color?.text ).toBe( RED );
		expect( result?.elements?.link?.color?.text ).toBe( RED );
	} );

	it( 'starts a link color tracking when only a text color is set', async () => {
		const result = await pickRed( { color: { text: BLUE } } );

		expect( result?.color?.text ).toBe( RED );
		expect( result?.elements?.link?.color?.text ).toBe( RED );
	} );

	// The local branch of `shouldSyncLinkColor`, which the pre-inheritance
	// comparison could not express: it only ever looked at `inheritedValue`.
	it( 'keeps a local link color tracking while it matches the text color', async () => {
		const result = await pickRed( {
			color: { text: BLUE },
			elements: { link: { color: { text: BLUE } } },
		} );

		expect( result?.color?.text ).toBe( RED );
		expect( result?.elements?.link?.color?.text ).toBe( RED );
	} );

	it( 'leaves a link color alone once it differs from the text color', async () => {
		// Green is neither the outgoing text color nor the incoming one, so a
		// green link surviving proves it was left untouched rather than synced.
		const result = await pickRed( {
			color: { text: BLUE },
			elements: { link: { color: { text: GREEN } } },
		} );

		expect( result?.color?.text ).toBe( RED );
		expect( result?.elements?.link?.color?.text ).toBe( GREEN );
	} );

	// In Global Styles `value` is the user config and `inheritedValue` the
	// merged one, so an unset local link color defers to the merged pair.
	it( 'defers to the inherited pair when no local link color is set', async () => {
		const result = await pickRed(
			{},
			{
				color: { text: BLUE },
				elements: { link: { color: { text: RED } } },
			}
		);

		expect( result?.color?.text ).toBe( RED );
		// The theme's text and link colors differ, so the link does not track.
		expect( result?.elements?.link?.color?.text ).toBeUndefined();
	} );
} );
