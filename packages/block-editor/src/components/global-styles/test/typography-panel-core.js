/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { click, render as renderAriakit } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import TypographyPanel from '../typography-panel';

// Coverage for `TypographyPanel` with the `gutenberg-global-styles-inheritance-ui`
// experiment off, which is what WordPress Core gets. Deleted rather than set to
// `false`, because an experiment that was never turned on leaves the global
// unset, and `undefined` is the value that fires a receiving component's own
// default parameter. Setting `false` here would test a state that does not
// occur.
beforeEach( () => {
	delete window.__experimentalGlobalStylesInheritanceUI;
} );

afterEach( () => {
	delete window.__experimentalGlobalStylesInheritanceUI;
} );

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

describe( 'TypographyPanel — experiment off', () => {
	// `showInheritanceLabelIndicators` defaults to the experiment flag, so a
	// caller that passes no prop gets no inheritance treatment. The layout
	// className must still come through.
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

	it( 'renders the default color reset button by default when a local color shadows an inherited one', async () => {
		await renderAriakit(
			<TypographyPanel
				value={ { color: { text: 'var:preset|color|blue' } } }
				inheritedValue={ { color: { text: 'var:preset|color|red' } } }
				settings={ PALETTE_SETTINGS }
				panelId="test"
				onChange={ jest.fn() }
			/>
		);

		expect(
			screen.queryByRole( 'button', {
				name: /reset to inherited value/i,
			} )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: /^reset$/i } )
		).toBeInTheDocument();
	} );
} );

describe( 'TypographyPanel — experiment off, setTextColor link sync', () => {
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
		// With the experiment on this falls back to the inherited link color
		// and syncs. Off, it compares the inherited text and link colors
		// directly, which on this path is the block's own pair, so a link
		// color that was never set does not start tracking.
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
