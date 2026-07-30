/* eslint jest/expect-expect: ["warn", { "assertFunctionNames": ["expect", "expectLocalOverride", "expectPlaceholderState"] }] */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DimensionsPanel from '../dimensions-panel';

// The inheritance treatment sits behind the
// `gutenberg-global-styles-inheritance-ui` experiment. Turn it on so these
// tests exercise the inheriting path.
beforeEach( () => {
	window.__experimentalGlobalStylesInheritanceUI = true;
} );

afterEach( () => {
	delete window.__experimentalGlobalStylesInheritanceUI;
} );

// `AspectRatioTool` reads its option list from the block-editor data
// store via `useSettings`. Mock that hook so the tests can render the
// full set of inherited and selectable ratios without spinning up a
// store registry. Per-call resolution lets the same mock answer all
// of the paths the tool requests on a single render.
jest.mock( '../../use-settings', () => {
	const actual = jest.requireActual( '../../use-settings' );
	return {
		...actual,
		useSettings: jest.fn( ( ...paths ) =>
			paths.map( ( path ) => {
				switch ( path ) {
					case 'dimensions.aspectRatios.default':
						return [
							{ name: 'Square', slug: 'square', ratio: '1' },
							{
								name: 'Standard',
								slug: 'standard',
								ratio: '4/3',
							},
							{ name: 'Wide', slug: 'wide', ratio: '16/9' },
						];
					case 'dimensions.aspectRatios.theme':
						return [];
					case 'dimensions.defaultAspectRatios':
						return true;
					case 'dimensions.dimensionSizes':
						return undefined;
					case 'spacing.units':
						return [ '%', 'px', 'em', 'rem', 'vh', 'vw' ];
					// `useSpacingSizes` reads these for SpacingSizesControl.
					// The spacing slider tests rely on them being populated;
					// other tests don't render SpacingSizesControl, so the
					// slider hook doesn't reach this path for them.
					case 'spacing.spacingSizes.custom':
						return [];
					case 'spacing.spacingSizes.theme':
						return [];
					case 'spacing.spacingSizes.default':
						return [
							{ name: 'Small', slug: '20', size: '12px' },
							{ name: 'Medium', slug: '40', size: '24px' },
							{ name: 'Large', slug: '60', size: '48px' },
						];
					case 'spacing.defaultSpacingSizes':
						return true;
					default:
						return undefined;
				}
			} )
		),
	};
} );

/**
 * Tests for inherited values in `DimensionsPanel`.
 *
 * The control's `value` prop reads from local `value` only; inherited values
 * are surfaced through placeholders or at-rest selected options when local
 * paths are empty. The wrapping `ToolsPanelItem` carries the inherited or
 * local-override class hooks for label-level treatment.
 */

const baseSettings = {
	layout: {
		contentSize: '600px',
		wideSize: '1100px',
	},
	spacing: {
		blockGap: true,
		padding: true,
		margin: true,
		units: [ 'px', 'em', 'rem' ],
	},
};

const settingsWithDimensions = {
	...baseSettings,
	dimensions: {
		minHeight: true,
		height: true,
		minWidth: true,
		width: true,
		aspectRatio: true,
		aspectRatios: {
			default: [
				{ name: 'Square', slug: 'square', ratio: '1' },
				{ name: 'Standard', slug: 'standard', ratio: '4/3' },
				{ name: 'Wide', slug: 'wide', ratio: '16/9' },
			],
		},
		defaultAspectRatios: true,
	},
};

const settingsWithSpacingPresets = {
	...baseSettings,
	spacing: {
		...baseSettings.spacing,
		spacingSizes: {
			default: [
				{ name: 'Small', slug: '20', size: '12px' },
				{ name: 'Medium', slug: '40', size: '24px' },
				{ name: 'Large', slug: '60', size: '48px' },
			],
		},
		defaultSpacingSizes: true,
	},
};

// Render helper that fills in the boilerplate props every test repeats.
function renderPanel( props ) {
	return render(
		<DimensionsPanel
			onChange={ () => {} }
			panelId="test-panel"
			{ ...props }
		/>
	);
}

