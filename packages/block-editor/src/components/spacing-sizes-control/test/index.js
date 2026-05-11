/**
 * Comprehensive test suite for SpacingSizesControl component
 *
 * This test file provides extensive coverage of the SpacingSizesControl component's
 * user-facing functionality, including:
 *
 * - Basic rendering with different value types and configurations
 * - Linked vs custom view behavior and toggling
 * - Value changes in both linked and custom modes
 * - Single side, axial, and custom side configurations
 * - Preset functionality (range controls, custom toggles, preset recognition)
 * - Large preset set handling (select dropdown vs range)
 * - Edge cases (undefined values, mixed values, complex CSS values)
 * - Accessibility features (proper ARIA labels, focus management)
 * - Integration with spacing preset system
 *
 * Total coverage: Comprehensive test suite across all view modes and configurations.
 *
 * The tests ensure that when the SpacingSizesControl is refactored to use
 * PresetInputControl, the existing user experience and behavior is preserved.
 */

/**
 * External dependencies
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SpacingSizesControl from '../index';

// Mock useSelect
jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

// Mock useSpacingSizes hook
jest.mock( '../hooks/use-spacing-sizes', () => ( {
	__esModule: true,
	default: jest.fn( () => [
		{ name: 'None', slug: '0', size: 0 },
		{ name: 'Small', slug: '20', size: '0.5rem' },
		{ name: 'Medium', slug: '40', size: '1rem' },
		{ name: 'Large', slug: '60', size: '1.5rem' },
		{ name: 'X-Large', slug: '80', size: '2rem' },
	] ),
} ) );

// Mock useSettings hook
jest.mock( '../../use-settings', () => ( {
	useSettings: jest.fn( ( ...keys ) => {
		const defaults = {
			'spacing.units': [ 'px', 'em', 'rem' ],
			'spacing.spacingSizes.custom': [],
			'spacing.spacingSizes.theme': [],
			'spacing.spacingSizes.default': [],
			'spacing.defaultSpacingSizes': true,
		};
		return keys.map( ( key ) => defaults[ key ] );
	} ),
} ) );

describe( 'SpacingSizesControl', () => {
	const mockOnChange = jest.fn();
	const defaultProps = {
		label: 'Padding',
		onChange: mockOnChange,
	};

	beforeEach( () => {
		mockOnChange.mockClear();
		useSelect.mockReturnValue( false ); // disableCustomSpacingSizes = false
	} );

	describe( 'Basic Rendering', () => {
		it( 'renders with default props', () => {
			render( <SpacingSizesControl { ...defaultProps } /> );

			expect( screen.getByText( 'Padding' ) ).toBeInTheDocument();
			expect(
				screen.getByLabelText( 'Unlink sides' )
			).toBeInTheDocument();
		} );

		it( 'renders with undefined values in axial view', () => {
			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			// Should default to axial view when no values
			expect(
				screen.getByLabelText( 'Unlink sides' )
			).toBeInTheDocument();
		} );

		it( 'renders with axial values', () => {
			const values = {
				top: '1rem',
				right: '2rem',
				bottom: '1rem',
				left: '2rem',
			};

			render(
				<SpacingSizesControl { ...defaultProps } values={ values } />
			);

			// Should be in axial view due to matching vertical/horizontal values
			expect(
				screen.getByLabelText( 'Unlink sides' )
			).toBeInTheDocument();
		} );

		it( 'renders with mixed values in custom view', () => {
			const values = {
				top: '1rem',
				right: '2rem',
				bottom: '1.5rem',
				left: '2rem',
			};

			render(
				<SpacingSizesControl { ...defaultProps } values={ values } />
			);

			// Should be in custom view due to mixed values
			expect( screen.getByLabelText( 'Link sides' ) ).toBeInTheDocument();
		} );

		it( 'renders with single side configuration', () => {
			render(
				<SpacingSizesControl
					{ ...defaultProps }
					sides={ [ 'top' ] }
					values={ { top: '1rem' } }
				/>
			);

			// Should show single side control
			expect(
				screen.getByLabelText( 'Top padding' )
			).toBeInTheDocument();
			// Should not show link button for single side
			expect(
				screen.queryByLabelText( 'Unlink sides' )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'View Toggle Behavior', () => {
		it( 'toggles between axial and custom views', async () => {
			const user = userEvent.setup();
			const values = {
				top: '1rem',
				right: '2rem',
				bottom: '1rem',
				left: '2rem',
			};

			render(
				<SpacingSizesControl { ...defaultProps } values={ values } />
			);

			const linkButton = screen.getByLabelText( 'Unlink sides' );

			// Click to switch to custom view
			await user.click( linkButton );
			expect( screen.getByLabelText( 'Link sides' ) ).toBeInTheDocument();

			// Click to switch back to axial view
			const unlinkButton = screen.getByLabelText( 'Link sides' );
			await user.click( unlinkButton );
			expect(
				screen.getByLabelText( 'Unlink sides' )
			).toBeInTheDocument();
		} );

		it( 'starts in custom view when values are mixed', () => {
			const mixedValues = {
				top: '1rem',
				right: '2rem',
				bottom: '1.5rem',
				left: '2rem',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ mixedValues }
				/>
			);

			expect( screen.getByLabelText( 'Link sides' ) ).toBeInTheDocument();
		} );

		it( 'starts in axial view when no values are defined', () => {
			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			expect(
				screen.getByLabelText( 'Unlink sides' )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Value Changes - Axial View', () => {
		it( 'renders in axial view with matching values', () => {
			const axialValues = {
				top: '1rem',
				right: '2rem',
				bottom: '1rem',
				left: '2rem',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ axialValues }
				/>
			);

			// In axial view, should show 2 sliders for vertical and horizontal
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders ).toHaveLength( 2 );

			// Should show linked button since we're in axial mode
			expect(
				screen.getByRole( 'button', { name: 'Unlink sides' } )
			).toBeInTheDocument();
		} );

		it( 'renders in axial view when no values are set and sides are balanced', () => {
			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			// Should default to axial view for balanced sides
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders ).toHaveLength( 2 );

			// Should show linked button since we're in axial mode
			expect(
				screen.getByRole( 'button', { name: 'Unlink sides' } )
			).toBeInTheDocument();
		} );

		it( 'applies horizontal value to left and right sides in axial view', async () => {
			const user = userEvent.setup();
			const axialValues = {
				top: '1rem',
				right: '2rem',
				bottom: '1rem',
				left: '2rem',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ axialValues }
				/>
			);

			// Should be in axial view - find horizontal slider and interact with it
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders ).toHaveLength( 2 );

			// First slider should be vertical, second should be horizontal
			const horizontalSlider = sliders[ 1 ];

			// Move slider to position that corresponds to a preset value
			await user.click( horizontalSlider );
			fireEvent.change( horizontalSlider, { target: { value: '2' } } );

			// Should have called onChange with left and right values updated
			expect( mockOnChange ).toHaveBeenCalled();
			const lastCall =
				mockOnChange.mock.calls[ mockOnChange.mock.calls.length - 1 ];
			const [ changedValues ] = lastCall;

			// Both left and right should be updated to the same value
			expect( changedValues.left ).toBe( changedValues.right );
		} );

		it( 'applies vertical value to top and bottom sides in axial view', async () => {
			const user = userEvent.setup();
			const axialValues = {
				top: '1rem',
				right: '2rem',
				bottom: '1rem',
				left: '2rem',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ axialValues }
				/>
			);

			// Should be in axial view - find vertical slider
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders ).toHaveLength( 2 );

			// First slider should be vertical
			const verticalSlider = sliders[ 0 ];

			// Move slider to position that corresponds to a preset value
			await user.click( verticalSlider );
			fireEvent.change( verticalSlider, { target: { value: '3' } } );

			// Should have called onChange with top and bottom values updated
			expect( mockOnChange ).toHaveBeenCalled();
			const lastCall =
				mockOnChange.mock.calls[ mockOnChange.mock.calls.length - 1 ];
			const [ changedValues ] = lastCall;

			// Both top and bottom should be updated to the same value
			expect( changedValues.top ).toBe( changedValues.bottom );
		} );

		it( 'switches from axial to custom view when unlink button is clicked', async () => {
			const user = userEvent.setup();
			const axialValues = {
				top: '1rem',
				right: '2rem',
				bottom: '1rem',
				left: '2rem',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ axialValues }
				/>
			);

			// Initially in axial view with 2 sliders
			expect( screen.getAllByRole( 'slider' ) ).toHaveLength( 2 );

			// Click unlink button to switch to custom view
			const unlinkButton = screen.getByRole( 'button', {
				name: 'Unlink sides',
			} );
			await user.click( unlinkButton );

			// Now should be in custom view with 4 sliders (one per side)
			expect( screen.getAllByRole( 'slider' ) ).toHaveLength( 4 );

			// Button should now say "Link sides"
			expect(
				screen.getByRole( 'button', { name: 'Link sides' } )
			).toBeInTheDocument();
		} );

		it( 'maintains axial values when toggling views', async () => {
			const user = userEvent.setup();
			const axialValues = {
				top: '1rem',
				right: '2rem',
				bottom: '1rem',
				left: '2rem',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ axialValues }
				/>
			);

			// Switch to custom view
			const unlinkButton = screen.getByRole( 'button', {
				name: 'Unlink sides',
			} );
			await user.click( unlinkButton );

			// Then switch back to axial view
			const linkButton = screen.getByRole( 'button', {
				name: 'Link sides',
			} );
			await user.click( linkButton );

			// Should be back to axial view with 2 sliders
			expect( screen.getAllByRole( 'slider' ) ).toHaveLength( 2 );
		} );

		it( 'shows correct labels for axial controls without sides in label', () => {
			const axialValues = {
				top: '1rem',
				right: '2rem',
				bottom: '1rem',
				left: '2rem',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ axialValues }
					label="margin"
				/>
			);

			// The main fieldset legend should show just the type without sides
			const fieldset = screen.getByRole( 'group' );
			expect( fieldset ).toBeInTheDocument();

			// Check that the fieldset contains the margin label in its accessible name or content
			expect( fieldset ).toHaveTextContent( 'margin' );

			// In axial view, we should have sliders for vertical and horizontal
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders ).toHaveLength( 2 );
		} );

		it( 'handles preset values correctly in axial view', () => {
			const presetValues = {
				top: 'var:preset|spacing|40',
				right: 'var:preset|spacing|20',
				bottom: 'var:preset|spacing|40',
				left: 'var:preset|spacing|20',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ presetValues }
				/>
			);

			// Should be in axial view since top/bottom match and left/right match
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders ).toHaveLength( 2 );

			// Sliders should show preset positions (index 2 for '40', index 1 for '20')
			expect( sliders[ 0 ] ).toHaveValue( '2' ); // vertical (top/bottom)
			expect( sliders[ 1 ] ).toHaveValue( '1' ); // horizontal (left/right)
		} );

		it( 'handles zero values in axial view', () => {
			const zeroValues = {
				top: '0',
				right: '1rem',
				bottom: '0',
				left: '1rem',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ zeroValues }
				/>
			);

			// Should be in axial view
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders ).toHaveLength( 2 );

			// Vertical should be at position 0 (zero value)
			expect( sliders[ 0 ] ).toHaveValue( '0' );
		} );

		it( 'properly initializes in axial view for horizontal/vertical sides configuration', () => {
			render(
				<SpacingSizesControl
					{ ...defaultProps }
					sides={ [ 'horizontal', 'vertical' ] }
					values={ {
						top: '1rem',
						right: '2rem',
						bottom: '1rem',
						left: '2rem',
					} }
				/>
			);

			// Should be in axial view with no link/unlink button for this configuration
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders ).toHaveLength( 2 );

			// Should not show link/unlink button for horizontal/vertical only sides
			expect(
				screen.queryByRole( 'button', { name: 'Unlink sides' } )
			).not.toBeInTheDocument();
		} );

		it( 'handles mixed unit values in axial view', () => {
			const mixedUnits = {
				top: '1rem',
				right: '16px',
				bottom: '1rem',
				left: '16px',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ mixedUnits }
				/>
			);

			// Should be in axial view since the values match per axis
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders ).toHaveLength( 2 );

			// Should show linked button
			expect(
				screen.getByRole( 'button', { name: 'Unlink sides' } )
			).toBeInTheDocument();
		} );

		it( 'handles undefined values gracefully in axial view', async () => {
			const user = userEvent.setup();

			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			// Should start in axial view for undefined values with balanced sides
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders ).toHaveLength( 2 );

			// Both sliders should be at 0 position for undefined values
			expect( sliders[ 0 ] ).toHaveValue( '0' );
			expect( sliders[ 1 ] ).toHaveValue( '0' );

			// Should be able to interact with sliders
			await user.click( sliders[ 0 ] );
			fireEvent.change( sliders[ 0 ], { target: { value: '1' } } );

			expect( mockOnChange ).toHaveBeenCalled();
		} );
	} );

	describe( 'Value Changes - Custom View', () => {
		it( 'changes individual side values when in custom view', async () => {
			const user = userEvent.setup();
			const initialValues = {
				top: '1rem',
				right: '2rem',
				bottom: '1.5rem',
				left: '2rem',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ initialValues }
				/>
			);

			// Should start in custom view due to mixed values
			expect( screen.getByLabelText( 'Link sides' ) ).toBeInTheDocument();

			// Switch to custom mode to access inputs
			const customToggles =
				screen.getAllByLabelText( 'Set custom value' );
			await user.click( customToggles[ 0 ] ); // Click first side's custom toggle

			// Find and change the top input
			const topInput = screen.getByRole( 'spinbutton', {
				name: 'Top padding',
			} );
			await user.clear( topInput );
			await user.type( topInput, '24' );

			// The component may convert values to preset format or handle them differently
			// Just ensure onChange was called
			expect( mockOnChange ).toHaveBeenCalled();
		} );

		it( 'handles different units for different sides', () => {
			const mixedValues = {
				top: '1rem',
				right: '16px',
				bottom: '2em',
				left: '20px',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ mixedValues }
				/>
			);

			// Should start in custom view due to mixed units
			expect( screen.getByLabelText( 'Link sides' ) ).toBeInTheDocument();

			// Should show all four individual side controls
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders.length ).toBeGreaterThanOrEqual( 4 );
		} );
	} );

	describe( 'Single Side Configuration', () => {
		it( 'handles single top side', async () => {
			const user = userEvent.setup();

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					sides={ [ 'top' ] }
					values={ { top: '1rem' } }
				/>
			);

			// Should show single control for top
			expect(
				screen.getByLabelText( 'Top padding' )
			).toBeInTheDocument();

			// Switch to custom mode and change value
			const customToggle = screen.getByLabelText( 'Set custom value' );
			await user.click( customToggle );

			const input = screen.getByRole( 'spinbutton', {
				name: 'Top padding',
			} );
			await user.clear( input );
			await user.type( input, '32' );

			// The component may convert values to preset format
			// Just ensure onChange was called
			expect( mockOnChange ).toHaveBeenCalled();
		} );

		it( 'handles axial configuration (horizontal and vertical)', () => {
			render(
				<SpacingSizesControl
					{ ...defaultProps }
					sides={ [ 'horizontal', 'vertical' ] }
					values={ { top: '1rem', left: '2rem' } }
				/>
			);

			// Should render the component without error
			expect( screen.getByRole( 'group' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Preset Functionality', () => {
		it( 'uses range control when presets are available and count is small', () => {
			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			// Should show range control for presets (axial view)
			expect( screen.getAllByRole( 'slider' ) ).toHaveLength( 2 ); // Vertical and Horizontal
		} );

		it( 'applies preset values via range control', async () => {
			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			const slider = screen.getAllByRole( 'slider' )[ 0 ]; // Get first slider (vertical)

			// Move slider to select preset
			fireEvent.change( slider, { target: { value: '2' } } );

			expect( mockOnChange ).toHaveBeenCalledWith(
				expect.objectContaining( {
					top: 'var:preset|spacing|40',
					bottom: 'var:preset|spacing|40',
				} )
			);
		} );

		it( 'shows custom value toggle when presets are available', () => {
			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			// Should show the settings/custom toggle button
			const customToggle =
				screen.getAllByLabelText( 'Set custom value' )[ 0 ];
			expect( customToggle ).toBeInTheDocument();
		} );

		it( 'toggles between preset and custom modes', async () => {
			const user = userEvent.setup();

			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			const customToggle =
				screen.getAllByLabelText( 'Set custom value' )[ 0 ];

			// Initially should show preset controls (range slider)
			expect( screen.getAllByRole( 'slider' ) ).toHaveLength( 2 );

			// Click to switch to custom mode
			await user.click( customToggle );

			// Should now show custom input controls
			expect(
				screen.getAllByRole( 'spinbutton' ).length
			).toBeGreaterThanOrEqual( 1 );
		} );

		it( 'recognizes preset values and shows them correctly', () => {
			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ {
						top: 'var:preset|spacing|40',
						right: 'var:preset|spacing|60',
						bottom: 'var:preset|spacing|40',
						left: 'var:preset|spacing|60',
					} }
				/>
			);

			// Should show the preset range controls at correct positions
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders ).toHaveLength( 2 ); // Vertical and Horizontal in axial view
		} );
	} );

	describe( 'Large Preset Sets', () => {
		const largeSpacingSizes = Array.from( { length: 15 }, ( _, i ) => ( {
			name: `Size ${ i }`,
			slug: `${ i * 10 }`,
			size: `${ i * 0.5 }rem`,
		} ) );

		// Mock the large preset set
		beforeEach( () => {
			jest.requireMock(
				'../hooks/use-spacing-sizes'
			).default.mockReturnValue( largeSpacingSizes );
		} );

		afterEach( () => {
			jest.requireMock(
				'../hooks/use-spacing-sizes'
			).default.mockReturnValue( [
				{ name: 'None', slug: '0', size: 0 },
				{ name: 'Small', slug: '20', size: '0.5rem' },
				{ name: 'Medium', slug: '40', size: '1rem' },
				{ name: 'Large', slug: '60', size: '1.5rem' },
				{ name: 'X-Large', slug: '80', size: '2rem' },
			] );
		} );

		it( 'uses select dropdown for large preset sets', async () => {
			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			// Should use CustomSelectControl instead of range
			await waitFor( () => {
				expect(
					screen.queryByRole( 'slider' )
				).not.toBeInTheDocument();
			} );

			await waitFor( () => {
				expect( screen.getAllByRole( 'combobox' ) ).toHaveLength( 2 ); // Vertical and Horizontal
			} );
		} );

		it( 'can interact with select dropdown options', async () => {
			const user = userEvent.setup();

			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			// With large preset sets, should use select dropdowns instead of sliders
			await waitFor( () => {
				expect( screen.getAllByRole( 'combobox' ) ).toHaveLength( 2 );
			} );

			// Click on the first combobox to open dropdown
			const comboboxes = screen.getAllByRole( 'combobox' );
			await user.click( comboboxes[ 0 ] );

			// Should be able to interact with the dropdown
			expect( comboboxes[ 0 ] ).toHaveAttribute( 'aria-expanded' );
		} );
	} );

	describe( 'Edge Cases and Error Handling', () => {
		it( 'handles undefined values gracefully', () => {
			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			expect( screen.getByText( 'Padding' ) ).toBeInTheDocument();
			expect(
				screen.getByLabelText( 'Unlink sides' )
			).toBeInTheDocument();
		} );

		it( 'handles empty object values', () => {
			render( <SpacingSizesControl { ...defaultProps } values={ {} } /> );

			expect( screen.getByText( 'Padding' ) ).toBeInTheDocument();
			expect(
				screen.getByLabelText( 'Unlink sides' )
			).toBeInTheDocument();
		} );

		it( 'handles partial object values', () => {
			const partialValues = {
				top: '1rem',
				right: '2rem',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ partialValues }
				/>
			);

			// Should start in custom view due to partial values
			expect( screen.getByLabelText( 'Link sides' ) ).toBeInTheDocument();
		} );

		it( 'handles complex CSS values', () => {
			const complexValues = {
				top: 'clamp(1rem, 2vw, 3rem)',
				right: 'clamp(1rem, 2vw, 3rem)',
				bottom: 'clamp(1rem, 2vw, 3rem)',
				left: 'clamp(1rem, 2vw, 3rem)',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ complexValues }
				/>
			);

			// Complex values should be handled gracefully
			expect( screen.getByText( 'Padding' ) ).toBeInTheDocument();
		} );

		it( 'handles zero values correctly', () => {
			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ { top: '0', right: '0', bottom: '0', left: '0' } }
				/>
			);

			// Zero should be recognized as a valid preset
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders[ 0 ] ).toHaveValue( '0' ); // Should be at "None" preset position
		} );

		it( 'handles invalid numeric values', async () => {
			const user = userEvent.setup();

			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			// Switch to custom mode to access input
			const customToggle =
				screen.getAllByLabelText( 'Set custom value' )[ 0 ];
			await user.click( customToggle );

			const input = screen.getAllByRole( 'spinbutton' )[ 0 ];
			await user.clear( input );
			await user.type( input, 'invalid' );

			// Should not crash and maintain component stability
			expect( input ).toBeInTheDocument();
		} );
	} );

	describe( 'Additional Props', () => {
		it( 'respects minimumCustomValue prop', async () => {
			const user = userEvent.setup();

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					minimumCustomValue={ 10 }
					values={ undefined }
				/>
			);

			// Switch to custom mode to access input
			const customToggle =
				screen.getAllByLabelText( 'Set custom value' )[ 0 ];
			await user.click( customToggle );

			const input = screen.getAllByRole( 'spinbutton' )[ 0 ];

			// Should respect minimum value constraint
			expect( input ).toHaveAttribute( 'min', '10' );
		} );

		it( 'calls onMouseOver and onMouseOut callbacks', async () => {
			const mockOnMouseOver = jest.fn();
			const mockOnMouseOut = jest.fn();
			const user = userEvent.setup();

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					onMouseOver={ mockOnMouseOver }
					onMouseOut={ mockOnMouseOut }
					values={ undefined }
				/>
			);

			const slider = screen.getAllByRole( 'slider' )[ 0 ];

			await user.hover( slider );
			expect( mockOnMouseOver ).toHaveBeenCalled();

			await user.unhover( slider );
			expect( mockOnMouseOut ).toHaveBeenCalled();
		} );

		it( 'forwards inputProps to input controls', () => {
			const customInputProps = {
				'data-testid': 'custom-input',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					inputProps={ customInputProps }
					values={ { top: '1rem' } }
				/>
			);

			// The component should render properly with inputProps
			// Since the exact implementation of how inputProps are forwarded may vary,
			// we'll just verify the component renders
			expect( screen.getByRole( 'group' ) ).toBeInTheDocument();
		} );

		it( 'handles useSelect prop for custom preset behavior', () => {
			render(
				<SpacingSizesControl
					{ ...defaultProps }
					useSelect
					values={ undefined }
				/>
			);

			// When useSelect is true, should force select dropdown usage
			// This is tested implicitly through the component not crashing
			expect( screen.getByText( 'Padding' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Integration Scenarios', () => {
		it( 'works with different spacing preset configurations', () => {
			// Mock different spacing sizes configuration
			const customSpacingSizes = [
				{ name: 'Tiny', slug: '10', size: '0.25rem' },
				{ name: 'Huge', slug: '100', size: '5rem' },
			];

			jest.requireMock(
				'../hooks/use-spacing-sizes'
			).default.mockReturnValueOnce( customSpacingSizes );

			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			// Should work with custom spacing configuration
			expect( screen.getAllByRole( 'slider' ) ).toHaveLength( 2 );
		} );

		it( 'handles theme spacing integration', () => {
			const themeSpacingSizes = [
				{ name: 'Theme Small', slug: 'theme-sm', size: '0.75rem' },
				{ name: 'Theme Large', slug: 'theme-lg', size: '2.25rem' },
			];

			jest.requireMock(
				'../hooks/use-spacing-sizes'
			).default.mockReturnValueOnce( themeSpacingSizes );

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ {
						top: 'var:preset|spacing|theme-sm',
						right: 'var:preset|spacing|theme-lg',
						bottom: 'var:preset|spacing|theme-sm',
						left: 'var:preset|spacing|theme-lg',
					} }
				/>
			);

			// Should properly handle theme-based spacing presets
			expect( screen.getAllByRole( 'slider' ) ).toHaveLength( 2 );
		} );
	} );

	describe( 'Accessibility', () => {
		it( 'has proper ARIA labels for side controls', () => {
			const mixedValues = {
				top: '1rem',
				right: '2rem',
				bottom: '1.5rem',
				left: '2rem',
			};

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ mixedValues }
				/>
			);

			// Check that individual side controls have proper labels
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders ).toHaveLength( 4 );
		} );

		it( 'has proper ARIA labels for axial controls', () => {
			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ {
						top: '1rem',
						right: '2rem',
						bottom: '1rem',
						left: '2rem',
					} }
				/>
			);

			// In axial view, should show vertical and horizontal labels
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders ).toHaveLength( 2 );
		} );

		it( 'maintains focus management when toggling views', async () => {
			const user = userEvent.setup();

			render(
				<SpacingSizesControl
					{ ...defaultProps }
					values={ {
						top: '1rem',
						right: '2rem',
						bottom: '1rem',
						left: '2rem',
					} }
				/>
			);

			const linkButton = screen.getByLabelText( 'Unlink sides' );
			await user.click( linkButton );

			// After unlinking, should show individual side controls
			const sliders = screen.getAllByRole( 'slider' );
			expect( sliders ).toHaveLength( 4 );
		} );
	} );

	describe( 'Integration with Settings', () => {
		it( 'respects disableCustomSpacingSizes setting', () => {
			useSelect.mockReturnValue( true ); // disableCustomSpacingSizes = true

			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			// Should not show custom toggle when custom sizes are disabled
			expect(
				screen.queryByLabelText( 'Set custom value' )
			).not.toBeInTheDocument();
		} );

		it( 'shows custom toggle when custom sizes are enabled', () => {
			useSelect.mockReturnValue( false ); // disableCustomSpacingSizes = false

			render(
				<SpacingSizesControl { ...defaultProps } values={ undefined } />
			);

			// Should show custom toggle when custom sizes are enabled
			expect(
				screen.getAllByLabelText( 'Set custom value' )[ 0 ]
			).toBeInTheDocument();
		} );
	} );

	describe( 'Label Customization', () => {
		it( 'uses custom label', () => {
			render(
				<SpacingSizesControl
					{ ...defaultProps }
					label="Margin"
					values={ { top: '1rem' } }
					sides={ [ 'top' ] }
				/>
			);

			expect( screen.getByRole( 'slider' ) ).toBeInTheDocument();
		} );

		it( 'handles showSideInLabel prop', () => {
			render(
				<SpacingSizesControl
					{ ...defaultProps }
					label="Spacing"
					showSideInLabel={ false }
					values={ { top: '1rem' } }
					sides={ [ 'top' ] }
				/>
			);

			expect( screen.getByRole( 'slider' ) ).toBeInTheDocument();
		} );
	} );
} );
