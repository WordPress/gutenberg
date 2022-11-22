/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BoxControl from '../';

describe( 'BoxControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render a box control input', () => {
			render( <BoxControl /> );

			expect(
				screen.getByRole( 'textbox', { name: 'Box Control' } )
			).toBeVisible();
		} );

		it( 'should update values when interacting with input', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			render( <BoxControl /> );

			const input = screen.getByRole( 'textbox', {
				name: 'Box Control',
			} );

			await user.type( input, '100%' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
			expect(
				screen.getByRole( 'combobox', {
					name: 'Select unit',
				} )
			).toHaveValue( '%' );
		} );
	} );

	describe( 'Reset', () => {
		it( 'should reset values when clicking Reset', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			render( <BoxControl /> );

			const input = screen.getByRole( 'textbox', {
				name: 'Box Control',
			} );
			const select = screen.getByRole( 'combobox', {
				name: 'Select unit',
			} );

			await user.type( input, '100px' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
			expect( select ).toHaveValue( 'px' );

			await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );

			expect( input ).toHaveValue( '' );
			expect( select ).toHaveValue( 'px' );
		} );

		it( 'should reset values when clicking Reset, if controlled', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			const Example = () => {
				const [ state, setState ] = useState();

				return (
					<BoxControl
						values={ state }
						onChange={ ( next ) => setState( next ) }
					/>
				);
			};

			render( <Example /> );

			const input = screen.getByRole( 'textbox', {
				name: 'Box Control',
			} );
			const select = screen.getByRole( 'combobox', {
				name: 'Select unit',
			} );

			await user.type( input, '100px' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
			expect( select ).toHaveValue( 'px' );

			await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );

			expect( input ).toHaveValue( '' );
			expect( select ).toHaveValue( 'px' );
		} );

		it( 'should reset values when clicking Reset, if controlled <-> uncontrolled state changes', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			const Example = () => {
				const [ state, setState ] = useState();

				return (
					<BoxControl
						values={ state }
						onChange={ ( next ) => {
							if ( next.top ) {
								setState( next );
							} else {
								// This reverts it to being uncontrolled.
								setState( undefined );
							}
						} }
					/>
				);
			};

			render( <Example /> );

			const input = screen.getByRole( 'textbox', {
				name: 'Box Control',
			} );
			const select = screen.getByRole( 'combobox', {
				name: 'Select unit',
			} );

			await user.type( input, '100px' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
			expect( select ).toHaveValue( 'px' );

			await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );

			expect( input ).toHaveValue( '' );
			expect( select ).toHaveValue( 'px' );
		} );

		it( 'should persist cleared value when focus changes', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			const spyChange = jest.fn();

			render( <BoxControl onChange={ ( v ) => spyChange( v ) } /> );

			const input = screen.getByLabelText( 'Box Control', {
				selector: 'input',
			} );

			await user.type( input, '100%' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
			expect( screen.getByLabelText( 'Select unit' ) ).toHaveValue( '%' );

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
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			let state = {};
			const setState = ( newState ) => ( state = newState );

			render(
				<BoxControl
					values={ state }
					onChange={ ( next ) => setState( next ) }
				/>
			);

			await user.click( screen.getByLabelText( /Unlink sides/ ) );

			const input = screen.getByLabelText( /Top/ );

			await user.type( input, '100px' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
			expect(
				screen.getAllByLabelText( /Select unit/ )[ 0 ]
			).toHaveValue( 'px' );

			expect( state ).toEqual( {
				top: '100px',
				right: undefined,
				bottom: undefined,
				left: undefined,
			} );
		} );

		it( 'should update a whole axis when value is changed when unlinked', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			let state = {};
			const setState = ( newState ) => ( state = newState );

			render(
				<BoxControl
					values={ state }
					onChange={ ( next ) => setState( next ) }
					splitOnAxis={ true }
				/>
			);

			await user.click( screen.getByLabelText( /Unlink sides/ ) );

			const input = screen.getByLabelText( /Vertical/ );

			await user.type( input, '100px' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
			expect(
				screen.getAllByLabelText( /Select unit/ )[ 0 ]
			).toHaveValue( 'px' );

			expect( state ).toEqual( {
				top: '100px',
				right: undefined,
				bottom: '100px',
				left: undefined,
			} );
		} );
	} );

	describe( 'Unit selections', () => {
		it( 'should update unlinked controls unit selection based on all input control', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			// Render control.
			render( <BoxControl /> );

			// Make unit selection on all input control.
			await user.selectOptions(
				screen.getByRole( 'combobox', {
					name: 'Select unit',
				} ),
				[ 'em' ]
			);

			// Unlink the controls.
			await user.click( screen.getByLabelText( /Unlink sides/ ) );

			// Confirm that each individual control has the selected unit
			expect( screen.getAllByDisplayValue( 'em' ).length ).toEqual( 4 );
		} );

		it( 'should use individual side attribute unit when available', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			// Render control.
			const { rerender } = render( <BoxControl /> );

			// Make unit selection on all input control.
			await user.selectOptions(
				screen.getByRole( 'combobox', {
					name: 'Select unit',
				} ),
				[ 'vw' ]
			);

			// Unlink the controls.
			await user.click( screen.getByLabelText( /Unlink sides/ ) );

			// Confirm that each individual control has the selected unit
			expect( screen.getAllByDisplayValue( 'vw' ).length ).toEqual( 4 );

			// Rerender with individual side value & confirm unit is selected.
			rerender( <BoxControl values={ { top: '2.5em' } } /> );

			expect( screen.getByDisplayValue( 'em' ) ).toBeInTheDocument();
			expect( screen.getAllByDisplayValue( 'vw' ).length ).toEqual( 3 );
		} );
	} );

	describe( 'onChange updates', () => {
		it( 'should call onChange when values contain more than just CSS units', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			const setState = jest.fn();

			render( <BoxControl onChange={ setState } /> );

			await user.type(
				screen.getByRole( 'textbox', {
					name: 'Box Control',
				} ),
				'7.5rem'
			);
			await user.keyboard( '{Enter}' );

			expect( setState ).toHaveBeenCalledWith( {
				top: '7.5rem',
				right: '7.5rem',
				bottom: '7.5rem',
				left: '7.5rem',
			} );
		} );

		it( 'should not pass invalid CSS unit only values to onChange', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
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
