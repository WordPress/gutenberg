/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import usePrevious from '..';

describe( 'usePrevious', () => {
	it( 'should return the previous value', () => {
		const { result, rerender } = renderHook(
			( { value } ) => usePrevious( value ),
			{ initialProps: { value: 1 } }
		);
		expect( result.current ).toBeUndefined();
		rerender( { value: 2 } );
		expect( result.current ).toBe( 1 );
		rerender( { value: 3 } );
		expect( result.current ).toBe( 2 );
	} );
} );
