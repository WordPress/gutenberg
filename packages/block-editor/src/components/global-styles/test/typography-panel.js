/**
 * External dependencies
 */
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { click, render as renderAriakit } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import TypographyPanel, { useHasTypographyPanel } from '../typography-panel';

/**
 * Render helper that flushes async state effects from Ariakit-based
 * controls (CustomSelectControl, FontAppearanceControl, FontFamily) so
 * tests don't trip the strict `console.error` rule on
 * "An update to %s inside a test was not wrapped in act(...)".
 *
 * The first microtask flush handles Ariakit's `useLayoutEffect`-driven
 * state updates that cannot be wrapped by `render()`'s implicit act.
 *
 * @param {React.ReactElement} ui React element to render.
 * @return {ReturnType<typeof render>} The settled `render()` result, including `container`, `rerender`, etc.
 */
async function renderAndSettle( ui ) {
	let result;
	// eslint-disable-next-line testing-library/no-unnecessary-act -- Ariakit `useLayoutEffect` chains in CustomSelect / FontAppearance / FontFamily emit state updates outside RTL's implicit act, so we must wrap render explicitly.
	await act( async () => {
		result = render( ui );
	} );
	return result;
}

/**
 * Renders `TypographyPanel` with sensible defaults so tests only pass the
 * props they actually care about (usually `value` and `inheritedValue`).
 *
 * @param {Object} props Props to override the defaults.
 * @return {ReturnType<typeof render>} The `render()` result.
 */
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

/**
 * Async variant of `renderPanel` for controls (Ariakit-based) that need
 * their effects flushed. See `renderAndSettle`.
 *
 * @param {Object} props Props to override the defaults.
 * @return {Promise<ReturnType<typeof render>>} The settled `render()` result.
 */
function renderPanelAndSettle( props ) {
	return renderAndSettle(
		<TypographyPanel
			value={ {} }
			settings={ baseSettings }
			onChange={ () => {} }
			panelId="test-panel"
			{ ...props }
		/>
	);
}

/**
 * Tests for inherited values in `TypographyPanel`.
 *
 * The tests intentionally target representative control paths rather than full
 * panel coverage. They verify that inherited values are displayed without
 * being committed, and that local overrides remain the source of truth.
 */

const baseSettings = {
	typography: {
		lineHeight: true,
		letterSpacing: true,
		textColumns: true,
		textIndent: 'subsequent',
		textDecoration: true,
		writingMode: true,
		textTransform: true,
		textAlign: true,
		fontSize: true,
		customFontSize: true,
		fontSizes: {
			theme: [
				{ slug: 'large', size: '24px', name: 'Large' },
				{ slug: 'huge', size: '42px', name: 'Huge' },
			],
		},
	},
};

// Settings variant that also enables the FontFamily and FontAppearance
// controls. Kept separate from `baseSettings` because mounting these
// controls registers extra ToolsPanelItem callbacks that surface React
// 18 `act(...)` warnings under jsdom; the warnings are spurious for
// tests that don't exercise font appearance / family. New per-archetype
// tests that DO assert font appearance / family behaviour opt into
// this richer settings object.
const settingsWithFonts = {
	typography: {
		...baseSettings.typography,
		fontFamily: true,
		fontStyle: true,
		fontWeight: true,
		fontFamilies: {
			theme: [
				{ slug: 'serif', name: 'Serif', fontFamily: 'Georgia, serif' },
				{
					slug: 'sans',
					name: 'Sans',
					fontFamily: 'system-ui, sans-serif',
				},
			],
		},
	},
};

