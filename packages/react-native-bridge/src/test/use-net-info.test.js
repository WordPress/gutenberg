/**
 * External dependencies
 */
import { renderHook } from 'test/helpers';

/**
 * Internal dependencies
 */
import useNetInfo from '../use-net-info';

describe( 'useNetInfo', () => {
	describe( 'when the network is online', () => {
		it( 'should return a truthy value', () => {
			const { result } = renderHook( () => useNetInfo() );

			expect( result.current.isConnected ).toBeTruthy();
		} );
	} );

	describe( 'when the network is offline', () => {
		it( 'should return a falsy value', () => {
			const { result } = renderHook( () => useNetInfo() );

			expect( result.current.isConnected ).toBeFalsy();
		} );
	} );
} );
