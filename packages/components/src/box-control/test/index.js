/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react';

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
								// This reverts it to being uncontrolled
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
	} );
} );
