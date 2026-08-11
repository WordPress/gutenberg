import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BorderPanel from '../border-panel';

// The inheritance treatment sits behind the
// `gutenberg-global-styles-inheritance-ui` experiment. Turn it on so these
// tests exercise the inheriting path.
beforeEach( () => {
	window.__experimentalGlobalStylesInheritanceUI = true;
} );

afterEach( () => {
	delete window.__experimentalGlobalStylesInheritanceUI;
} );

/**
 * Tests for the inherited Global Styles label treatment in `BorderPanel`.
 * The visual treatment lands on the parent `ToolsPanelItem` via the
 * `.is-inherited-from-global-styles` / `.has-local-override-from-global-styles`
 * class hooks. The inner controls (`BorderBoxControl`,
 * `BorderRadiusControl`, `ShadowPopover`) carry no special className
 * for inheritance state.
 *
 * For the input archetype (`BorderRadiusControl`) the inherited value
 * is forwarded as the displayed `values=` while local values are unset, so
 * the underlying UnitControl can parse the quantity and unit normally without
 * committing the inherited value on mount.
 */

const settingsAll = {
	border: {
		color: true,
		radius: true,
		style: true,
		width: true,
	},
	shadow: {
		defaultPresets: true,
		presets: {
			default: [
				{
					name: 'Soft',
					slug: 'soft',
					shadow: '0 4px 8px rgba(0,0,0,0.1)',
				},
				{
					name: 'Hard',
					slug: 'hard',
					shadow: '0 8px 16px rgba(0,0,0,0.2)',
				},
			],
		},
	},
};