// A local override surfaces the accessible reset-to-inherited affordance, so
// assert on that rather than the label's CSS class hook.
function expectLocalOverride() {
	expect(
		screen.getByRole( 'button', {
			name: /reset to inherited value/i,
		} )
	).toBeInTheDocument();
}

// Asserts the placeholder treatment for a control. A control can inherit a
// value while showing no placeholder when the inherited sides differ
// (BoxControl cannot render a per-side placeholder). Kept as a helper so the
// branch isn't a conditional `expect` in the test body (which
// `jest/no-conditional-expect` disallows).
function expectPlaceholderState( el, placeholder ) {
	if ( placeholder ) {
		expect( el ).toHaveAttribute( 'placeholder', placeholder );
	} else {
		expect( el ).not.toHaveAttribute( 'placeholder' );
	}
}

// `getByLabelText` for the DimensionControl archetype matches both the inner
// UnitControl input and the sibling RangeControl slider, so filter to the
// text input element by class.
const getDimensionInput = ( label ) =>
	screen
		.getAllByLabelText( label )
		.find( ( el ) =>
			el.classList.contains( 'components-input-control__input' )
		);

const getPaddingAllSides = () =>
	within( screen.getByRole( 'group', { name: /Padding/ } ) ).getByRole(
		'textbox',
		{ name: 'All sides' }
	);

const getPaddingSliders = () =>
	screen
		.getAllByRole( 'slider' )
		.filter( ( s ) =>
			/padding/i.test( s.getAttribute( 'aria-label' ) || '' )
		);

