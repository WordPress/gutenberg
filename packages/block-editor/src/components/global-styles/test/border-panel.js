/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import BorderPanel from '../border-panel';

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
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				radiusInput.closest( '.is-inherited-from-global-styles' )
			).not.toBeNull();
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
				// eslint-disable-next-line testing-library/no-node-access
				radiusInput.closest( '.is-inherited-from-global-styles' )
			).toBeNull();
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				radiusInput.closest( '.has-local-override-from-global-styles' )
			).not.toBeNull();
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
	} );

	describe( 'Border box (compound archetype)', () => {
		it( 'applies the inherited-label className when local is unset and inherited is defined', () => {
			const inheritedValue = {
				border: {
					color: '#000000',
					style: 'solid',
					width: '1px',
				},
			};

			const { container } = render(
				<BorderPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// The inherited-label class lands on the parent
			// ToolsPanelItem of the Border control.
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const inheritedItems = container.querySelectorAll(
				'.is-inherited-from-global-styles'
			);
			expect( inheritedItems.length ).toBeGreaterThanOrEqual( 1 );
		} );

		it( 'applies the local-override className when a local border is defined', () => {
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

			const { container } = render(
				<BorderPanel
					value={ value }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// Inherited class never lands when local is set.
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const inheritedItems = container.querySelectorAll(
				'.is-inherited-from-global-styles'
			);
			expect( inheritedItems ).toHaveLength( 0 );

			// And the local-override class is present at least once.
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const overrideItems = container.querySelectorAll(
				'.has-local-override-from-global-styles'
			);
			expect( overrideItems.length ).toBeGreaterThanOrEqual( 1 );
		} );

		it( 'renders a label DOM node the inheritance treatment can target (regression)', () => {
			// Regression: `BorderBoxControl`'s built-in label is a styled
			// component with no `.components-base-control__label`
			// classname, so when the panel passed its visible "Border"
			// label via that prop neither the synced-purple text rule
			// nor the portaled local-override dot could find a target.
			// The panel must render its own `BaseControl.VisualLabel`
			// inside the `ToolsPanelItem` so both visual treatments
			// land on the Border control as designed.
			const inheritedValue = {
				border: {
					color: '#000000',
					style: 'solid',
					width: '1px',
				},
			};

			const { container } = render(
				<BorderPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const inheritedItem = container.querySelector(
				'.is-inherited-from-global-styles'
			);
			expect( inheritedItem ).not.toBeNull();
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				inheritedItem.querySelector( '.components-base-control__label' )
			).not.toBeNull();
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
		it( 'applies the inherited-label className to the shadow ToolsPanelItem when local is unset and inherited is defined', () => {
			const inheritedValue = {
				shadow: 'var:preset|shadow|soft',
			};

			const { container } = render(
				<BorderPanel
					value={ {} }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const dropdown = container.querySelector(
				'.block-editor-global-styles__shadow-dropdown'
			);
			expect( dropdown ).not.toBeNull();
			// The dropdown itself no longer carries the inheritance
			// class — it sits inside a ToolsPanelItem that does.
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				dropdown.closest( '.is-inherited-from-global-styles' )
			).not.toBeNull();
		} );

		it( 'applies the local-override className when a local shadow is set', () => {
			const inheritedValue = {
				shadow: 'var:preset|shadow|soft',
			};
			const value = { shadow: 'var:preset|shadow|hard' };

			const { container } = render(
				<BorderPanel
					value={ value }
					inheritedValue={ inheritedValue }
					settings={ settingsAll }
					onChange={ () => {} }
					panelId="test-panel"
				/>
			);

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const dropdown = container.querySelector(
				'.block-editor-global-styles__shadow-dropdown'
			);
			expect( dropdown ).not.toBeNull();
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				dropdown.closest( '.is-inherited-from-global-styles' )
			).toBeNull();
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				dropdown.closest( '.has-local-override-from-global-styles' )
			).not.toBeNull();
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
	} );
} );