describe( 'BorderPanel — inherited Global Styles label treatment', () => {
	describe( 'Border radius (input archetype)', () => {
		it( 'renders an inherited string radius as the displayed value when local is empty', () => {
			const inheritedValue = { border: { radius: '8px' } };

			render(
				<BorderPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			const radiusInput = screen.getByRole( 'spinbutton', {
				name: /border radius/i,
			} );
			expect( radiusInput ).toHaveValue( 8 );
			expect( radiusInput ).not.toHaveAttribute( 'placeholder' );
		} );

		it( 'uses the inherited radius unit as the selected unit when local is empty', () => {
			const inheritedValue = { border: { radius: '2.5em' } };

			render(
				<BorderPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			const radiusInput = screen.getByRole( 'spinbutton', {
				name: /border radius/i,
			} );
			expect( radiusInput ).toHaveValue( 2.5 );
			const unitControls = screen.getAllByRole( 'combobox', {
				name: /select unit/i,
			} );
			expect( unitControls[ 1 ] ).toHaveValue( 'em' );
		} );

		it( 'renders a locally-set radius as the value with no placeholder', () => {
			const inheritedValue = { border: { radius: '8px' } };
			const value = { border: { radius: '12px' } };

			render(
				<BorderPanel
					value={ value }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			const radiusInput = screen.getByRole( 'spinbutton', {
				name: /border radius/i,
			} );
			expect( radiusInput ).toHaveValue( 12 );
			expect( radiusInput ).not.toHaveAttribute( 'placeholder' );
			expect(
				screen.getByRole( 'button', {
					name: /reset to inherited value/i,
				} )
			).toBeInTheDocument();
		} );

		it( 'does not invoke onChange on mount when only an inherited radius is present (display-without-commit)', () => {
			const onChange = jest.fn();
			const inheritedValue = { border: { radius: '8px' } };

			render(
				<BorderPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ onChange }
					panelId="test-panel"
				/>
			);

			expect( onChange ).not.toHaveBeenCalled();
		} );

		it( 'commits a typed local radius override without copying any inherited values (strip-not-copy)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			const inheritedValue = {
				border: { radius: '8px' },
				shadow: 'var:preset|shadow|soft',
			};

			render(
				<BorderPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ onChange }
					panelId="test-panel"
				/>
			);

			const radiusInput = screen.getByRole( 'spinbutton', {
				name: /border radius/i,
			} );
			await user.type( radiusInput, '20' );

			expect( onChange ).toHaveBeenCalled();
			const lastCall = onChange.mock.calls.at( -1 )[ 0 ];
			expect( lastCall?.border?.radius ).toBeDefined();
			expect( lastCall?.shadow ).toBeUndefined();
		} );

		it( 'does not bake the inherited border color/style/width into the local override when only a radius is set', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			const inheritedValue = {
				border: {
					color: '#000000',
					style: 'solid',
					width: '1px',
				},
			};

			render(
				<BorderPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ onChange }
					panelId="test-panel"
				/>
			);

			const radiusInput = screen.getByRole( 'spinbutton', {
				name: /border radius/i,
			} );
			await user.type( radiusInput, '20' );

			expect( onChange ).toHaveBeenCalled();
			const committedBorder = onChange.mock.calls.at( -1 )[ 0 ]?.border;
			expect( committedBorder?.radius ).toBeDefined();
			expect( committedBorder?.color ).toBeUndefined();
			expect( committedBorder?.style ).toBeUndefined();
			expect( committedBorder?.width ).toBeUndefined();
		} );
	} );

	describe( 'Border box (compound archetype)', () => {
		it( 'surfaces the accessible reset affordance when a local border is defined', () => {
			const inheritedValue = {
				border: {
					color: '#000000',
					style: 'solid',
					width: '1px',
					radius: '8px',
				},
			};
			const value = {
				border: {
					color: '#ff0000',
					style: 'dashed',
					width: '2px',
					radius: '12px',
				},
			};

			render(
				<BorderPanel
					value={ value }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// The local override surfaces the accessible reset affordance.
			expect(
				screen.getAllByRole( 'button', {
					name: /reset to inherited value/i,
				} ).length
			).toBeGreaterThanOrEqual( 1 );
		} );

		it( 'does not bake the inherited radius into the local override when only color/style/width are customised (regression)', async () => {
			// Regression: when at-rest the panel displays the inherited
			// border in `BorderBoxControl`, including the inherited
			// `radius`. Customising color/style/width must not copy
			// the inherited radius into `value.border.radius` —
			// otherwise the radius `ToolsPanelItem` flips into the
			// `has-local-override-from-global-styles` state (and
			// renders the blue dot) even though the user never
			// customised the radius.
			const user = userEvent.setup();
			const onChange = jest.fn();
			const inheritedValue = {
				border: {
					color: '#000000',
					style: 'solid',
					width: '1px',
					radius: '8px',
				},
			};

			render(
				<BorderPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ onChange }
					panelId="test-panel"
				/>
			);

			// Trigger a border change via the width input rendered by
			// `BorderBoxControl`. We don't depend on the exact role
			// markup beyond there being a numeric width input — the
			// regression is observable in the resulting `onChange`
			// payload, not the DOM.
			const widthInput = screen.getByRole( 'spinbutton', {
				name: /border width/i,
			} );
			await user.clear( widthInput );
			await user.type( widthInput, '4' );

			expect( onChange ).toHaveBeenCalled();
			const lastCall = onChange.mock.calls.at( -1 )[ 0 ];
			expect( lastCall?.border?.radius ).toBeUndefined();
		} );

		it( 'does not invoke onChange on mount when only an inherited border is present', () => {
			const onChange = jest.fn();
			const inheritedValue = {
				border: {
					color: '#000000',
					style: 'solid',
					width: '1px',
				},
			};

			render(
				<BorderPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ onChange }
					panelId="test-panel"
				/>
			);

			expect( onChange ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'Shadow (popover-trigger archetype)', () => {
		it( 'surfaces the accessible reset affordance when a local shadow is set', () => {
			const inheritedValue = {
				shadow: 'var:preset|shadow|soft',
			};
			const value = { shadow: 'var:preset|shadow|hard' };

			render(
				<BorderPanel
					value={ value }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			expect(
				screen.getByRole( 'button', {
					name: /reset to inherited value/i,
				} )
			).toBeInTheDocument();
		} );

		it( 'does not invoke onChange on mount when only an inherited shadow is present', () => {
			const onChange = jest.fn();
			const inheritedValue = {
				shadow: 'var:preset|shadow|soft',
			};

			render(
				<BorderPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ onChange }
					panelId="test-panel"
				/>
			);

			expect( onChange ).not.toHaveBeenCalled();
		} );

		it( 'renders no reset affordance when the shadow is only inherited (no local override)', () => {
			const inheritedValue = { shadow: 'var:preset|shadow|soft' };

			render(
				<BorderPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// A merely-inherited value must not show the default remove
			// button nor the local-override blue-dot reset.
			expect(
				screen.queryByRole( 'button', { name: /^remove$/i } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: /reset to inherited value/i,
				} )
			).not.toBeInTheDocument();
		} );

		it( 'renders the blue-dot InheritanceResetButton for a local override', () => {
			const inheritedValue = { shadow: 'var:preset|shadow|soft' };
			const value = { shadow: 'var:preset|shadow|hard' };

			render(
				<BorderPanel
					value={ value }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// The local override renders the blue-dot reset (mirroring the
			// color/gradient controls), not the plain remove button.
			expect(
				screen.getByRole( 'button', {
					name: /reset to inherited value/i,
				} )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: /^remove$/i } )
			).not.toBeInTheDocument();
		} );

		it( 'renders the default remove button for a locally-set shadow with no inherited value', () => {
			const value = { shadow: 'var:preset|shadow|hard' };

			render(
				<BorderPanel
					value={ value }
					inheritedValue={ {} }
					settings={ settingsAll }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// With no inherited value there is no override to reset to, so
			// the plain remove button is used, not the blue-dot affordance.
			expect(
				screen.getByRole( 'button', { name: /^remove$/i } )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', {
					name: /reset to inherited value/i,
				} )
			).not.toBeInTheDocument();
		} );
	} );
} );
