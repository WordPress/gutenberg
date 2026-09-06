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

const shadowOnlySettings = { shadow: settingsAll.shadow };
const borderOnlySettings = { border: settingsAll.border };

describe( 'BorderPanel — panel and control labels', () => {
	it( 'titles the panel "Borders" when border and shadow controls are available', () => {
		render(
			<BorderPanel
				value={ {} }
				settings={ settingsAll }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		expect(
			screen.getByRole( 'heading', { name: 'Borders' } )
		).toBeInTheDocument();
	} );

	it( 'titles the panel "Borders" when only a shadow control is available', () => {
		// A shadow is treated as a soft border, so the title does not change
		// with whichever controls a theme or block opts into. A stable title
		// is what lets each control keep its own visible label.
		render(
			<BorderPanel
				value={ {} }
				settings={ shadowOnlySettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		expect(
			screen.getByRole( 'heading', { name: 'Borders' } )
		).toBeInTheDocument();
	} );

	it( 'labels the border control, and puts its unlink toggle in that label row, when no shadow control is available', () => {
		// The case that motivated the change: with no Shadow control to
		// disambiguate it from, the Border label used to be hidden, which left
		// its unlink toggle beside the inputs while the Radius one sat in a
		// label row. Both now share the same layout.
		render(
			<BorderPanel
				value={ {} }
				settings={ borderOnlySettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		expect( screen.getByText( 'Border' ) ).toBeInTheDocument();

		// `getAllByRole` returns document order, so the toggle preceding the
		// border color/style picker is what places it in the label row rather
		// than alongside the inputs.
		const buttons = screen.getAllByRole( 'button' );
		expect(
			buttons.indexOf( screen.getByLabelText( 'Unlink sides' ) )
		).toBeLessThan(
			buttons.indexOf(
				screen.getByLabelText( /Border color( and style)* picker/ )
			)
		);
	} );

	it( 'labels the border control when the inheritance indicators are off', () => {
		// Global Styles renders the panel without the inheritance treatment.
		// That used to be the other half of the condition hiding the label, so
		// a border-only panel showed no label there either.
		render(
			<BorderPanel
				value={ {} }
				settings={ borderOnlySettings }
				onChange={ () => {} }
				panelId="test-panel"
				showInheritanceLabelIndicators={ false }
			/>
		);

		expect( screen.getByText( 'Border' ) ).toBeInTheDocument();
	} );

	it( 'labels the shadow control even when no border control is available', () => {
		render(
			<BorderPanel
				value={ {} }
				settings={ shadowOnlySettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		expect( screen.getByText( 'Shadow' ) ).toBeInTheDocument();
	} );
} );

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

describe( 'BorderPanel — shadow preset persistence', () => {
	const selectShadowPreset = async ( user, name ) => {
		await user.click(
			screen.getByRole( 'button', { name: 'Drop shadow' } )
		);
		await user.click( screen.getByRole( 'option', { name } ) );
	};

	const shadowSettings = ( presets, defaultPresets = true ) => ( {
		shadow: { defaultPresets, presets },
	} );

	const defaultPreset = {
		name: 'Natural',
		slug: 'natural',
		shadow: '6px 6px 9px rgba(0, 0, 0, 0.2)',
	};
	const themePreset = {
		name: 'Outlined',
		slug: 'outlined',
		shadow: '6px 6px 0px -3px rgba(255, 255, 255, 1), 6px 6px rgba(0, 0, 0, 1)',
	};
	const customPreset = {
		name: 'My shadow',
		slug: 'my-shadow',
		shadow: '0 0 10px rgba(255, 0, 0, 1)',
	};

	it( 'persists a theme preset as a preset reference when custom presets also exist', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<BorderPanel
				value={ {} }
				settings={ shadowSettings( {
					default: [ defaultPreset ],
					theme: [ themePreset ],
					custom: [ customPreset ],
				} ) }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		await selectShadowPreset( user, 'Outlined' );

		expect( onChange ).toHaveBeenCalledWith( {
			shadow: 'var:preset|shadow|outlined',
		} );
	} );

	it( 'persists a default preset as a preset reference when custom presets also exist', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<BorderPanel
				value={ {} }
				settings={ shadowSettings( {
					default: [ defaultPreset ],
					theme: [ themePreset ],
					custom: [ customPreset ],
				} ) }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		await selectShadowPreset( user, 'Natural' );

		expect( onChange ).toHaveBeenCalledWith( {
			shadow: 'var:preset|shadow|natural',
		} );
	} );

	it( 'persists a custom preset as a preset reference', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<BorderPanel
				value={ {} }
				settings={ shadowSettings( {
					default: [ defaultPreset ],
					theme: [ themePreset ],
					custom: [ customPreset ],
				} ) }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		await selectShadowPreset( user, 'My shadow' );

		expect( onChange ).toHaveBeenCalledWith( {
			shadow: 'var:preset|shadow|my-shadow',
		} );
	} );

	it( 'persists the unset entry as a literal value, not a preset reference', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<BorderPanel
				value={ {} }
				settings={ shadowSettings( {
					theme: [ themePreset ],
					custom: [ customPreset ],
				} ) }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		await selectShadowPreset( user, 'Unset' );

		expect( onChange ).toHaveBeenCalledWith( { shadow: 'none' } );
	} );

	it( 'does not reference default presets the theme has opted out of', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<BorderPanel
				value={ {} }
				settings={ shadowSettings(
					{
						// Same shadow value as the theme preset below, so the
						// lookup has to skip it rather than match it first.
						default: [
							{ ...defaultPreset, shadow: themePreset.shadow },
						],
						theme: [ themePreset ],
					},
					false
				) }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		await selectShadowPreset( user, 'Outlined' );

		// The opted-out preset is not offered, so it is not something the
		// user can have meant.
		expect(
			screen.queryByRole( 'option', { name: 'Natural' } )
		).not.toBeInTheDocument();
		expect( onChange ).toHaveBeenCalledWith( {
			shadow: 'var:preset|shadow|outlined',
		} );
	} );

	it( 'offers only the most specific preset when a slug is defined twice', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		// Custom preset slugs are generated as `shadow-<n>` from the custom
		// presets alone, so they can collide with a theme preset's slug.
		const themeShadowOne = {
			name: 'Theme shadow',
			slug: 'shadow-1',
			shadow: '0 0 10px rgba(0, 0, 255, 1)',
		};
		const customShadowOne = {
			name: 'Shadow 1',
			slug: 'shadow-1',
			shadow: '0 0 10px rgba(255, 0, 0, 1)',
		};

		render(
			<BorderPanel
				value={ {} }
				settings={ shadowSettings( {
					theme: [ themeShadowOne ],
					custom: [ customShadowOne ],
				} ) }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Drop shadow' } )
		);

		// `--wp--preset--shadow--shadow-1` holds the custom preset's value, so
		// offering the theme one would show a shadow it cannot apply.
		expect(
			screen.queryByRole( 'option', { name: 'Theme shadow' } )
		).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'option', { name: 'Shadow 1' } ) );

		expect( onChange ).toHaveBeenCalledWith( {
			shadow: 'var:preset|shadow|shadow-1',
		} );
	} );

	it( 'references the most specific origin when two presets share a value', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		// A custom preset starts out with the same value as the `natural`
		// default one, so this is the state right after adding one.
		render(
			<BorderPanel
				value={ {} }
				settings={ shadowSettings( {
					default: [ defaultPreset ],
					custom: [
						{ ...customPreset, shadow: defaultPreset.shadow },
					],
				} ) }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		await selectShadowPreset( user, 'My shadow' );

		expect( onChange ).toHaveBeenCalledWith( {
			shadow: 'var:preset|shadow|my-shadow',
		} );
	} );
} );
