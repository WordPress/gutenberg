/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import useControlledState from '../use-controlled-state';

describe( 'hooks', () => {
	const getInput = () => screen.getByTestId( 'input' );

	describe( 'useControlledState', () => {
		const Example = ( { initial, value: valueProp, onChange = noop } ) => {
			const [ state, setState ] = useControlledState( valueProp, {
				initial,
			} );

			const handleOnChange = ( event ) => {
				const nextValue = event.target.value;
				setState( nextValue );
				onChange( nextValue );
			};

			return (
				<input
					data-testid="input"
					type="text"
					value={ state }
					onChange={ handleOnChange }
				/>
			);
		};

		it( 'should use incoming prop as state on initial render', () => {
			const spy = jest.fn();
			render( <Example value="Hello" onChange={ spy } /> );

			const input = getInput();

			expect( input.value ).toBe( 'Hello' );
			expect( spy ).not.toHaveBeenCalled();
		} );

		it( 'should update rendered value onChange', () => {
			const spy = jest.fn();
			render( <Example onChange={ spy } /> );

			const input = getInput();

			fireEvent.change( input, { target: { value: 'There' } } );

			expect( input.value ).toBe( 'There' );
			expect( spy ).toHaveBeenCalledTimes( 1 );

			fireEvent.change( input, { target: { value: 'Hello There' } } );

			expect( input.value ).toBe( 'Hello There' );
			expect( spy ).toHaveBeenCalledTimes( 2 );
		} );

		/**
		 * This test demonstrates the primary feature of the useControlledState
		 * hook. The <Example /> component receives an initial prop value
		 * which is used as the initial internal state.
		 *
		 * This internal state can be maintained and updated without
		 * relying on new incoming prop values.
		 *
		 * Unlike the basic useState hook, useControlledState's state can
		 * be updated if a new incoming prop value is changed.
		 */
		it( 'should update changed value with new incoming prop value', () => {
			const spy = jest.fn();

			/**
			 * The <input /> value starts with "Hello", since it is passed down
			 * from props. The prop being rendered is the state provided by
			 * useControlledState, rather than the value prop directly.
			 */
			const { rerender } = render( <Example onChange={ spy } /> );

			const input = getInput();

			/**
			 * When the <input /> changes, it updates the internal state value.
			 */
			fireEvent.change( input, { target: { value: 'There' } } );

			expect( input.value ).toBe( 'There' );

			/**
			 * If a new value prop is passed down, it will update the
			 * internal state value, which will be rerendered into
			 * the <input />.
			 */
			rerender( <Example value="New Value" /> );

			expect( input.value ).toBe( 'New Value' );
			expect( spy ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should render with initial value and be controllable', () => {
			const spy = jest.fn();
			// Input starts off as being uncontrolled / self-managed.
			const { rerender } = render(
				<Example onChange={ spy } initial="Hello" />
			);
			const input = getInput();

			expect( input.value ).toBe( 'Hello' );

			fireEvent.change( input, { target: { value: 'There' } } );

			expect( input.value ).toBe( 'There' );
			expect( spy ).toHaveBeenCalledWith( 'There' );

			// Input is now controlled.
			rerender( <Example value="New Value" /> );
			expect( input.value ).toBe( 'New Value' );

			fireEvent.change( input, {
				target: { value: 'New Change Value' },
			} );

			// Since the Input is being controlled by a parent element,
			// the internal state is no longer used. Instead, the incoming
			// prop value will be used.
			expect( input.value ).toBe( 'New Value' );
		} );
	} );
} );
