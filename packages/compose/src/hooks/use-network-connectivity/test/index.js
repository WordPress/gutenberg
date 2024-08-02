/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useNetworkConnectivity from '../index';

describe( 'useNetworkConnectivity', () => {
	describe( 'when network connectivity is available', () => {
		beforeAll( () => {
			jest.spyOn( window.navigator, 'onLine', 'get' ).mockReturnValue(
				true
			);
		} );
		it( 'should return true', () => {
			const { result } = renderHook( () => useNetworkConnectivity() );

			expect( result.current.isConnected ).toBe( true );
		} );

		it( 'should update the status when network connectivity changes', () => {
			let { result } = renderHook( () => useNetworkConnectivity() );

			expect( result.current.isConnected ).toBe( true );

			jest.spyOn( window.navigator, 'onLine', 'get' ).mockReturnValue(
				false
			);

			result = renderHook( () => useNetworkConnectivity() ).result;

			expect( result.current.isConnected ).toBe( false );
		} );
	} );

	describe( 'when network connectivity is unavailable', () => {
		beforeAll( () => {
			jest.spyOn( window.navigator, 'onLine', 'get' ).mockReturnValue(
				false
			);
		} );
		it( 'should return false', () => {
			const { result } = renderHook( () => useNetworkConnectivity() );

			expect( result.current.isConnected ).toBe( false );
		} );

		it( 'should update the status when network connectivity changes', () => {
			let { result } = renderHook( () => useNetworkConnectivity() );

			expect( result.current.isConnected ).toBe( false );

			jest.spyOn( window.navigator, 'onLine', 'get' ).mockReturnValue(
				true
			);

			result = renderHook( () => useNetworkConnectivity() ).result;

			expect( result.current.isConnected ).toBe( true );
		} );
	} );
} );
