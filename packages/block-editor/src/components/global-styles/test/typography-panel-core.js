/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { click, render as renderAriakit } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import TypographyPanel from '../typography-panel';

// Core-build coverage for `TypographyPanel`. Tests run with
// `IS_GUTENBERG_PLUGIN` true, so the core path needs a mock. `jest.mock` is
// file-scoped, so these tests live apart from `typography-panel.js`.
jest.mock( '../inheritance', () => ( {
	...jest.requireActual( '../inheritance' ),
	ENABLE_GLOBAL_STYLES_INHERITANCE: false,
} ) );

const baseSettings = {
	typography: {
		lineHeight: true,
		letterSpacing: true,
	},
};

// Two presets with distinct slugs and distinct hex values, enough to drive the
// text color dropdown.
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
			],
		},
	},
};

function renderPanel( props ) {
	return render(
		<TypographyPanel
			value={ {} }
			settings={ baseSettings }
			onChange={ () => {} }
			panelId="test-panel"
			{ ...props }
		/>
	);
}

const getItem = ( name ) => {
	const control = screen.getByRole( 'spinbutton', { name } );
	// The class hooks sit on the wrapping ToolsPanelItem, which has no role.
	// eslint-disable-next-line testing-library/no-node-access
	return control.closest( '.components-tools-panel-item' );
};

describe( 'TypographyPanel — core build defaults', () => {
	// `showInheritanceLabelIndicators` defaults to the build constant, so a
	// caller that passes no prop gets no inheritance treatment in core. The
	// layout className must still come through.
	it( 'applies no inherited treatment by default, even when an inherited value is present', () => {
		renderPanel( {
			value: {},
			inheritedValue: { typography: { lineHeight: '1.5' } },
		} );

		const lineHeightItem = getItem( /line height/i );
		expect( lineHeightItem ).toHaveClass( 'single-column' );
		expect( lineHeightItem ).not.toHaveClass(
			'is-inherited-from-global-styles'
		);
	} );

	it( 'renders no reset dot by default when a local value shadows an inherited one', () => {
		renderPanel( {
			value: { typography: { lineHeight: '2' } },
			inheritedValue: { typography: { lineHeight: '1.5' } },
		} );

		expect( getItem( /line height/i ) ).not.toHaveClass(
			'has-local-override-from-global-styles'
		);
		expect(
			screen.queryByRole( 'button', {
				name: 'Reset to inherited value',
			} )
		).not.toBeInTheDocument();
	} );
} );

describe( 'TypographyPanel — core build setTextColor link sync', () => {
	async function pickRed( value, inheritedValue ) {
		const onChange = jest.fn();
		await renderAriakit(
			<TypographyPanel
				value={ value }
				inheritedValue={ inheritedValue }
				settings={ PALETTE_SETTINGS }
				panelId="test"
				onChange={ onChange }
			/>
		);
		await click(
			screen.getByRole( 'button', { name: /Color/, expanded: false } )
		);
		// `findAllByRole` waits for the Popover/portal content to appear.
		const swatches = await screen.findAllByRole( 'option' );
		// swatch[0] = 'Blue', swatch[1] = 'Red'
		await click( swatches[ 1 ] );
		return onChange.mock.calls[ 0 ][ 0 ];
	}

	it( 'leaves an unset link color alone when a text color is already set', async () => {
		// The plugin falls back to the inherited link color here and syncs.
		// Core compares the inherited text and link colors directly, which on
		// this path is the block's own pair, so a link color that was never
		// set does not start tracking.
		const result = await pickRed( {
			color: { text: 'var:preset|color|blue' },
		} );

		expect( result?.color?.text ).toBe( 'var:preset|color|red' );
		expect( result?.elements?.link?.color?.text ).toBeUndefined();
	} );

	it( 'starts a link color tracking when neither is set', async () => {
		// Both sides are undefined, so they compare as matching and the link
		// color starts following the text color.
		const result = await pickRed( {} );

		expect( result?.color?.text ).toBe( 'var:preset|color|red' );
		expect( result?.elements?.link?.color?.text ).toBe(
			'var:preset|color|red'
		);
	} );

	// In Global Styles `value` is the user config and `inheritedValue` the
	// merged one. Comparing `value` would find undefined on both sides.
	it( 'reads the merged config, not the user config, in Global Styles', async () => {
		const result = await pickRed(
			{},
			{
				color: { text: 'var:preset|color|blue' },
				elements: { link: { color: { text: 'var:preset|color|red' } } },
			}
		);

		expect( result?.color?.text ).toBe( 'var:preset|color|red' );
		// The theme's text and link colors differ, so the link does not track.
		expect( result?.elements?.link?.color?.text ).toBeUndefined();
	} );
} );
