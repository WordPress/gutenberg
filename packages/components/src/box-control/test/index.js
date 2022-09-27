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

const setupUser = () =>
	userEvent.setup( {
		advanceTimers: jest.advanceTimersByTime,
	} );

const getInput = () =>
	screen.getByLabelText( 'Box Control', { selector: 'input' } );
const getSelect = () => screen.getByLabelText( 'Select unit' );
const getReset = () => screen.getByText( /Reset/ );

describe( 'BoxControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			const { container } = render( <BoxControl /> );
			const input = container.querySelector( 'input' );

			expect( input ).toBeTruthy();
		} );

		it( 'should update values when interacting with input', async () => {
			const user = setupUser();
			render( <BoxControl /> );
			const input = getInput();
			const select = getSelect();

			await user.type( input, '100%' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
			expect( select ).toHaveValue( '%' );
		} );
	} );

	describe( 'Reset', () => {
		it( 'should reset values when clicking Reset', async () => {
			const user = setupUser();
			render( <BoxControl /> );
			const input = getInput();
			const select = getSelect();
			const reset = getReset();

			await user.type( input, '100px' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
			expect( select ).toHaveValue( 'px' );

			await user.click( reset );

			expect( input ).toHaveValue( '' );
			expect( select ).toHaveValue( 'px' );
		} );

		it( 'should reset values when clicking Reset, if controlled', async () => {
			const Example = () => {
				const [ state, setState ] = useState();

				return (
					<BoxControl
						values={ state }
						onChange={ ( next ) => setState( next ) }
					/>
				);
			};
			const user = setupUser();
			render( <Example /> );
			const input = getInput();
			const select = getSelect();
			const reset = getReset();

			await user.type( input, '100px' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
			expect( select ).toHaveValue( 'px' );

			await user.click( reset );

			expect( input ).toHaveValue( '' );
			expect( select ).toHaveValue( 'px' );
		} );

		it( 'should reset values when clicking Reset, if controlled <-> uncontrolled state changes', async () => {
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
			const user = setupUser();
			render( <Example /> );
			const input = getInput();
			const select = getSelect();
			const reset = getReset();

			await user.type( input, '100px' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
			expect( select ).toHaveValue( 'px' );

			await user.click( reset );

			expect( input ).toHaveValue( '' );
			expect( select ).toHaveValue( 'px' );
		} );

		it( 'should persist cleared value when focus changes', async () => {
			const user = setupUser();
			const spyChange = jest.fn();
			render( <BoxControl onChange={ ( v ) => spyChange( v ) } /> );
			const input = screen.getByLabelText( 'Box Control', {
				selector: 'input',
			} );
			const unitSelect = screen.getByLabelText( 'Select unit' );

			await user.type( input, '100%' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
			expect( unitSelect ).toHaveValue( '%' );

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
			let state = {};
			const setState = ( newState ) => ( state = newState );

			render(
				<BoxControl
					values={ state }
					onChange={ ( next ) => setState( next ) }
				/>
			);
			const user = setupUser();
			const unlink = screen.getByLabelText( /Unlink sides/ );

			await user.click( unlink );

			const input = screen.getByLabelText( /Top/ );
			const select = screen.getAllByLabelText( /Select unit/ )[ 0 ];

			await user.type( input, '100px' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
			expect( select ).toHaveValue( 'px' );

			expect( state ).toEqual( {
				top: '100px',
				right: undefined,
				bottom: undefined,
				left: undefined,
			} );
		} );

		it( 'should update a whole axis when value is changed when unlinked', async () => {
			let state = {};
			const setState = ( newState ) => ( state = newState );

			render(
				<BoxControl
					values={ state }
					onChange={ ( next ) => setState( next ) }
					splitOnAxis={ true }
				/>
			);
			const user = setupUser();
			const unlink = screen.getByLabelText( /Unlink sides/ );

			await user.click( unlink );

			const input = screen.getByLabelText( /Vertical/ );
			const select = screen.getAllByLabelText( /Select unit/ )[ 0 ];

			await user.type( input, '100px' );
			await user.keyboard( '{Enter}' );

			expect( input ).toHaveValue( '100' );
			expect( select ).toHaveValue( 'px' );

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
			// Render control.
			render( <BoxControl /> );
			const user = setupUser();

			// Make unit selection on all input control.
			const allUnitSelect = getSelect();
			await user.selectOptions( allUnitSelect, [ 'em' ] );

			// Unlink the controls.
			await user.click( screen.getByLabelText( /Unlink sides/ ) );

			// Confirm that each individual control has the selected unit
			const unlinkedSelects = screen.getAllByDisplayValue( 'em' );
			expect( unlinkedSelects.length ).toEqual( 4 );
		} );

		it( 'should use individual side attribute unit when available', async () => {
			// Render control.
			const { rerender } = render( <BoxControl /> );
			const user = setupUser();

			// Make unit selection on all input control.
			const allUnitSelect = getSelect();
			await user.selectOptions( allUnitSelect, [ 'vw' ] );

			// Unlink the controls.
			await user.click( screen.getByLabelText( /Unlink sides/ ) );

			// Confirm that each individual control has the selected unit
			const unlinkedSelects = screen.getAllByDisplayValue( 'vw' );
			expect( unlinkedSelects.length ).toEqual( 4 );

			// Rerender with individual side value & confirm unit is selected.
			rerender( <BoxControl values={ { top: '2.5em' } } /> );

			const topSelect = screen.getByDisplayValue( 'em' );
			const otherSelects = screen.getAllByDisplayValue( 'vw' );

			expect( topSelect ).toBeInTheDocument();
			expect( otherSelects.length ).toEqual( 3 );
		} );
	} );

	describe( 'onChange updates', () => {
		it( 'should call onChange when values contain more than just CSS units', async () => {
			const setState = jest.fn();

			render( <BoxControl onChange={ setState } /> );
			const user = setupUser();
			const input = getInput();

			await user.type( input, '7.5rem' );
			await user.keyboard( '{Enter}' );

			expect( setState ).toHaveBeenCalledWith( {
				top: '7.5rem',
				right: '7.5rem',
				bottom: '7.5rem',
				left: '7.5rem',
			} );
		} );

		it( 'should not pass invalid CSS unit only values to onChange', async () => {
			const setState = jest.fn();

			render( <BoxControl onChange={ setState } /> );
			const user = setupUser();

			const allUnitSelect = getSelect();
			await user.selectOptions( allUnitSelect, 'rem' );

			expect( setState ).toHaveBeenCalledWith( {
				top: undefined,
				right: undefined,
				bottom: undefined,
				left: undefined,
			} );
		} );
	} );
} );
