/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import DimensionsPanel from '../dimensions-panel';

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

describe( 'DimensionsPanel — per-control placeholder pattern', () => {
	it( 'renders a unit-string contentSize from `inheritedValue` as placeholder when `value` is empty', () => {
		const inheritedValue = {
			layout: { contentSize: '720px' },
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
				includeLayoutControls
			/>
		);

		const contentInput = screen.getByLabelText( /content width/i );
		expect( contentInput ).toHaveValue( null );
		expect( contentInput ).toHaveAttribute( 'placeholder', '720px' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			contentInput.closest( '.is-inherited-from-global-styles' )
		).not.toBeNull();
	} );

	it( 'renders a locally-set contentSize as the value with no placeholder', () => {
		const inheritedValue = {
			layout: { contentSize: '720px' },
		};
		const value = {
			layout: { contentSize: '900px' },
		};

		render(
			<DimensionsPanel
				value={ value }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
				includeLayoutControls
			/>
		);

		const contentInput = screen.getByLabelText( /content width/i );
		expect( contentInput ).toHaveValue( 900 );
		expect( contentInput ).not.toHaveAttribute( 'placeholder' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			contentInput.closest( '.is-inherited-from-global-styles' )
		).toBeNull();
	} );

	it( 'renders an inherited wideSize as placeholder independently of contentSize state', () => {
		const inheritedValue = {
			layout: { contentSize: '720px', wideSize: '1280px' },
		};
		const value = {
			layout: { contentSize: '900px' },
		};

		render(
			<DimensionsPanel
				value={ value }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
				includeLayoutControls
			/>
		);

		// contentSize: locally-set, no placeholder.
		const contentInput = screen.getByLabelText( /content width/i );
		expect( contentInput ).toHaveValue( 900 );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			contentInput.closest( '.is-inherited-from-global-styles' )
		).toBeNull();

		// wideSize: not locally set, placeholder active.
		const wideInput = screen.getByLabelText( /wide width/i );
		expect( wideInput ).toHaveValue( null );
		expect( wideInput ).toHaveAttribute( 'placeholder', '1280px' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			wideInput.closest( '.is-inherited-from-global-styles' )
		).not.toBeNull();
	} );

	it( 'renders an inherited blockGap (single-input path) as placeholder when `value` is empty', () => {
		const inheritedValue = {
			spacing: { blockGap: '1.5rem' },
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		const gapInput = screen.getByLabelText( /block spacing/i );
		expect( gapInput ).toHaveValue( null );
		expect( gapInput ).toHaveAttribute( 'placeholder', '1.5rem' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			gapInput.closest( '.is-inherited-from-global-styles' )
		).not.toBeNull();
	} );

	it( 'renders no placeholder for blockGap when the inherited value is the compound axial shape (single-input path can only display strings)', () => {
		// When blockGap is an object (axial split), the panel still
		// renders the single-input UnitControl path because the
		// settings here do not enable axial gap sides. The placeholder
		// must NOT surface a non-string value into a control that
		// cannot display it.
		const inheritedValue = {
			spacing: { blockGap: { top: '1rem', left: '0.5rem' } },
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		const gapInput = screen.getByLabelText( /block spacing/i );
		expect( gapInput ).not.toHaveAttribute( 'placeholder' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			gapInput.closest( '.is-inherited-from-global-styles' )
		).toBeNull();
	} );

	it( 'commits a local contentSize override on user input without copying any inherited value into other paths (strip-not-copy)', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		const inheritedValue = {
			layout: { contentSize: '720px', wideSize: '1280px' },
			spacing: { blockGap: '1.5rem' },
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ onChange }
				panelId="test-panel"
				includeLayoutControls
			/>
		);

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

	it( 'renders an inherited padding shorthand as placeholder on the BoxControl when `value` is empty', () => {
		const inheritedValue = {
			spacing: { padding: '16px' },
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		// In linked mode (the default when there are no local values),
		// the BoxControl renders a single "All sides" input. Querying
		// by the role-derived label confirms the placeholder reaches
		// the inner UnitControl via inputProps and the className lands
		// on the inner input wrapper for SCSS targeting.
		const paddingGroup = screen.getByRole( 'group', { name: /Padding/ } );
		const paddingAllSides = within( paddingGroup ).getByRole( 'textbox', {
			name: 'All sides',
		} );
		expect( paddingAllSides ).toHaveValue( '' );
		expect( paddingAllSides ).toHaveAttribute( 'placeholder', '16px' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			paddingAllSides.closest( '.is-inherited-from-global-styles' )
		).not.toBeNull();
	} );

	it( 'renders an inherited padding object with all sides equal as placeholder on the BoxControl', () => {
		const inheritedValue = {
			spacing: {
				padding: {
					top: '20px',
					right: '20px',
					bottom: '20px',
					left: '20px',
				},
			},
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		const paddingGroup = screen.getByRole( 'group', { name: /Padding/ } );
		const paddingAllSides = within( paddingGroup ).getByRole( 'textbox', {
			name: 'All sides',
		} );
		expect( paddingAllSides ).toHaveAttribute( 'placeholder', '20px' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			paddingAllSides.closest( '.is-inherited-from-global-styles' )
		).not.toBeNull();
	} );

	it( 'suppresses the BoxControl placeholder when inherited padding sides differ from each other (per-side mismatch is deferred)', () => {
		const inheritedValue = {
			spacing: {
				padding: {
					top: '16px',
					right: '8px',
					bottom: '16px',
					left: '8px',
				},
			},
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		const paddingGroup = screen.getByRole( 'group', { name: 'Padding' } );
		const paddingAllSides = within( paddingGroup ).getByRole( 'textbox', {
			name: 'All sides',
		} );
		expect( paddingAllSides ).not.toHaveAttribute( 'placeholder' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			paddingAllSides.closest( '.is-inherited-from-global-styles' )
		).toBeNull();
	} );

	it( 'renders a locally-set padding shorthand as the value with no placeholder, even when `inheritedValue` also defines it', () => {
		const inheritedValue = {
			spacing: { padding: '16px' },
		};
		const value = {
			spacing: { padding: '24px' },
		};

		render(
			<DimensionsPanel
				value={ value }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		const paddingGroup = screen.getByRole( 'group', { name: 'Padding' } );
		const paddingAllSides = within( paddingGroup ).getByRole( 'textbox', {
			name: 'All sides',
		} );
		expect( paddingAllSides ).toHaveValue( '24' );
		expect( paddingAllSides ).not.toHaveAttribute( 'placeholder' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			paddingAllSides.closest( '.is-inherited-from-global-styles' )
		).toBeNull();
	} );

	// DimensionControl-based inputs (minHeight, height,
	// minWidth, width). These render the custom-value path of
	// PresetInputControl when no presets are configured.
	it( 'renders an inherited minHeight as placeholder on the DimensionControl when `value` is empty', () => {
		const inheritedValue = {
			dimensions: { minHeight: '320px' },
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ settingsWithDimensions }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		// `getByLabelText` matches both the inner UnitControl input
		// and the sibling RangeControl slider in the custom-value
		// path. Filter to the text-input element by class.
		const minHeightInput = screen
			.getAllByLabelText( /minimum height/i )
			.find( ( el ) =>
				el.classList.contains( 'components-input-control__input' )
			);
		expect( minHeightInput ).toBeDefined();
		expect( minHeightInput ).toHaveValue( null );
		expect( minHeightInput ).toHaveAttribute( 'placeholder', '320px' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			minHeightInput.closest( '.is-inherited-from-global-styles' )
		).not.toBeNull();
	} );

	it( 'renders a locally-set minHeight as the value with no placeholder, even when `inheritedValue` also defines it', () => {
		const inheritedValue = {
			dimensions: { minHeight: '320px' },
		};
		const value = {
			dimensions: { minHeight: '480px' },
		};

		render(
			<DimensionsPanel
				value={ value }
				inheritedValue={ inheritedValue }
				settings={ settingsWithDimensions }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		const minHeightInput = screen
			.getAllByLabelText( /minimum height/i )
			.find( ( el ) =>
				el.classList.contains( 'components-input-control__input' )
			);
		expect( minHeightInput ).toBeDefined();
		// PresetInputControl parses '480px' into the numeric input
		// + a unit selector; the visible input value is just the
		// numeric portion.
		expect( minHeightInput ).toHaveValue( 480 );
		expect( minHeightInput ).not.toHaveAttribute( 'placeholder' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			minHeightInput.closest( '.is-inherited-from-global-styles' )
		).toBeNull();
	} );

	it( 'renders an inherited width as placeholder on the DimensionControl when `value` is empty', () => {
		const inheritedValue = {
			dimensions: { width: '640px' },
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ settingsWithDimensions }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		const widthInput = screen
			.getAllByLabelText( /^width$/i )
			.find( ( el ) =>
				el.classList.contains( 'components-input-control__input' )
			);
		expect( widthInput ).toBeDefined();
		expect( widthInput ).toHaveValue( null );
		expect( widthInput ).toHaveAttribute( 'placeholder', '640px' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			widthInput.closest( '.is-inherited-from-global-styles' )
		).not.toBeNull();
	} );

	it( 'does not call `onChange` on mount of an at-rest minHeight', () => {
		const onChange = jest.fn();
		const inheritedValue = {
			dimensions: { minHeight: '320px' },
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ settingsWithDimensions }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'commits a local minHeight override on user input without copying any inherited value into other paths', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		const inheritedValue = {
			dimensions: { minHeight: '320px', width: '640px' },
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ settingsWithDimensions }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		const minHeightInput = screen
			.getAllByLabelText( /minimum height/i )
			.find( ( el ) =>
				el.classList.contains( 'components-input-control__input' )
			);
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

	// aspectRatio (native <select> archetype).
	it( 'preselects the inherited aspectRatio option as at-rest with inherited-value treatment', () => {
		const inheritedValue = {
			dimensions: { aspectRatio: '16/9' },
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ settingsWithDimensions }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		const aspectSelect = screen.getByRole( 'combobox', {
			name: /aspect ratio/i,
		} );
		expect( aspectSelect ).toHaveValue( '16/9' );
		// SelectControl forwards `className` to the BaseControl
		// wrapper, so the at-rest hook lands on a parent of the
		// underlying `<select>`. Using `closest` matches the same
		// idiom used elsewhere in this file for nested-input
		// archetypes.
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			aspectSelect.closest( '.is-inherited-from-global-styles' )
		).not.toBeNull();
	} );

	it( 'renders a locally-set aspectRatio as the selected value with no at-rest className', () => {
		const inheritedValue = {
			dimensions: { aspectRatio: '16/9' },
		};
		const value = {
			dimensions: { aspectRatio: '1' },
		};

		render(
			<DimensionsPanel
				value={ value }
				inheritedValue={ inheritedValue }
				settings={ settingsWithDimensions }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		const aspectSelect = screen.getByRole( 'combobox', {
			name: /aspect ratio/i,
		} );
		expect( aspectSelect ).toHaveValue( '1' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			aspectSelect.closest( '.is-inherited-from-global-styles' )
		).toBeNull();
	} );

	it( 'does not call `onChange` on mount of an at-rest aspectRatio', () => {
		const onChange = jest.fn();
		const inheritedValue = {
			dimensions: { aspectRatio: '16/9' },
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ settingsWithDimensions }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'commits a local aspectRatio override on user selection of a different option without copying any inherited value into other paths', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		const inheritedValue = {
			dimensions: { aspectRatio: '16/9', minHeight: '320px' },
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ settingsWithDimensions }
				onChange={ onChange }
				panelId="test-panel"
			/>
		);

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
	it( 'SpacingSizesControl (padding) reflects the local value when set, ignoring the inherited fallback', () => {
		const inheritedValue = {
			spacing: { padding: '10px' },
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

		render(
			<DimensionsPanel
				value={ {
					spacing: {
						padding: 'var:preset|spacing|40',
					},
				} }
				inheritedValue={ inheritedValue }
				settings={ settingsWithSpacingPresets }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		// Each `SpacingSizesControl` slider reports its current preset
		// position via the slider's `value` attribute. The numbering
		// corresponds to the index of the active preset in the merged
		// size list. With three presets and the slider's `None` zero
		// position, Medium (slug 40) lands at index 2.
		const sliders = screen.getAllByRole( 'slider' );
		const paddingSliders = sliders.filter( ( s ) =>
			/padding/i.test( s.getAttribute( 'aria-label' ) || '' )
		);
		expect( paddingSliders.length ).toBeGreaterThan( 0 );
		// Local-set Medium → preset index 2; would have been '0' (None,
		// custom-fallback) had the local value been ignored.
		expect( paddingSliders.every( ( s ) => s.value === '2' ) ).toBe( true );
		expect(
			paddingSliders.every(
				( s ) => s.getAttribute( 'aria-valuetext' ) === 'Medium'
			)
		).toBe( true );
	} );

	it( 'SpacingSizesControl (margin) reflects the local value when set, ignoring the inherited fallback', () => {
		const inheritedValue = {
			spacing: { margin: '8px' },
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

		render(
			<DimensionsPanel
				value={ {
					spacing: {
						margin: 'var:preset|spacing|60',
					},
				} }
				inheritedValue={ inheritedValue }
				settings={ settingsWithSpacingPresets }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		// Local-set Large (slug 60) → preset index 3 in the merged list.
		const sliders = screen.getAllByRole( 'slider' );
		const marginSliders = sliders.filter( ( s ) =>
			/margin/i.test( s.getAttribute( 'aria-label' ) || '' )
		);
		expect( marginSliders.length ).toBeGreaterThan( 0 );
		expect( marginSliders.every( ( s ) => s.value === '3' ) ).toBe( true );
		expect(
			marginSliders.every(
				( s ) => s.getAttribute( 'aria-valuetext' ) === 'Large'
			)
		).toBe( true );
	} );

	it( 'SpacingSizesControl (padding) renders the inherited value at-rest when the local path is empty', () => {
		const inheritedValue = {
			spacing: { padding: 'var:preset|spacing|20' },
		};
		const settingsWithSpacingPresets = {
			...baseSettings,
			spacing: {
				...baseSettings.spacing,
				spacingSizes: {
					default: [
						{ name: 'Small', slug: '20', size: '12px' },
						{ name: 'Medium', slug: '40', size: '24px' },
					],
				},
				defaultSpacingSizes: true,
			},
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				settings={ settingsWithSpacingPresets }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		// At-rest, slider tracks inherited 'Small' (slug 20) → preset
		// index 1 in the merged list.
		const sliders = screen.getAllByRole( 'slider' );
		const paddingSliders = sliders.filter( ( s ) =>
			/padding/i.test( s.getAttribute( 'aria-label' ) || '' )
		);
		expect( paddingSliders.length ).toBeGreaterThan( 0 );
		expect( paddingSliders.every( ( s ) => s.value === '1' ) ).toBe( true );
	} );

	it( 'SpacingSizesControl (padding) commits to local on slider activation and the displayed value follows the new local value', async () => {
		const { fireEvent } = require( '@testing-library/react' );
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
		const inheritedValue = {
			spacing: { padding: 'var:preset|spacing|20' },
		};

		// Controlled wrapper so we can verify the slider follows local
		// value updates after onChange writes through.
		function Wrapper() {
			const [ value, setValue ] =
				require( '@wordpress/element' ).useState( {} );
			return (
				<DimensionsPanel
					value={ value }
					inheritedValue={ inheritedValue }
					settings={ settingsWithSpacingPresets }
					onChange={ setValue }
					panelId="test-panel"
				/>
			);
		}

		render( <Wrapper /> );

		// At-rest the padding slider reads the inherited Small (preset
		// index 1).
		const slidersBefore = screen
			.getAllByRole( 'slider' )
			.filter( ( s ) =>
				/padding/i.test( s.getAttribute( 'aria-label' ) || '' )
			);
		expect( slidersBefore[ 0 ].value ).toBe( '1' );

		// `RangeControl` listens to native `change`/`input` events on
		// its slider; setting the value and firing change is the most
		// reliable way to drive an update through the React testing
		// library in jsdom.
		fireEvent.change( slidersBefore[ 0 ], { target: { value: '2' } } );

		const slidersAfter = screen
			.getAllByRole( 'slider' )
			.filter( ( s ) =>
				/padding/i.test( s.getAttribute( 'aria-label' ) || '' )
			);
		// The activated padding slider advanced from 1 → 2.
		expect( slidersAfter[ 0 ].value ).toBe( '2' );
		expect( slidersAfter[ 0 ] ).toHaveAttribute(
			'aria-valuetext',
			'Medium'
		);
	} );

	it( 'treats a local numeric zero dimension as a local override instead of inherited placeholder', () => {
		const inheritedValue = {
			dimensions: { minHeight: '200px' },
		};
		const value = {
			dimensions: { minHeight: 0 },
		};

		render(
			<DimensionsPanel
				value={ value }
				inheritedValue={ inheritedValue }
				settings={ settingsWithDimensions }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		const minHeightInputs = screen.getAllByLabelText( /minimum height/i );
		const minHeightInput = minHeightInputs.find(
			( input ) => input.tagName === 'INPUT' && input.value === '0'
		);
		expect( minHeightInput ).toBeDefined();
		expect( minHeightInput ).toHaveValue( 0 );
		expect( minHeightInput ).not.toHaveAttribute( 'placeholder' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			minHeightInput.closest( '.is-inherited-from-global-styles' )
		).toBeNull();
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			minHeightInput.closest( '.has-local-override-from-global-styles' )
		).not.toBeNull();
	} );

	it( 'treats a local zero block gap as a local value instead of inherited placeholder', () => {
		const inheritedValue = {
			spacing: { blockGap: '2rem' },
		};
		const value = {
			spacing: { blockGap: 0 },
		};

		render(
			<DimensionsPanel
				value={ value }
				inheritedValue={ inheritedValue }
				settings={ baseSettings }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		const gapInput = screen.getByLabelText( /block spacing/i );
		expect( gapInput ).toHaveValue( 0 );
		expect( gapInput ).not.toHaveAttribute( 'placeholder' );
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			gapInput.closest( '.is-inherited-from-global-styles' )
		).toBeNull();
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			gapInput.closest( '.has-local-override-from-global-styles' )
		).not.toBeNull();
	} );

	it( 'does not surface root-sourced spacing.padding as inherited on a block panel', () => {
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
		// Mirrors the Twenty Twenty-Five + WP core defaults case where
		// root-level padding is `{ top: '0px', right: 'var:preset|spacing|50',
		// bottom: '0px', left: 'var:preset|spacing|50' }` and there's no
		// block-level padding override for the block being inspected.
		const inheritedValue = {
			spacing: {
				padding: {
					top: '0px',
					right: 'var:preset|spacing|40',
					bottom: '0px',
					left: 'var:preset|spacing|40',
				},
			},
		};
		const inheritedSources = {
			'spacing.padding.top': { layer: 'root' },
			'spacing.padding.right': { layer: 'root' },
			'spacing.padding.bottom': { layer: 'root' },
			'spacing.padding.left': { layer: 'root' },
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				inheritedSources={ inheritedSources }
				settings={ settingsWithSpacingPresets }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		// The root-sourced inherited padding must not flip the
		// SpacingSizesControl into custom-value mode.
		const spinButtons = screen.queryAllByRole( 'spinbutton' );
		const paddingSpinButtons = spinButtons.filter( ( s ) =>
			/padding/i.test( s.getAttribute( 'aria-label' ) || '' )
		);
		expect( paddingSpinButtons ).toHaveLength( 0 );

		// Sliders should sit at the None preset position because no
		// inherited padding is surfaced.
		const sliders = screen.getAllByRole( 'slider' );
		const paddingSliders = sliders.filter( ( s ) =>
			/padding/i.test( s.getAttribute( 'aria-label' ) || '' )
		);
		expect( paddingSliders.length ).toBeGreaterThan( 0 );
		expect( paddingSliders.every( ( s ) => s.value === '0' ) ).toBe( true );
	} );

	it( 'still surfaces block-sourced inherited padding on a block panel', () => {
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
		const inheritedValue = {
			spacing: {
				padding: {
					top: 'var:preset|spacing|40',
					right: 'var:preset|spacing|40',
					bottom: 'var:preset|spacing|40',
					left: 'var:preset|spacing|40',
				},
			},
		};
		const inheritedSources = {
			'spacing.padding.top': { layer: 'block' },
			'spacing.padding.right': { layer: 'block' },
			'spacing.padding.bottom': { layer: 'block' },
			'spacing.padding.left': { layer: 'block' },
		};

		render(
			<DimensionsPanel
				value={ {} }
				inheritedValue={ inheritedValue }
				inheritedSources={ inheritedSources }
				settings={ settingsWithSpacingPresets }
				onChange={ () => {} }
				panelId="test-panel"
			/>
		);

		const sliders = screen.getAllByRole( 'slider' );
		const paddingSliders = sliders.filter( ( s ) =>
			/padding/i.test( s.getAttribute( 'aria-label' ) || '' )
		);
		expect( paddingSliders.length ).toBeGreaterThan( 0 );
		// Inherited Medium (slug 40) lands at preset index 2 (None=0,
		// Small=1, Medium=2). All sliders should reflect that.
		expect( paddingSliders.every( ( s ) => s.value === '2' ) ).toBe( true );
	} );
} );
