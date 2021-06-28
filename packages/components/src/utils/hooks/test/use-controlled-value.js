/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react-hooks';

/**
 * Internal dependencies
 */
import { useControlledValue } from '../use-controlled-value';

describe( 'useControlledValue', () => {
	it( 'should use the default value', () => {
		const { result } = renderHook( () =>
			useControlledValue( { defaultValue: 'WordPress.org' } )
		);

		expect( result.current[ 0 ] ).toEqual( 'WordPress.org' );
	} );

	it( 'should use the default value then switch to the controlled value', () => {
		const { result, rerender } = renderHook(
			( { value } ) =>
				useControlledValue( { defaultValue: 'WordPress.org', value } ),
			{ initialProps: { value: undefined } }
		);
		expect( result.current[ 0 ] ).toEqual( 'WordPress.org' );

		rerender( { value: 'Code is Poetry' } );

		expect( result.current[ 0 ] ).toEqual( 'Code is Poetry' );
	} );

	it( 'should not call onChange only when there is no value being passed in', () => {
		const onChange = jest.fn();
		const { result } = renderHook( () =>
			useControlledValue( { defaultValue: 'WordPress.org', onChange } )
		);

		expect( result.current[ 0 ] ).toEqual( 'WordPress.org' );

		act( () => {
			result.current[ 1 ]( 'Code is Poetry' );
		} );

		expect( result.current[ 0 ] ).toEqual( 'Code is Poetry' );
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'should call onChange when there is a value passed in', () => {
		const onChange = jest.fn();
		const { result, rerender } = renderHook(
			( { value } ) =>
				useControlledValue( {
					defaultValue: 'WordPress.org',
					value,
					onChange,
				} ),
			{ initialProps: { value: 'Code is Poetry' } }
		);

		expect( result.current[ 0 ] ).toEqual( 'Code is Poetry' );

		act( () => {
			// simulate `setValue` getting called by an input
			result.current[ 1 ]( 'WordPress rocks!' );
		} );

		// simulate the parent re-rendering and passing a new value down
		rerender( { value: 'WordPress rocks!' } );

		expect( result.current[ 0 ] ).toEqual( 'WordPress rocks!' );
		expect( onChange ).toHaveBeenCalledWith( 'WordPress rocks!' );
	} );

	it( 'should not maintain internal state if no onChange is passed but a value is passed', () => {
		const { result, rerender } = renderHook(
			( { value } ) => useControlledValue( { value } ),
			{ initialProps: { value: undefined } }
		);

		expect( result.current[ 0 ] ).toBe( undefined );

		rerender( { value: 'Code is Poetry' } );

		expect( result.current[ 0 ] ).toEqual( 'Code is Poetry' );

		act( () => {
			// call setState which will be the internal state rather than
			// the onChange prop (as no onChange was passed in)

			// primarily this proves that the hook doesn't break if no onChange is passed but
			// value turns into a controlled state, for example if the value needs to be set
			// to a constant in certain conditions but no change listening needs to happen
			result.current[ 1 ]( 'WordPress.org' );
		} );

		// If `value` is passed then we expect the value to be fully controlled
		// meaning that the value passed in will always be used even though
		// we're managing internal state.
		expect( result.current[ 0 ] ).toEqual( 'Code is Poetry' );

		// Next we un-set the value to uncover the internal state which was still maintained
		rerender( { value: undefined } );

		expect( result.current[ 0 ] ).toEqual( 'WordPress.org' );
	} );
} );
