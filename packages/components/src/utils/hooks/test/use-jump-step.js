/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { SHIFT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import useJumpStep from '../use-jump-step';

const getInput = () => screen.getByTestId( 'input' );

describe( 'hooks', () => {
	describe( 'useJumpStep', () => {
		const Example = ( {
			value: valueProp,
			onChange = noop,
			step = 1,
			shiftStep = 10,
			isShiftStepEnabled = true,
		} ) => {
			const [ state, setState ] = useState( valueProp );
			const jumpStep = useJumpStep( {
				step,
				shiftStep,
				isShiftStepEnabled,
			} );

			const handleOnChange = ( event ) => {
				const nextValue = event.target.value;
				setState( nextValue );
				onChange( nextValue );
			};

			return (
				<input
					data-testid="input"
					type="number"
					value={ state }
					onChange={ handleOnChange }
					step={ jumpStep }
				/>
			);
		};

		it( 'should use initial step value', () => {
			render( <Example value={ 10 } step={ 66 } /> );
			const input = getInput();

			expect( input.getAttribute( 'step' ) ).toBe( '66' );
		} );

		it( 'should modify step value on shift key down/up press', () => {
			render( <Example value={ 10 } /> );
			const input = getInput();

			expect( input.getAttribute( 'step' ) ).toBe( '1' );

			fireEvent.keyDown( window, { keyCode: SHIFT, shiftKey: true } );

			expect( input.getAttribute( 'step' ) ).toBe( '10' );

			fireEvent.keyUp( window, { keyCode: SHIFT, shiftKey: false } );

			expect( input.getAttribute( 'step' ) ).toBe( '1' );
		} );

		it( 'should not jump step if disabled', () => {
			render(
				<Example
					value={ 10 }
					isShiftStepEnabled={ false }
					step={ 1 }
					shiftStep={ 15 }
				/>
			);
			const input = getInput();

			expect( input.getAttribute( 'step' ) ).toBe( '1' );

			fireEvent.keyDown( window, { keyCode: SHIFT, shiftKey: true } );

			expect( input.getAttribute( 'step' ) ).toBe( '1' );

			fireEvent.keyUp( window, { keyCode: SHIFT, shiftKey: false } );

			expect( input.getAttribute( 'step' ) ).toBe( '1' );
		} );

		it( 'should calculate jumpStep value, using step as a multiplier to shiftStep', () => {
			render( <Example value={ 10 } step={ 0.5 } shiftStep={ 10 } /> );
			const input = getInput();

			expect( input.getAttribute( 'step' ) ).toBe( '0.5' );

			fireEvent.keyDown( window, { keyCode: SHIFT, shiftKey: true } );

			expect( input.getAttribute( 'step' ) ).toBe( '5' );

			fireEvent.keyUp( window, { keyCode: SHIFT, shiftKey: false } );

			expect( input.getAttribute( 'step' ) ).toBe( '0.5' );
		} );

		it( 'should allow for float values in step and shiftStep', () => {
			render( <Example value={ 10 } step={ 0.001 } shiftStep={ 10 } /> );
			const input = getInput();

			expect( input.getAttribute( 'step' ) ).toBe( '0.001' );

			fireEvent.keyDown( window, { keyCode: SHIFT, shiftKey: true } );

			expect( input.getAttribute( 'step' ) ).toBe( '0.01' );

			fireEvent.keyUp( window, { keyCode: SHIFT, shiftKey: false } );

			expect( input.getAttribute( 'step' ) ).toBe( '0.001' );
		} );
	} );
} );
