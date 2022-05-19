/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import BoxControl from '../';

describe( 'BoxControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			const { container } = render( <BoxControl /> );
			const input = container.querySelector( 'input' );

			expect( input ).toBeTruthy();
		} );

		it( 'should update values when interacting with input', () => {
			const { container } = render( <BoxControl /> );
			const input = container.querySelector( 'input' );
			const unitSelect = container.querySelector( 'select' );

			input.focus();
			fireEvent.change( input, { target: { value: '100%' } } );
			fireEvent.keyDown( input, { keyCode: ENTER } );

			expect( input.value ).toBe( '100' );
			expect( unitSelect.value ).toBe( '%' );
		} );
	} );

	describe( 'Reset', () => {
		it( 'should reset values when clicking Reset', () => {
			const { container, getByText } = render( <BoxControl /> );
			const input = container.querySelector( 'input' );
			const unitSelect = container.querySelector( 'select' );
			const reset = getByText( /Reset/ );

			input.focus();
			fireEvent.change( input, { target: { value: '100px' } } );
			fireEvent.keyDown( input, { keyCode: ENTER } );

			expect( input.value ).toBe( '100' );
			expect( unitSelect.value ).toBe( 'px' );

			reset.focus();
			fireEvent.click( reset );

			expect( input.value ).toBe( '' );
			expect( unitSelect.value ).toBe( 'px' );
		} );

		it( 'should reset values when clicking Reset, if controlled', () => {
			const Example = () => {
				const [ state, setState ] = useState();

				return (
					<BoxControl
						values={ state }
						onChange={ ( next ) => setState( next ) }
					/>
				);
			};
			const { container, getByText } = render( <Example /> );
			const input = container.querySelector( 'input' );
			const unitSelect = container.querySelector( 'select' );
			const reset = getByText( /Reset/ );

			input.focus();
			fireEvent.change( input, { target: { value: '100px' } } );
			fireEvent.keyDown( input, { keyCode: ENTER } );

			expect( input.value ).toBe( '100' );
			expect( unitSelect.value ).toBe( 'px' );

			reset.focus();
			fireEvent.click( reset );

			expect( input.value ).toBe( '' );
			expect( unitSelect.value ).toBe( 'px' );
		} );

		it( 'should reset values when clicking Reset, if controlled <-> uncontrolled state changes', () => {
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
			const { container, getByText } = render( <Example /> );
			const input = container.querySelector( 'input' );
			const unitSelect = container.querySelector( 'select' );
			const reset = getByText( /Reset/ );

			input.focus();
			fireEvent.change( input, { target: { value: '100px' } } );
			fireEvent.keyDown( input, { keyCode: ENTER } );

			expect( input.value ).toBe( '100' );
			expect( unitSelect.value ).toBe( 'px' );

			reset.focus();
			fireEvent.click( reset );

			expect( input.value ).toBe( '' );
			expect( unitSelect.value ).toBe( 'px' );
		} );

		it( 'should persist cleared value when focus changes', () => {
			render( <BoxControl /> );
			const input = screen.getByLabelText( 'Box Control', {
				selector: 'input',
			} );
			const unitSelect = screen.getByLabelText( 'Select unit' );

			input.focus();
			fireEvent.change( input, { target: { value: '100%' } } );
			fireEvent.keyDown( input, { keyCode: ENTER } );

			expect( input.value ).toBe( '100' );
			expect( unitSelect.value ).toBe( '%' );

			fireEvent.change( input, { target: { value: '' } } );
			fireEvent.blur( input );

			expect( input.value ).toBe( '' );
		} );
	} );

	describe( 'Unlinked Sides', () => {
		it( 'should update a single side value when unlinked', () => {
			let state = {};
			const setState = ( newState ) => ( state = newState );

			const { container, getByLabelText } = render(
				<BoxControl
					values={ state }
					onChange={ ( next ) => setState( next ) }
				/>
			);

			const unlink = getByLabelText( /Unlink Sides/ );
			fireEvent.click( unlink );

			const input = container.querySelector( 'input' );
			const unitSelect = container.querySelector( 'select' );

			input.focus();
			fireEvent.change( input, { target: { value: '100px' } } );
			fireEvent.keyDown( input, { keyCode: ENTER } );

			expect( input.value ).toBe( '100' );
			expect( unitSelect.value ).toBe( 'px' );

			expect( state ).toEqual( {
				top: '100px',
				right: undefined,
				bottom: undefined,
				left: undefined,
			} );
		} );

		it( 'should update a whole axis when value is changed when unlinked', () => {
			let state = {};
			const setState = ( newState ) => ( state = newState );

			const { container, getByLabelText } = render(
				<BoxControl
					values={ state }
					onChange={ ( next ) => setState( next ) }
					splitOnAxis={ true }
				/>
			);

			const unlink = getByLabelText( /Unlink Sides/ );
			fireEvent.click( unlink );

			const input = container.querySelector( 'input' );
			const unitSelect = container.querySelector( 'select' );

			input.focus();
			fireEvent.change( input, { target: { value: '100px' } } );
			fireEvent.keyDown( input, { keyCode: ENTER } );

			expect( input.value ).toBe( '100' );
			expect( unitSelect.value ).toBe( 'px' );

			expect( state ).toEqual( {
				top: '100px',
				right: undefined,
				bottom: '100px',
				left: undefined,
			} );
		} );
	} );

	describe( 'Unit selections', () => {
		it( 'should update unlinked controls unit selection based on all input control', () => {
			// Render control.
			render( <BoxControl /> );

			// Make unit selection on all input control.
			const allUnitSelect = screen.getByLabelText( 'Select unit' );
			allUnitSelect.focus();
			fireEvent.change( allUnitSelect, { target: { value: 'em' } } );

			// Unlink the controls.
			const unlink = screen.getByLabelText( /Unlink Sides/ );
			fireEvent.click( unlink );

			// Confirm that each individual control has the selected unit
			const unlinkedSelects = screen.getAllByDisplayValue( 'em' );
			expect( unlinkedSelects.length ).toEqual( 4 );
		} );

		it( 'should use individual side attribute unit when available', () => {
			// Render control.
			const { rerender } = render( <BoxControl /> );

			// Make unit selection on all input control.
			const allUnitSelect = screen.getByLabelText( 'Select unit' );
			allUnitSelect.focus();
			fireEvent.change( allUnitSelect, { target: { value: 'vw' } } );

			// Unlink the controls.
			const unlink = screen.getByLabelText( /Unlink Sides/ );
			fireEvent.click( unlink );

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
		it( 'should call onChange when values contain more than just CSS units', () => {
			const setState = jest.fn();

			render( <BoxControl onChange={ setState } /> );

			const input = screen.getByLabelText( 'Box Control', {
				selector: 'input',
			} );

			input.focus();
			fireEvent.change( input, { target: { value: '7.5rem' } } );
			fireEvent.keyDown( input, { keyCode: ENTER } );

			expect( setState ).toHaveBeenCalledWith( {
				top: '7.5rem',
				right: '7.5rem',
				bottom: '7.5rem',
				left: '7.5rem',
			} );
		} );

		it( 'should not pass invalid CSS unit only values to onChange', () => {
			const setState = jest.fn();

			render( <BoxControl onChange={ setState } /> );

			const allUnitSelect = screen.getByLabelText( 'Select unit' );
			allUnitSelect.focus();
			fireEvent.change( allUnitSelect, { target: { value: 'rem' } } );

			expect( setState ).toHaveBeenCalledWith( {
				top: undefined,
				right: undefined,
				bottom: undefined,
				left: undefined,
			} );
		} );
	} );
} );