describe( 'TypographyPanel — inheritedValue round-trip', () => {
	it( 'renders a numeric leaf from `inheritedValue` as the control value when `value` is empty', () => {
		// LineHeightControl uses the local-then-inherited pattern: the
		// inherited value is rendered as the control's value (so the
		// numeric stepper increments from the inherited base) and an
		// inherited-value class hook marks it as at-rest. It is only
		// committed to local on user change.
		const inheritedValue = {
			typography: { lineHeight: '1.7' },
		};

		renderPanel( { inheritedValue } );

		const lineHeightInput = screen.getByLabelText( /line height/i );
		expect( lineHeightInput ).toHaveValue( 1.7 );
	} );

	it( 'renders an integer leaf from `inheritedValue` as placeholder when `value` is empty', () => {
		// Placeholder-capable controls communicate the inherited value
		// via the native `placeholder` attribute rather than as the
		// rendered `value`, so users can distinguish local values from
		// inherited values.
		const inheritedValue = {
			typography: { textColumns: 3 },
		};

		renderPanel( { inheritedValue } );

		const columnsInput = screen.getByLabelText( /columns/i );
		// No locally-set value; the rendered value is empty.
		expect( columnsInput ).toHaveValue( null );
		// The inherited value reaches the user via the native
		// `placeholder` attribute.
		expect( columnsInput ).toHaveAttribute( 'placeholder', '3' );
	} );

	it( 'renders a locally-set integer leaf as the value, with no placeholder, even when `inheritedValue` also defines it', () => {
		// Local override wins over the inherited value, and there is
		// no placeholder treatment because the user has committed a
		// value of their own.
		const inheritedValue = {
			typography: { textColumns: 3 },
		};
		const value = {
			typography: { textColumns: 5 },
		};

		renderPanel( { value, inheritedValue } );

		const columnsInput = screen.getByLabelText( /columns/i );
		expect( columnsInput ).toHaveValue( 5 );
		expect( columnsInput ).not.toHaveAttribute( 'placeholder' );
	} );

	it( 'shows no placeholder for an integer leaf when `inheritedValue` also omits it', () => {
		// Without an inherited value, there is nothing to communicate
		// as a placeholder; the input renders as an ordinary empty
		// NumberControl.
		renderPanel( { inheritedValue: {} } );

		const columnsInput = screen.getByLabelText( /columns/i );
		expect( columnsInput ).toHaveValue( null );
		expect( columnsInput ).not.toHaveAttribute( 'placeholder' );
	} );

	it( 'commits a local override on user input without copying the inherited value into other paths', async () => {
		// A local commit writes only the path the user touched. The
		// inherited value is never copied into local attributes by typing.
		const user = userEvent.setup();
		const onChange = jest.fn();
		const inheritedValue = {
			typography: { textColumns: 3, lineHeight: '1.7' },
		};

		renderPanel( { inheritedValue, onChange } );

		const columnsInput = screen.getByLabelText( /columns/i );
		await user.type( columnsInput, '2' );

		// onChange must be called with the typed value at exactly the
		// touched path; no other path is mutated, and no inherited
		// value is copied into the local payload.
		expect( onChange ).toHaveBeenCalled();
		const lastCall = onChange.mock.calls.at( -1 )[ 0 ];
		// NumberControl emits the value as a string; the existing
		// setTextColumns setter passes it through without coercion.
		// What matters here is that *only* the touched leaf is
		// written, not the type of the value.
		expect( lastCall ).toEqual( {
			typography: { textColumns: '2' },
		} );
		// Critically: lineHeight (which only exists in inheritedValue)
		// must NOT appear in the local payload.
		expect( lastCall.typography ).not.toHaveProperty( 'lineHeight' );
	} );

	it( 'returns to placeholder rendering after a local override is reset', () => {
		// Reset clears the local attribute so the inherited value
		// re-surfaces via placeholder. We simulate the reset by
		// re-rendering with `value` cleared (the same effect
		// `resetTextColumns` produces by setting the leaf to
		// `undefined`).
		const inheritedValue = {
			typography: { textColumns: 3 },
		};

		const { rerender } = renderPanel( {
			value: { typography: { textColumns: 5 } },
			inheritedValue,
		} );

		// See locally-set value first.
		expect( screen.getByLabelText( /columns/i ) ).toHaveValue( 5 );
		expect( screen.getByLabelText( /columns/i ) ).not.toHaveAttribute(
			'placeholder'
		);

		// Reset: local value cleared.
		rerender(
			<TypographyPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		// Placeholder is back; local value is gone.
		const columnsInput = screen.getByLabelText( /columns/i );
		expect( columnsInput ).toHaveValue( null );
		expect( columnsInput ).toHaveAttribute( 'placeholder', '3' );
	} );

	it( 'renders a locally-set numeric leaf as the value, with no placeholder, even when `inheritedValue` also defines it', () => {
		// Local values remain the source of truth when both local and
		// inherited values are present.
		const inheritedValue = {
			typography: { lineHeight: '2.2' },
		};
		const value = {
			typography: { lineHeight: '1.4' },
		};

		renderPanel( { value, inheritedValue } );

		const lineHeightInput = screen.getByLabelText( /line height/i );
		expect( lineHeightInput ).toHaveValue( 1.4 );
	} );

	it( 'renders a unit-string leaf from `inheritedValue` as the control value when `value` is empty', () => {
		// LetterSpacingControl uses the local-then-inherited pattern: the
		// inherited value is rendered as the control's value (so the unit
		// parses from it rather than sitting behind a default px unit) and an
		// inherited-value class hook marks it at-rest. It is only committed to
		// local on user change.
		const inheritedValue = {
			typography: { letterSpacing: '0.5px' },
		};

		renderPanel( { inheritedValue } );

		const letterSpacingInput = screen.getByLabelText( /letter spacing/i );
		expect( letterSpacingInput ).toHaveValue( 0.5 );
		// The placeholder carries only the numeric portion of the inherited
		// value; the unit selector reflects the inherited unit separately, so
		// the raw unit string ("0.5px") must never leak into the placeholder.
		expect( letterSpacingInput ).toHaveAttribute( 'placeholder', '0.5' );
		expect( letterSpacingInput ).not.toHaveAttribute(
			'placeholder',
			'0.5px'
		);
	} );

	it( 'renders a locally-set unit-string leaf as the value, with no placeholder, even when `inheritedValue` also defines it', () => {
		const inheritedValue = {
			typography: { letterSpacing: '0.5px' },
		};
		const value = {
			typography: { letterSpacing: '2px' },
		};

		renderPanel( { value, inheritedValue } );

		const letterSpacingInput = screen.getByLabelText( /letter spacing/i );
		expect( letterSpacingInput ).toHaveValue( 2 );
		expect( letterSpacingInput ).not.toHaveAttribute( 'placeholder' );
	} );

	it( 'value for one input does not leak when other inputs are committed', () => {
		// A locally-set lineHeight should not affect the inherited value
		// rendering for letterSpacing, and vice versa. Each control's
		// local/inherited resolution is computed independently from its own
		// leaf path.
		const inheritedValue = {
			typography: { lineHeight: '1.7', letterSpacing: '0.5px' },
		};
		const value = {
			typography: { lineHeight: '1.4' },
		};

		renderPanel( { value, inheritedValue } );

		// lineHeight: locally-set, not at-rest.
		const lineHeightInput = screen.getByLabelText( /line height/i );
		expect( lineHeightInput ).toHaveValue( 1.4 );

		// letterSpacing: not locally set, shows the inherited value at rest.
		const letterSpacingInput = screen.getByLabelText( /letter spacing/i );
		expect( letterSpacingInput ).toHaveValue( 0.5 );
	} );

	it( 'falls back to `value` when `inheritedValue` is omitted (pre-feature behaviour is preserved)', () => {
		// The `inheritedValue = value` default keeps call sites that
		// have not yet opted into separate inherited data on the existing
		// code path: no placeholder, no local-value regression.
		renderPanel( { value: { typography: { lineHeight: '1.9' } } } );

		expect( screen.getByLabelText( /line height/i ) ).toHaveValue( 1.9 );
	} );

	it( 'renders nothing for a leaf when both `value` and `inheritedValue` omit it', () => {
		renderPanel( { inheritedValue: {} } );

		// An empty NumberControl input has no `value` attribute applied;
		// RTL returns `null` (not `0`, not the empty string) for that case.
		expect( screen.getByLabelText( /line height/i ) ).toHaveValue( null );
	} );

	it( 'accepts a `var:preset|font-size|…` leaf in `inheritedValue` without throwing', () => {
		// This verifies the panel accepts preset-shaped inherited values
		// at its prop boundary and renders the Font size control. The
		// decoded value flows through the panel's internal `decodeValue`
		// pipe into `FontSizePicker`; the visible representation of a
		// selected preset is owned by that component and is not part of
		// the `inheritedValue` contract.
		const inheritedValue = {
			typography: { fontSize: 'var:preset|font-size|large' },
		};

		expect( () => {
			renderPanel( { inheritedValue } );
		} ).not.toThrow();

		// The Font size ToolsPanelItem label is rendered in the DOM.
		expect( screen.getAllByText( /font size/i ).length ).toBeGreaterThan(
			0
		);
	} );

	describe( 'ToggleGroup-style controls (textDecoration, writingMode, textTransform, textAlign)', () => {
		it( 'preselects the inherited textDecoration option', async () => {
			const inheritedValue = {
				typography: { textDecoration: 'underline' },
			};

			await renderPanelAndSettle( { inheritedValue } );

			// The inherited option is rendered as the pressed one.
			// `TextDecorationControl` uses `isDeselectable=true` so the
			// option element is a `<button aria-pressed="true">` rather
			// than an Ariakit Radio with `aria-checked`.
			expect(
				screen.getByRole( 'button', {
					name: /underline/i,
					pressed: true,
				} )
			).toBeInTheDocument();
		} );

		it( 'mounting an at-rest ToggleGroup does not call onChange (display-without-commit)', async () => {
			// The display-without-commit invariant: rendering an
			// at-rest control with an inherited preselection must
			// never invoke the parent `onChange`. Otherwise the act
			// of opening the inspector would silently commit every
			// inherited value into the local block attributes.
			const onChange = jest.fn();
			const inheritedValue = {
				typography: {
					textDecoration: 'underline',
					writingMode: 'horizontal-tb',
					textTransform: 'uppercase',
					textAlign: 'center',
					fontStyle: 'italic',
					fontWeight: '700',
					fontFamily: 'Georgia, serif',
				},
			};

			await renderPanelAndSettle( {
				inheritedValue,
				settings: settingsWithFonts,
				onChange,
			} );

			expect( onChange ).not.toHaveBeenCalled();
		} );

		it( 'activating the at-rest preselected option commits the inherited value to local', async () => {
			// When the user explicitly activates the already-preselected
			// at-rest option (Space/Enter/click), we treat that as the
			// "accept this inherited value" affordance and commit the
			// inherited value to the local payload. The interceptor
			// bypasses the inner ToggleGroupControl's equality
			// short-circuit which would otherwise emit `undefined`.
			const user = userEvent.setup();
			const onChange = jest.fn();
			const inheritedValue = {
				typography: { textDecoration: 'underline' },
			};

			await renderPanelAndSettle( { inheritedValue, onChange } );

			// Click the already-preselected "Underline" option (a
			// button under `isDeselectable` ToggleGroupControl).
			const underline = screen.getByRole( 'button', {
				name: /underline/i,
				pressed: true,
			} );
			await user.click( underline );

			expect( onChange ).toHaveBeenCalled();
			const lastCall = onChange.mock.calls.at( -1 )[ 0 ];
			expect( lastCall ).toEqual( {
				typography: { textDecoration: 'underline' },
			} );
		} );

		it( 'renders a locally-set ToggleGroup value, not the inherited one', async () => {
			// Regression guard: when the user has committed a local
			// value, the panel must render that local value, not the
			// inherited value. This guards against losing local writes when
			// rendering with inherited data.
			const inheritedValue = {
				typography: { textDecoration: 'underline' },
			};
			const value = {
				typography: { textDecoration: 'line-through' },
			};

			await renderPanelAndSettle( {
				value,
				inheritedValue,
			} );

			// The locally-set option is the one currently pressed.
			const pressed = screen.getByRole( 'button', {
				pressed: true,
				name: /strikethrough/i,
			} );
			expect( pressed ).toBeInTheDocument();
		} );
	} );

	describe( 'TextIndent (input archetype)', () => {
		it( 'renders an inherited textIndent as the control value when local is unset', async () => {
			const inheritedValue = {
				typography: { textIndent: '2rem' },
			};

			await renderPanelAndSettle( { inheritedValue } );

			// `TextIndentControl` in `withSlider` mode renders both a
			// UnitControl number input AND a RangeControl slider with
			// the same label, so we target the spinbutton role to
			// pick the UnitControl input specifically. The inherited
			// value is rendered as the control's value (parsed quantity),
			// so the unit selector reflects the inherited unit and the
			// stepper starts from it; it is committed to local only on
			// user change.
			const indentInput = screen.getByRole( 'spinbutton', {
				name: /line indent/i,
			} );
			expect( indentInput ).toHaveValue( 2 );
		} );

		it( 'renders a locally-set textIndent as the value, with no placeholder', async () => {
			const inheritedValue = {
				typography: { textIndent: '2rem' },
			};
			const value = {
				typography: { textIndent: '4rem' },
			};

			await renderPanelAndSettle( { value, inheritedValue } );

			const indentInput = screen.getByRole( 'spinbutton', {
				name: /line indent/i,
			} );
			expect( indentInput ).toHaveValue( 4 );
			expect( indentInput ).not.toHaveAttribute( 'placeholder' );
		} );
	} );

	describe( 'Font appearance (composite ToggleGroup-like select)', () => {
		it( 'mounting an at-rest font appearance does not call onChange (display-without-commit)', async () => {
			const onChange = jest.fn();
			const inheritedValue = {
				typography: { fontStyle: 'italic', fontWeight: '700' },
			};

			await renderPanelAndSettle( {
				inheritedValue,
				settings: settingsWithFonts,
				onChange,
			} );

			expect( onChange ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'FontFamily (CustomSelect archetype)', () => {
		it( 'mounting an at-rest font family does not call onChange (display-without-commit)', async () => {
			const onChange = jest.fn();
			const inheritedValue = {
				typography: { fontFamily: 'Georgia, serif' },
			};

			await renderPanelAndSettle( {
				inheritedValue,
				settings: settingsWithFonts,
				onChange,
			} );

			expect( onChange ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'preset decode + explicit-empty in panel', () => {
		// These tests cover preset decoding and explicit-empty values at
		// the panel render boundary.

		it( 'decodes a preset fontSize for placeholder display, never leaking the raw preset string', () => {
			const inheritedValue = {
				typography: { fontSize: 'var:preset|font-size|large' },
			};

			const { container } = renderPanel( { inheritedValue } );

			// The decoded human-readable value (`24px`, from the
			// `large` preset in `baseSettings`) is what reaches the
			// rendered DOM; the raw `var:preset|...` form must not
			// appear in any text, value, or placeholder.
			expect( container.innerHTML ).not.toContain(
				'var:preset|font-size|large'
			);
			expect( container.innerHTML ).not.toContain(
				'var(--wp--preset--font-size--large)'
			);
		} );

		it.each( [ '', null ] )(
			'does not render the at-rest placeholder cue when inheritedValue.typography.lineHeight is explicit-empty (%p)',
			( emptyValue ) => {
				// Note on `{}` empty-object: the resolver
				// (`resolveStyle` →
				// `pickLayerRootContribution`) drops `{}` at the
				// layer-merge stage, so the panel never receives a
				// `{}` leaf in production (asserted at the helper
				// level by `preset-round-trip.js` and at the resolver
				// level by `resolve-style.ts`'s
				// `explicit-empty normalization` describe). The
				// panel-level guard only needs to defend against
				// `''` and `null` leaves, which can flow through
				// when the GS payload itself contains them at any
				// layer.
				const inheritedValue = {
					typography: { lineHeight: emptyValue },
				};

				renderPanel( { inheritedValue } );

				const lineHeightInput = screen.getByLabelText( /line height/i );
				expect( lineHeightInput ).toHaveValue( null );
				// The explicit-empty inherited leaf is not surfaced as an
				// inherited placeholder; `LineHeightControl` falls back to its
				// own `BASE_DEFAULT_VALUE` (1.5) default placeholder instead.
				expect( lineHeightInput ).toHaveAttribute(
					'placeholder',
					'1.5'
				);
			}
		);
	} );

	describe( 'FontSize (preset picker + custom-size input)', () => {
		it( 'mounting an at-rest font size does not call onChange (display-without-commit)', async () => {
			const onChange = jest.fn();
			const inheritedValue = {
				typography: { fontSize: 'var:preset|font-size|large' },
			};

			await renderPanelAndSettle( { inheritedValue, onChange } );

			expect( onChange ).not.toHaveBeenCalled();
		} );
	} );

	it( 'treats local zero values as local overrides instead of inherited placeholders', () => {
		const inheritedValue = {
			typography: { lineHeight: '2', textColumns: 3 },
		};
		const value = {
			typography: { lineHeight: 0, textColumns: 0 },
		};

		renderPanel( { value, inheritedValue } );

		const lineHeightInput = screen.getByLabelText( /line height/i );
		expect( lineHeightInput ).toHaveValue( 0 );
		// The inherited line height ('2') must not leak in as a placeholder;
		// `LineHeightControl`'s own default (1.5) may remain, but the value is
		// the local zero override.
		expect( lineHeightInput ).not.toHaveAttribute( 'placeholder', '2' );

		const columnsInput = screen.getByLabelText( /columns/i );
		expect( columnsInput ).toHaveValue( 0 );
		expect( columnsInput ).not.toHaveAttribute( 'placeholder' );

		// Both zero values are local overrides, so each control surfaces the
		// accessible reset-to-inherited affordance.
		expect(
			screen.getAllByRole( 'button', {
				name: /reset to inherited value/i,
			} )
		).toHaveLength( 2 );
	} );
} );

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

// Helper: open the text Color dropdown and return the rendered swatches.
async function openTextColorDropdown() {
	await click(
		screen.getByRole( 'button', { name: /Color/, expanded: false } )
	);
	// `findAllByRole` waits for the Popover/portal content to appear.
	return screen.findAllByRole( 'option' );
}

describe( 'TypographyPanel — duplicate-hex preset slug identity', () => {
	it( 'commits the inherited preset slug when accepting the preselected inherited color', async () => {
		const onChange = jest.fn();

		await renderAriakit(
			<TypographyPanel
				value={ {} }
				inheritedValue={ {
					color: { text: 'var:preset|color|dark-text' },
				} }
				settings={ DUPLICATE_PALETTE_SETTINGS }
				panelId="test"
				onChange={ onChange }
			/>
		);

		const swatches = await openTextColorDropdown();
		// swatch[1] ('Dark Text') is the preselected inherited option;
		// activating it is the "accept inherited value" gesture. The commit
		// must carry the inherited slug, not re-encode the shared #000 hex
		// to whichever duplicate appears first in the palette.
		await click( swatches[ 1 ] );

		const result = onChange.mock.calls[ 0 ][ 0 ];
		expect( result?.color?.text ).toBe( 'var:preset|color|dark-text' );
	} );

	it( 'marks only the local preset as selected when another preset shares its hex', async () => {
		await renderAriakit(
			<TypographyPanel
				value={ { color: { text: 'var:preset|color|dark-text' } } }
				settings={ DUPLICATE_PALETTE_SETTINGS }
				panelId="test"
				onChange={ jest.fn() }
			/>
		);

		// swatch[0] = 'Dark Background', swatch[1] = 'Dark Text'. Selection
		// must follow the stored slug; matching by hex would mark both.
		const swatches = await openTextColorDropdown();
		expect( swatches[ 1 ] ).toHaveAttribute( 'aria-selected', 'true' );
		expect( swatches[ 0 ] ).toHaveAttribute( 'aria-selected', 'false' );
	} );
} );

describe( 'TypographyPanel — setTextColor link sync', () => {
	it( 'syncs the link color when text and link share the same raw preset reference', async () => {
		const onChange = jest.fn();
		const sharedRef = 'var:preset|color|dark-background';

		await renderAriakit(
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

		await renderAriakit(
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

	it( 'preserves a deliberately-set local link color when the text color changes and nothing is inherited', async () => {
		// Regression: with a theme that inherits no link color, a link
		// color the user set on the block instance must survive a
		// subsequent text color change instead of being overwritten to
		// track the text color.
		const onChange = jest.fn();

		await renderAriakit(
			<TypographyPanel
				value={ {
					elements: {
						link: {
							color: { text: 'var:preset|color|dark-text' },
						},
					},
				} }
				inheritedValue={ {} }
				settings={ DUPLICATE_PALETTE_SETTINGS }
				panelId="test"
				onChange={ onChange }
			/>
		);

		const swatches = await openTextColorDropdown();
		// swatch[0] = 'dark-background'
		await click( swatches[ 0 ] );

		const result = onChange.mock.calls[ 0 ][ 0 ];
		expect( result?.color?.text ).toBe(
			'var:preset|color|dark-background'
		);
		// The deliberately-set local link color is untouched.
		expect( result?.elements?.link?.color?.text ).toBe(
			'var:preset|color|dark-text'
		);
	} );

	it( 'keeps a local link color tracking when it currently matches the local text color', async () => {
		// When the local link color equals the local text color it is
		// still tracking, so a text color change carries the link along.
		const onChange = jest.fn();
		const sharedRef = 'var:preset|color|blue';
		const distinctPaletteSettings = {
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

		await renderAriakit(
			<TypographyPanel
				value={ {
					color: { text: sharedRef },
					elements: { link: { color: { text: sharedRef } } },
				} }
				inheritedValue={ {} }
				settings={ distinctPaletteSettings }
				panelId="test"
				onChange={ onChange }
			/>
		);

		const swatches = await openTextColorDropdown();
		// swatch[1] = 'red'
		await click( swatches[ 1 ] );

		const result = onChange.mock.calls[ 0 ][ 0 ];
		expect( result?.color?.text ).toBe( 'var:preset|color|red' );
		// Link follows because it was still tracking the text color.
		expect( result?.elements?.link?.color?.text ).toBe(
			'var:preset|color|red'
		);
	} );
} );

describe( 'TypographyPanel layout className preserved regardless of inheritance indicators', () => {
	const inheritedValue = {
		typography: { lineHeight: '1.5', letterSpacing: '1px' },
	};

	const getItem = ( name ) => {
		const control = screen.getByRole( 'spinbutton', { name } );
		// The layout class sits on the wrapping ToolsPanelItem, which has no role.
		// eslint-disable-next-line testing-library/no-node-access
		return control.closest( '.components-tools-panel-item' );
	};

	it( 'keeps the single-column layout class when showInheritanceLabelIndicators is false (regression)', () => {
		renderPanel( {
			showInheritanceLabelIndicators: false,
			value: {},
			inheritedValue,
		} );

		const lineHeightItem = getItem( /line height/i );
		const letterSpacingItem = getItem( /letter spacing/i );

		expect( lineHeightItem ).toHaveClass( 'single-column' );
		expect( letterSpacingItem ).toHaveClass( 'single-column' );

		expect( lineHeightItem ).not.toHaveClass(
			'is-inherited-from-global-styles'
		);
		expect( letterSpacingItem ).not.toHaveClass(
			'is-inherited-from-global-styles'
		);
	} );

	it( 'folds the single-column layout class together with the inherited treatment when indicators are on', () => {
		renderPanel( {
			showInheritanceLabelIndicators: true,
			value: {},
			inheritedValue,
		} );

		const lineHeightItem = getItem( /line height/i );
		const letterSpacingItem = getItem( /letter spacing/i );

		expect( lineHeightItem ).toHaveClass( 'single-column' );
		expect( lineHeightItem ).toHaveClass(
			'is-inherited-from-global-styles'
		);
		expect( letterSpacingItem ).toHaveClass( 'single-column' );
		expect( letterSpacingItem ).toHaveClass(
			'is-inherited-from-global-styles'
		);
	} );
} );
