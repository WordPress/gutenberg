/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BoxControl from '..';
import type { BoxControlProps, BoxControlValue } from '../types';

const Example = ( extraProps: Omit< BoxControlProps, 'onChange' > ) => {
	const [ state, setState ] = useState< BoxControlValue >();

	return (
		<BoxControl
			values={ state }
			onChange={ ( next ) => setState( next ) }
			{ ...extraProps }
		/>
	);
};

describe( 'BoxControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render a box control input', () => {
			render( <BoxControl onChange={ () => {} } /> );

			expect(
				screen.getByRole( 'group', { name: 'Box Control' } )
			).toBeVisible();
			expect(
				screen.getByRole( 'textbox', { name: 'All sides' } )
			).toBeVisible();
		} );

		it( 'should update values when interacting with input', async () => {
			const user = userEvent.setup();

			render( <BoxControl onChange={ () => {} } /> );

			const input = screen.getByRole( 'textbox', { name: 'All sides' } );

			await user.type( input, '100' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
		} );

		it( 'should update input values when interacting with slider', () => {
			render( <BoxControl onChange={ () => {} } /> );

			const slider = screen.getByRole( 'slider' );

			fireEvent.change( slider, { target: { value: 50 } } );

			expect( slider ).toHaveValue( '50' );
			expect(
				screen.getByRole( 'textbox', { name: 'All sides' } )
			).toHaveValue( '50' );
		} );

		it( 'should update slider values when interacting with input', async () => {
			const user = userEvent.setup();
			render( <BoxControl onChange={ () => {} } /> );

			const input = screen.getByRole( 'textbox', {
				name: 'All sides',
			} );

			await user.type( input, '50' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '50' );
			expect( screen.getByRole( 'slider' ) ).toHaveValue( '50' );
		} );

		it( 'should render the number input with a default min value of 0', () => {
			render( <BoxControl onChange={ () => {} } /> );

			const input = screen.getByRole( 'textbox', { name: 'All sides' } );

			expect( input ).toHaveAttribute( 'min', '0' );
		} );

		it( 'should pass down `inputProps` to the underlying number input', () => {
			render(
				<BoxControl
					onChange={ () => {} }
					inputProps={ { min: 10, max: 50 } }
				/>
			);

			const input = screen.getByRole( 'textbox', { name: 'All sides' } );

			expect( input ).toHaveAttribute( 'min', '10' );
			expect( input ).toHaveAttribute( 'max', '50' );
		} );
	} );

	describe( 'Reset', () => {
		it( 'should reset values when clicking Reset', async () => {
			const user = userEvent.setup();

			render( <BoxControl onChange={ () => {} } /> );

			const input = screen.getByRole( 'textbox', {
				name: 'All sides',
			} );

			await user.type( input, '100' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );

			await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );

			expect( input ).toHaveValue( '' );
		} );

		it( 'should reset values when clicking Reset, if controlled', async () => {
			const user = userEvent.setup();

			render( <Example /> );

			const input = screen.getByRole( 'textbox', {
				name: 'All sides',
			} );

			await user.type( input, '100' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );

			await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );

			expect( input ).toHaveValue( '' );
		} );

		it( 'should reset values when clicking Reset, if controlled <-> uncontrolled state changes', async () => {
			const user = userEvent.setup();

			render( <Example /> );

			const input = screen.getByRole( 'textbox', {
				name: 'All sides',
			} );

			await user.type( input, '100' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );

			await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );

			expect( input ).toHaveValue( '' );
		} );

		it( 'should persist cleared value when focus changes', async () => {
			const user = userEvent.setup();
			const spyChange = jest.fn();

			render( <BoxControl onChange={ ( v ) => spyChange( v ) } /> );

			const input = screen.getByRole( 'textbox', {
				name: 'All sides',
			} );

			await user.type( input, '100' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );

			await user.clear( input );
			expect( input ).toHaveValue( '' );
			// Clicking document.body to trigger a blur event on the input.
			await user.click( document.body );

			expect( input ).toHaveValue( '' );
			expect( spyChange ).toHaveBeenLastCalledWith( {
				top: undefined,
				right: undefined,
				bottom: undefined,
				left: undefined,
			} );
		} );
	} );

	describe( 'Unlinked sides', () => {
		it( 'should update a single side value when unlinked', async () => {
			const user = userEvent.setup();

			render( <Example /> );

			await user.click(
				screen.getByRole( 'button', { name: 'Unlink sides' } )
			);

			await user.type(
				screen.getByRole( 'textbox', { name: 'Top side' } ),
				'100'
			);

			expect(
				screen.getByRole( 'textbox', { name: 'Top side' } )
			).toHaveValue( '100' );
			expect(
				screen.getByRole( 'textbox', { name: 'Right side' } )
			).not.toHaveValue();
			expect(
				screen.getByRole( 'textbox', { name: 'Bottom side' } )
			).not.toHaveValue();
			expect(
				screen.getByRole( 'textbox', { name: 'Left side' } )
			).not.toHaveValue();
		} );

		it( 'should update a single side value when using slider unlinked', async () => {
			const user = userEvent.setup();

			render( <Example /> );

			await user.click(
				screen.getByRole( 'button', { name: 'Unlink sides' } )
			);

			const slider = screen.getByRole( 'slider', { name: 'Right side' } );

			fireEvent.change( slider, { target: { value: 50 } } );

			expect( slider ).toHaveValue( '50' );
			expect(
				screen.getByRole( 'textbox', { name: 'Top side' } )
			).not.toHaveValue();
			expect(
				screen.getByRole( 'textbox', { name: 'Right side' } )
			).toHaveValue( '50' );
			expect(
				screen.getByRole( 'textbox', { name: 'Bottom side' } )
			).not.toHaveValue();
			expect(
				screen.getByRole( 'textbox', { name: 'Left side' } )
			).not.toHaveValue();
		} );

		it( 'should update a whole axis when value is changed when unlinked', async () => {
			const user = userEvent.setup();

			render( <Example splitOnAxis /> );

			await user.click(
				screen.getByRole( 'button', { name: 'Unlink sides' } )
			);

			await user.type(
				screen.getByRole( 'textbox', {
					name: 'Top and bottom sides',
				} ),
				'100'
			);

			expect(
				screen.getByRole( 'textbox', { name: 'Top and bottom sides' } )
			).toHaveValue( '100' );
			expect(
				screen.getByRole( 'textbox', { name: 'Left and right sides' } )
			).not.toHaveValue();
		} );

		it( 'should update a whole axis using a slider when value is changed when unlinked', async () => {
			const user = userEvent.setup();

			render( <Example splitOnAxis /> );

			await user.click(
				screen.getByRole( 'button', { name: 'Unlink sides' } )
			);

			const slider = screen.getByRole( 'slider', {
				name: 'Left and right sides',
			} );

			fireEvent.change( slider, { target: { value: 50 } } );

			expect( slider ).toHaveValue( '50' );
			expect(
				screen.getByRole( 'textbox', { name: 'Top and bottom sides' } )
			).not.toHaveValue();
			expect(
				screen.getByRole( 'textbox', { name: 'Left and right sides' } )
			).toHaveValue( '50' );
		} );

		it( 'should show "Mixed" label when sides have different values but are linked', async () => {
			const user = userEvent.setup();

			render( <Example /> );

			const unlinkButton = screen.getByRole( 'button', {
				name: 'Unlink sides',
			} );

			await user.click( unlinkButton );

			await user.type(
				screen.getByRole( 'textbox', {
					name: 'Right side',
				} ),
				'13'
			);

			expect(
				screen.getByRole( 'textbox', { name: 'Right side' } )
			).toHaveValue( '13' );

			await user.click( unlinkButton );

			expect( screen.getByPlaceholderText( 'Mixed' ) ).toHaveValue( '' );
		} );
	} );

	describe( 'Unit selections', () => {
		it( 'should update unlinked controls unit selection based on all input control', async () => {
			const user = userEvent.setup();

			// Render control.
			render( <BoxControl onChange={ () => {} } /> );

			// Make unit selection on all input control.
			await user.selectOptions(
				screen.getByRole( 'combobox', {
					name: 'Select unit',
				} ),
				[ 'em' ]
			);

			// Unlink the controls.
			await user.click(
				screen.getByRole( 'button', { name: 'Unlink sides' } )
			);

			const controls = screen.getAllByRole( 'combobox', {
				name: 'Select unit',
			} );

			// Confirm we have exactly 4 controls.
			expect( controls ).toHaveLength( 4 );

			// Confirm that each individual control has the selected unit
			controls.forEach( ( control ) => {
				expect( control ).toHaveValue( 'em' );
			} );
		} );

		it( 'should use individual side attribute unit when available', async () => {
			const user = userEvent.setup();

			// Render control.
			const { rerender } = render( <BoxControl onChange={ () => {} } /> );

			// Make unit selection on all input control.
			await user.selectOptions(
				screen.getByRole( 'combobox', {
					name: 'Select unit',
				} ),
				[ 'vw' ]
			);

			// Unlink the controls.
			await user.click(
				screen.getByRole( 'button', { name: 'Unlink sides' } )
			);

			const controls = screen.getAllByRole( 'combobox', {
				name: 'Select unit',
			} );

			// Confirm we have exactly 4 controls.
			expect( controls ).toHaveLength( 4 );

			// Confirm that each individual control has the selected unit
			controls.forEach( ( control ) => {
				expect( control ).toHaveValue( 'vw' );
			} );

			// Rerender with individual side value & confirm unit is selected.
			rerender(
				<BoxControl values={ { top: '2.5em' } } onChange={ () => {} } />
			);

			const rerenderedControls = screen.getAllByRole( 'combobox', {
				name: 'Select unit',
			} );

			// Confirm we have exactly 4 controls.
			expect( rerenderedControls ).toHaveLength( 4 );

			// Confirm that each individual control has the right selected unit
			rerenderedControls.forEach( ( control, index ) => {
				const expected = index === 0 ? 'em' : 'vw';
				expect( control ).toHaveValue( expected );
			} );
		} );
	} );

	describe( 'onChange updates', () => {
		it( 'should call onChange when values contain more than just CSS units', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render( <BoxControl onChange={ onChangeSpy } /> );

			const valueInput = screen.getByRole( 'textbox', {
				name: 'All sides',
			} );
			const unitSelect = screen.getByRole( 'combobox', {
				name: 'Select unit',
			} );

			// Typing the first letter of a unit blurs the input and focuses the combobox.
			await user.type( valueInput, '7r' );

			expect( unitSelect ).toHaveFocus();

			// The correct expected behavior would be for the values to have "rem"
			// as their unit, but the test environment doesn't seem to change
			// values on `select` elements when using the keyboard.
			expect( onChangeSpy ).toHaveBeenLastCalledWith( {
				top: '7px',
				right: '7px',
				bottom: '7px',
				left: '7px',
			} );
		} );

		it( 'should not pass invalid CSS unit only values to onChange', async () => {
			const user = userEvent.setup();
			const setState = jest.fn();

			render( <BoxControl onChange={ setState } /> );

			await user.selectOptions(
				screen.getByRole( 'combobox', {
					name: 'Select unit',
				} ),
				'rem'
			);

			expect( setState ).toHaveBeenCalledWith( {
				top: undefined,
				right: undefined,
				bottom: undefined,
				left: undefined,
			} );
		} );
	} );
} );
