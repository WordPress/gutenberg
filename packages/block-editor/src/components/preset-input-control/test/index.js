/**
 * External dependencies
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import PresetInputControl from '../index';

describe( 'PresetInputControl', () => {
	const mockOnChange = jest.fn();

	const defaultProps = {
		ariaLabel: 'Spacing control',
		onChange: mockOnChange,
		presetType: 'spacing',
	};

	const presets = [
		{ name: 'None', slug: '0', size: '0' },
		{ name: 'Small', slug: 'small', size: '10px' },
		{ name: 'Medium', slug: 'medium', size: '20px' },
		{ name: 'Large', slug: 'large', size: '30px' },
	];

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders preset selection controls', () => {
		render(
			<PresetInputControl { ...defaultProps } presets={ presets } />
		);

		// User can see preset options
		expect( screen.getByRole( 'slider' ) ).toBeInTheDocument();
	} );

	it( 'calls onChange when user selects a preset', () => {
		render(
			<PresetInputControl { ...defaultProps } presets={ presets } />
		);

		const slider = screen.getByRole( 'slider' );
		fireEvent.change( slider, { target: { value: '1' } } );

		expect( mockOnChange ).toHaveBeenCalledWith(
			'var:preset|spacing|small'
		);
	} );

	it( 'shows custom value input when toggled', async () => {
		const user = userEvent.setup();

		render(
			<PresetInputControl
				{ ...defaultProps }
				presets={ presets }
				disableCustomValues={ false }
			/>
		);

		// Find and click custom toggle
		const toggleButton = screen.getByRole( 'button', {
			name: /set custom value/i,
		} );
		await user.click( toggleButton );

		// User should see custom input
		expect( screen.getByRole( 'spinbutton' ) ).toBeInTheDocument();
	} );

	it( 'handles custom value input', async () => {
		const user = userEvent.setup();

		render(
			<PresetInputControl
				{ ...defaultProps }
				presets={ presets }
				value="15px"
				disableCustomValues={ false }
			/>
		);

		// Should automatically show custom input for non-preset values
		const input = screen.getByRole( 'spinbutton' );
		await user.clear( input );
		await user.type( input, '25' );

		expect( mockOnChange ).toHaveBeenCalledWith( '25px' );
	} );

	it( 'uses select dropdown for many presets', async () => {
		const manyPresets = Array.from( { length: 12 }, ( _, i ) => ( {
			name: `Preset ${ i + 1 }`,
			slug: `preset-${ i + 1 }`,
			size: `${ ( i + 1 ) * 5 }px`,
		} ) );

		render(
			<PresetInputControl { ...defaultProps } presets={ manyPresets } />
		);

		// Should use CustomSelectControl instead of slider for many presets
		await waitFor( () => {
			expect( screen.queryByRole( 'slider' ) ).not.toBeInTheDocument();
		} );

		await waitFor( () => {
			expect( screen.getByRole( 'combobox' ) ).toBeInTheDocument();
		} );
	} );

	it( 'can interact with select dropdown options', async () => {
		const user = userEvent.setup();
		const manyPresets = Array.from( { length: 12 }, ( _, i ) => ( {
			name: `Preset ${ i + 1 }`,
			slug: `preset-${ i + 1 }`,
			size: `${ ( i + 1 ) * 5 }px`,
		} ) );

		render(
			<PresetInputControl { ...defaultProps } presets={ manyPresets } />
		);

		// Wait for dropdown to render
		await waitFor( () => {
			expect( screen.getByRole( 'combobox' ) ).toBeInTheDocument();
		} );

		// Click on the dropdown to open it
		const combobox = screen.getByRole( 'combobox' );
		await user.click( combobox );

		// Should be able to interact with the dropdown
		await waitFor( () => {
			expect( combobox ).toHaveAttribute( 'aria-expanded', 'true' );
		} );
	} );

	it( 'supports mixed value states', () => {
		render(
			<PresetInputControl
				{ ...defaultProps }
				presets={ presets }
				value="15px"
				isMixed
				disableCustomValues={ false }
			/>
		);

		// Should show mixed placeholder
		expect( screen.getByPlaceholderText( 'Mixed' ) ).toBeInTheDocument();
	} );

	it( 'has proper accessibility', () => {
		render(
			<PresetInputControl { ...defaultProps } presets={ presets } />
		);

		const slider = screen.getByRole( 'slider' );
		expect( slider ).toHaveAttribute( 'aria-label', 'Spacing control' );
	} );

	it( 'renders without presets as custom input only', () => {
		render(
			<PresetInputControl
				{ ...defaultProps }
				presets={ [] }
				disableCustomValues={ false }
			/>
		);

		// Should show custom controls when no presets available
		expect( screen.getByRole( 'spinbutton' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'slider' ) ).toBeInTheDocument();
	} );
} );
