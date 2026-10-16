/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import DuotonePicker from '../duotone-picker';

const DUOTONE_PALETTE = [
	{
		colors: [ '#8c00b7', '#fcff41' ],
		name: 'Purple and Yellow',
		slug: 'purple-yellow',
	},
	{
		colors: [ '#000097', '#ff4747' ],
		name: 'Blue and Red',
		slug: 'blue-red',
	},
];

const COLOR_PALETTE = [
	{ color: '#ff4747', name: 'Red', slug: 'red' },
	{ color: '#fcff41', name: 'Yellow', slug: 'yellow' },
	{ color: '#000097', name: 'Blue', slug: 'blue' },
	{ color: '#8c00b7', name: 'Purple', slug: 'purple' },
];

describe( 'DuotonePicker', () => {
	it( 'renders correctly', () => {
		render(
			<DuotonePicker
				duotonePalette={ DUOTONE_PALETTE }
				colorPalette={ COLOR_PALETTE }
				value={ undefined }
				onChange={ jest.fn() }
			/>
		);

		expect(
			screen.getByRole( 'listbox', { name: 'Custom color picker' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'option', { name: 'Duotone: Purple and Yellow' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'option', { name: 'Duotone: Blue and Red' } )
		).toBeInTheDocument();
	} );

	it( 'calls onChange when a duotone option is clicked', async () => {
		const handleChange = jest.fn();
		const user = userEvent.setup();

		render(
			<DuotonePicker
				duotonePalette={ DUOTONE_PALETTE }
				colorPalette={ COLOR_PALETTE }
				value={ undefined }
				onChange={ handleChange }
			/>
		);

		const purpleYellowOption = screen.getByRole( 'option', {
			name: 'Duotone: Purple and Yellow',
		} );

		await user.click( purpleYellowOption );

		expect( handleChange ).toHaveBeenCalledWith( [ '#8c00b7', '#fcff41' ] );
	} );

	it( 'calls onChange with undefined when unset option is clicked', async () => {
		const handleChange = jest.fn();
		const user = userEvent.setup();

		render(
			<DuotonePicker
				duotonePalette={ DUOTONE_PALETTE }
				colorPalette={ COLOR_PALETTE }
				value={ [ '#8c00b7', '#fcff41' ] }
				onChange={ handleChange }
			/>
		);

		const unsetOption = screen.getByRole( 'option', {
			name: 'Unset',
		} );

		await user.click( unsetOption );

		expect( handleChange ).toHaveBeenCalledWith( 'unset' );
	} );

	it( 'clears selection when clear button is clicked', async () => {
		const handleChange = jest.fn();
		const user = userEvent.setup();

		render(
			<DuotonePicker
				duotonePalette={ DUOTONE_PALETTE }
				colorPalette={ COLOR_PALETTE }
				value={ [ '#8c00b7', '#fcff41' ] }
				onChange={ handleChange }
			/>
		);

		const clearButton = screen.getByRole( 'button', { name: 'Clear' } );
		await user.click( clearButton );

		expect( handleChange ).toHaveBeenCalledWith( undefined );
	} );
} );