describe( 'DimensionsPanel — per-control placeholder pattern', () => {
	describe( 'layout content width', () => {
		it( 'renders an inherited contentSize as the control value when `value` is empty', () => {
			renderPanel( {
				value: {},
				inheritedValue: { layout: { contentSize: '720px' } },
				settings: baseSettings,
				includeLayoutControls: true,
			} );

			const contentInput = screen.getByLabelText( /content width/i );
			// The inherited value is rendered as the control value (so the
			// unit parses from it) and marked at-rest, with only the numeric
			// portion echoed as the placeholder; the raw unit must not leak in.
			expect( contentInput ).toHaveValue( 720 );
			expect( contentInput ).toHaveAttribute( 'placeholder', '720' );
			expect( contentInput ).not.toHaveAttribute(
				'placeholder',
				'720px'
			);
		} );

		it( 'renders a locally-set contentSize as the value with no placeholder', () => {
			renderPanel( {
				value: { layout: { contentSize: '900px' } },
				inheritedValue: { layout: { contentSize: '720px' } },
				settings: baseSettings,
				includeLayoutControls: true,
			} );

			const contentInput = screen.getByLabelText( /content width/i );
			expect( contentInput ).toHaveValue( 900 );
			expect( contentInput ).not.toHaveAttribute( 'placeholder' );
		} );

		it( 'renders an inherited wideSize as the control value independently of contentSize state', () => {
			renderPanel( {
				value: { layout: { contentSize: '900px' } },
				inheritedValue: {
					layout: { contentSize: '720px', wideSize: '1280px' },
				},
				settings: baseSettings,
				includeLayoutControls: true,
			} );

			// contentSize: locally-set, no placeholder.
			const contentInput = screen.getByLabelText( /content width/i );
			expect( contentInput ).toHaveValue( 900 );

			// wideSize: not locally set, rendered as the at-rest control value.
			const wideInput = screen.getByLabelText( /wide width/i );
			expect( wideInput ).toHaveValue( 1280 );
			expect( wideInput ).toHaveAttribute( 'placeholder', '1280' );
			expect( wideInput ).not.toHaveAttribute( 'placeholder', '1280px' );
		} );

		it( 'commits a local contentSize override on user input without copying any inherited value into other paths (strip-not-copy)', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			renderPanel( {
				value: {},
				inheritedValue: {
					layout: { contentSize: '720px', wideSize: '1280px' },
					spacing: { blockGap: '1.5rem' },
				},
				settings: baseSettings,
				onChange,
				includeLayoutControls: true,
			} );

			const contentInput = screen.getByLabelText( /content width/i );
			await user.type( contentInput, '800px' );

			expect( onChange ).toHaveBeenCalled();
			const lastCall = onChange.mock.calls.at( -1 )[ 0 ];

			// The committed change is local-only at the touched leaf path;
			// no inherited value (wideSize, blockGap) is copied into the
			// committed `value`.
			expect( lastCall?.layout?.contentSize ).toBeDefined();
			expect( lastCall?.layout?.wideSize ).toBeUndefined();
			expect( lastCall?.spacing?.blockGap ).toBeUndefined();
		} );
	} );

	describe( 'block spacing (single-input gap path)', () => {
		it( 'renders an inherited blockGap as placeholder when `value` is empty', () => {
			renderPanel( {
				value: {},
				inheritedValue: { spacing: { blockGap: '1.5rem' } },
				settings: baseSettings,
			} );

			const gapInput = screen.getByLabelText( /block spacing/i );
			expect( gapInput ).toHaveValue( null );
			expect( gapInput ).toHaveAttribute( 'placeholder', '1.5rem' );
		} );

		it( 'renders no placeholder for blockGap when the inherited value is the compound axial shape (single-input path can only display strings)', () => {
			// When blockGap is an object (axial split), the panel still
			// renders the single-input UnitControl path because the
			// settings here do not enable axial gap sides. The placeholder
			// must NOT surface a non-string value into a control that
			// cannot display it.
			renderPanel( {
				value: {},
				inheritedValue: {
					spacing: { blockGap: { top: '1rem', left: '0.5rem' } },
				},
				settings: baseSettings,
			} );

			const gapInput = screen.getByLabelText( /block spacing/i );
			expect( gapInput ).not.toHaveAttribute( 'placeholder' );
		} );
	} );

	describe( 'padding (BoxControl archetype)', () => {
		// In linked mode (the default when there are no local values), the
		// BoxControl renders a single "All sides" input; the placeholder
		// reaches the inner UnitControl via inputProps and the className
		// lands on the inner input wrapper for SCSS targeting.
		it.each( [
			{
				name: 'shorthand string',
				padding: '16px',
				placeholder: '16px',
			},
			{
				name: 'object with all sides equal',
				padding: {
					top: '20px',
					right: '20px',
					bottom: '20px',
					left: '20px',
				},
				placeholder: '20px',
			},
			{
				// Per-side mismatch: the single "All sides" input cannot
				// represent differing sides, so no placeholder is shown.
				name: 'object with sides that differ',
				padding: {
					top: '16px',
					right: '8px',
					bottom: '16px',
					left: '8px',
				},
				placeholder: null,
			},
			{
				// Only some sides defined (e.g. the top/bottom-only margin a
				// theme may set). No common single-string placeholder.
				name: 'object with only some sides defined',
				padding: {
					top: '16px',
					bottom: '16px',
				},
				placeholder: null,
			},
		] )(
			'renders an inherited padding $name as placeholder $placeholder when `value` is empty',
			( { padding, placeholder } ) => {
				renderPanel( {
					value: {},
					inheritedValue: { spacing: { padding } },
					settings: baseSettings,
				} );

				const paddingAllSides = getPaddingAllSides();
				expectPlaceholderState( paddingAllSides, placeholder );
			}
		);

		it( 'renders a locally-set padding shorthand as the value with no placeholder, even when `inheritedValue` also defines it', () => {
			renderPanel( {
				value: { spacing: { padding: '24px' } },
				inheritedValue: { spacing: { padding: '16px' } },
				settings: baseSettings,
			} );

			const paddingAllSides = getPaddingAllSides();
			expect( paddingAllSides ).toHaveValue( '24' );
			expect( paddingAllSides ).not.toHaveAttribute( 'placeholder' );
		} );
	} );

	// The min-dimension DimensionControls (minHeight, minWidth) use the
	// local-then-inherited pattern: the inherited value is rendered as the
	// control's value (so the unit parses from it) and marked at-rest, rather
	// than shown as a placeholder. It is only committed to local on user
	// change.
	describe.each( [
		{
			name: 'minHeight',
			leaf: 'minHeight',
			label: /minimum height/i,
			inherited: '320px',
			expected: 320,
		},
		{
			name: 'minWidth',
			leaf: 'minWidth',
			label: /minimum width/i,
			inherited: '200px',
			expected: 200,
		},
	] )(
		'DimensionControl ($name)',
		( { leaf, label, inherited, expected } ) => {
			it( 'renders an inherited value as the control value when `value` is empty', () => {
				renderPanel( {
					value: {},
					inheritedValue: { dimensions: { [ leaf ]: inherited } },
					settings: settingsWithDimensions,
				} );

				const input = getDimensionInput( label );
				expect( input ).toBeDefined();
				expect( input ).toHaveValue( expected );
				// The placeholder carries only the numeric portion of the
				// inherited value; the unit selector reflects the inherited
				// unit separately, so the raw unit string must not leak in.
				expect( input ).toHaveAttribute(
					'placeholder',
					`${ expected }`
				);
				expect( input ).not.toHaveAttribute( 'placeholder', inherited );
			} );
		}
	);

	// The plain `width` DimensionControl still uses the native-placeholder
	// pattern for its inherited value.
	describe( 'DimensionControl (width)', () => {
		it( 'renders an inherited value as placeholder when `value` is empty', () => {
			renderPanel( {
				value: {},
				inheritedValue: { dimensions: { width: '640px' } },
				settings: settingsWithDimensions,
			} );

			const input = getDimensionInput( /^width$/i );
			expect( input ).toBeDefined();
			expect( input ).toHaveValue( null );
			expect( input ).toHaveAttribute( 'placeholder', '640px' );
		} );
	} );

	describe( 'minHeight (DimensionControl)', () => {
		it( 'renders a locally-set minHeight as the value with no placeholder, even when `inheritedValue` also defines it', () => {
			renderPanel( {
				value: { dimensions: { minHeight: '480px' } },
				inheritedValue: { dimensions: { minHeight: '320px' } },
				settings: settingsWithDimensions,
			} );

			const minHeightInput = getDimensionInput( /minimum height/i );
			expect( minHeightInput ).toBeDefined();
			// PresetInputControl parses '480px' into the numeric input
			// + a unit selector; the visible input value is just the
			// numeric portion.
			expect( minHeightInput ).toHaveValue( 480 );
			expect( minHeightInput ).not.toHaveAttribute( 'placeholder' );
		} );

		it( 'does not call `onChange` on mount of an at-rest minHeight', () => {
			const onChange = jest.fn();
			renderPanel( {
				value: {},
				inheritedValue: { dimensions: { minHeight: '320px' } },
				settings: settingsWithDimensions,
				onChange,
			} );

			expect( onChange ).not.toHaveBeenCalled();
		} );

		it( 'commits a local minHeight override on user input without copying any inherited value into other paths', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			renderPanel( {
				value: {},
				inheritedValue: {
					dimensions: { minHeight: '320px', width: '640px' },
				},
				settings: settingsWithDimensions,
				onChange,
			} );

			const minHeightInput = getDimensionInput( /minimum height/i );
			expect( minHeightInput ).toBeDefined();
			await user.type( minHeightInput, '500' );

			expect( onChange ).toHaveBeenCalled();
			const lastCall = onChange.mock.calls.at( -1 )[ 0 ];

			// The committed change is local-only at the touched leaf path;
			// no other inherited dimension (width) is copied into the
			// committed `value`.
			expect( lastCall?.dimensions?.minHeight ).toBeDefined();
			expect( lastCall?.dimensions?.width ).toBeUndefined();
		} );
	} );

	describe( 'aspectRatio (native <select> archetype)', () => {
		it( 'preselects the inherited aspectRatio option as at-rest with inherited-value treatment', () => {
			renderPanel( {
				value: {},
				inheritedValue: { dimensions: { aspectRatio: '16/9' } },
				settings: settingsWithDimensions,
			} );

			const aspectSelect = screen.getByRole( 'combobox', {
				name: /aspect ratio/i,
			} );
			expect( aspectSelect ).toHaveValue( '16/9' );
		} );

		it( 'renders a locally-set aspectRatio as the selected value with the local-override hook', () => {
			renderPanel( {
				value: { dimensions: { aspectRatio: '1' } },
				inheritedValue: { dimensions: { aspectRatio: '16/9' } },
				settings: settingsWithDimensions,
			} );

			const aspectSelect = screen.getByRole( 'combobox', {
				name: /aspect ratio/i,
			} );
			expect( aspectSelect ).toHaveValue( '1' );
			// A local override now gets the same local-override flag as
			// every other control, so the inline reset button can attach.
			// The button itself is portaled and covered by the
			// InheritanceResetButton unit tests.
			expectLocalOverride();
		} );

		it( 'does not call `onChange` on mount of an at-rest aspectRatio', () => {
			const onChange = jest.fn();
			renderPanel( {
				value: {},
				inheritedValue: { dimensions: { aspectRatio: '16/9' } },
				settings: settingsWithDimensions,
				onChange,
			} );

			expect( onChange ).not.toHaveBeenCalled();
		} );

		it( 'commits a local aspectRatio override on user selection of a different option without copying any inherited value into other paths', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			renderPanel( {
				value: {},
				inheritedValue: {
					dimensions: { aspectRatio: '16/9', minHeight: '320px' },
				},
				settings: settingsWithDimensions,
				onChange,
			} );

			const aspectSelect = screen.getByRole( 'combobox', {
				name: /aspect ratio/i,
			} );
			await user.selectOptions( aspectSelect, '1' );

			expect( onChange ).toHaveBeenCalled();
			const lastCall = onChange.mock.calls.at( -1 )[ 0 ];
			expect( lastCall?.dimensions?.aspectRatio ).toBe( '1' );
			// minHeight from inheritedValue must not be copied into the
			// committed local value (strip-not-copy).
			expect( lastCall?.dimensions?.minHeight ).toBeUndefined();
		} );
	} );

	/*
	 * Regression: spacing slider stuck on inherited value
	 * ----------------------------------------------------
	 * `SpacingSizesControl` (the preset chip slider) and the axial-gap
	 * `BoxControl` have no native `placeholder` slot — the at-rest cue
	 * is the displayed `values` themselves. Previously these reads
	 * came from `inheritedValue` only, so when the user dragged the
	 * slider, `setPaddingValues` / `setMarginValues` / `setGapValues`
	 * wrote to local state but the `values` prop never updated and the
	 * slider appeared 'stuck'. The fix merges local-then-inherited
	 * before passing to the chip slider / axial BoxControl.
	 */
	describe( 'SpacingSizesControl (preset chip slider)', () => {
		// Each `SpacingSizesControl` slider reports its current preset
		// position via the slider's `value` attribute. The numbering
		// corresponds to the index of the active preset in the merged size
		// list (the slider's `None` zero position precedes the presets).
		it.each( [
			{
				name: 'padding',
				leaf: 'padding',
				match: /padding/i,
				// Local Medium (slug 40) → index 2.
				local: 'var:preset|spacing|40',
				sliderValue: '2',
				valueText: 'Medium',
			},
			{
				name: 'margin',
				leaf: 'margin',
				match: /margin/i,
				// Local Large (slug 60) → index 3.
				local: 'var:preset|spacing|60',
				sliderValue: '3',
				valueText: 'Large',
			},
		] )(
			'($name) reflects the local value when set, ignoring the inherited fallback',
			( { leaf, match, local, sliderValue, valueText } ) => {
				renderPanel( {
					value: { spacing: { [ leaf ]: local } },
					inheritedValue: {
						spacing: {
							[ leaf ]: leaf === 'padding' ? '10px' : '8px',
						},
					},
					settings: settingsWithSpacingPresets,
				} );

				const sliders = screen
					.getAllByRole( 'slider' )
					.filter( ( s ) =>
						match.test( s.getAttribute( 'aria-label' ) || '' )
					);
				expect( sliders.length ).toBeGreaterThan( 0 );
				expect(
					sliders.every( ( s ) => s.value === sliderValue )
				).toBe( true );
				expect(
					sliders.every(
						( s ) =>
							s.getAttribute( 'aria-valuetext' ) === valueText
					)
				).toBe( true );
			}
		);

		it( '(padding) renders the inherited value at-rest when the local path is empty', () => {
			renderPanel( {
				value: {},
				inheritedValue: {
					spacing: { padding: 'var:preset|spacing|20' },
				},
				settings: settingsWithSpacingPresets,
			} );

			// At-rest, slider tracks inherited 'Small' (slug 20) → index 1.
			const paddingSliders = getPaddingSliders();
			expect( paddingSliders.length ).toBeGreaterThan( 0 );
			expect( paddingSliders.every( ( s ) => s.value === '1' ) ).toBe(
				true
			);
		} );

		it( '(padding) commits to local on slider activation and the displayed value follows the new local value', () => {
			const { fireEvent } = require( '@testing-library/react' );

			// Controlled wrapper so we can verify the slider follows local
			// value updates after onChange writes through.
			function Wrapper() {
				const [ value, setValue ] =
					require( '@wordpress/element' ).useState( {} );
				return (
					<DimensionsPanel
						value={ value }
						inheritedValue={ {
							spacing: { padding: 'var:preset|spacing|20' },
						} }
						settings={ settingsWithSpacingPresets }
						onChange={ setValue }
						panelId="test-panel"
					/>
				);
			}

			render( <Wrapper /> );

			// At-rest the padding slider reads the inherited Small (index 1).
			const slidersBefore = getPaddingSliders();
			expect( slidersBefore[ 0 ].value ).toBe( '1' );

			// `RangeControl` listens to native `change`/`input` events on
			// its slider; setting the value and firing change is the most
			// reliable way to drive an update through RTL in jsdom.
			fireEvent.change( slidersBefore[ 0 ], { target: { value: '2' } } );

			const slidersAfter = getPaddingSliders();
			// The activated padding slider advanced from 1 → 2.
			expect( slidersAfter[ 0 ].value ).toBe( '2' );
			expect( slidersAfter[ 0 ] ).toHaveAttribute(
				'aria-valuetext',
				'Medium'
			);
		} );

		it( 'still surfaces block-sourced inherited padding on a block panel', () => {
			renderPanel( {
				value: {},
				inheritedValue: {
					spacing: {
						padding: {
							top: 'var:preset|spacing|40',
							right: 'var:preset|spacing|40',
							bottom: 'var:preset|spacing|40',
							left: 'var:preset|spacing|40',
						},
					},
				},
				settings: settingsWithSpacingPresets,
			} );

			const paddingSliders = getPaddingSliders();
			expect( paddingSliders.length ).toBeGreaterThan( 0 );
			// Inherited Medium (slug 40) lands at preset index 2 (None=0,
			// Small=1, Medium=2). All sliders should reflect that.
			expect( paddingSliders.every( ( s ) => s.value === '2' ) ).toBe(
				true
			);
		} );
	} );

	describe( 'local zero values (override, not inherited placeholder)', () => {
		it( 'treats a local numeric zero minHeight as a local override instead of inherited placeholder', () => {
			renderPanel( {
				value: { dimensions: { minHeight: 0 } },
				inheritedValue: { dimensions: { minHeight: '200px' } },
				settings: settingsWithDimensions,
			} );

			const minHeightInput = screen
				.getAllByLabelText( /minimum height/i )
				.find(
					( input ) =>
						input.tagName === 'INPUT' && input.value === '0'
				);
			expect( minHeightInput ).toBeDefined();
			expect( minHeightInput ).toHaveValue( 0 );
			expect( minHeightInput ).not.toHaveAttribute( 'placeholder' );
			expectLocalOverride();
		} );

		it( 'treats a local zero block gap as a local value instead of inherited placeholder', () => {
			renderPanel( {
				value: { spacing: { blockGap: 0 } },
				inheritedValue: { spacing: { blockGap: '2rem' } },
				settings: baseSettings,
			} );

			const gapInput = screen.getByLabelText( /block spacing/i );
			expect( gapInput ).toHaveValue( 0 );
			expect( gapInput ).not.toHaveAttribute( 'placeholder' );
			expectLocalOverride();
		} );
	} );
} );
