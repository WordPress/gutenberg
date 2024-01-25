/**
 * External dependencies
 */
import { act, renderHook } from 'test/helpers';

/**
 * WordPress dependencies
 */
import {
	requestConnectionStatus,
	subscribeConnectionStatus,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import useNetworkConnectivity from '../index';

describe( 'useNetworkConnectivity', () => {
	it( 'should optimisitically presume network connectivity', () => {
		const { result } = renderHook( () => useNetworkConnectivity() );

		expect( result.current.isConnected ).toBe( true );
	} );

	describe( 'when network connectivity is available', () => {
		beforeAll( () => {
			requestConnectionStatus.mockImplementation( ( callback ) => {
				callback( true );
				return { remove: jest.fn() };
			} );
		} );

		it( 'should return true', () => {
			const { result } = renderHook( () => useNetworkConnectivity() );

			expect( result.current.isConnected ).toBe( true );
		} );

		it( 'should update the status when network connectivity changes', () => {
			let subscriptionCallback;
			subscribeConnectionStatus.mockImplementation( ( callback ) => {
				subscriptionCallback = callback;
				return { remove: jest.fn() };
			} );

			const { result } = renderHook( () => useNetworkConnectivity() );

			expect( result.current.isConnected ).toBe( true );

			act( () => subscriptionCallback( { isConnected: false } ) );

			expect( result.current.isConnected ).toBe( false );
		} );
	} );

	describe( 'when network connectivity is unavailable', () => {
		beforeAll( () => {
			requestConnectionStatus.mockImplementation( ( callback ) => {
				callback( false );
				return { remove: jest.fn() };
			} );
		} );

		it( 'should return false', () => {
			const { result } = renderHook( () => useNetworkConnectivity() );

			expect( result.current.isConnected ).toBe( false );
		} );

		it( 'should update the status when network connectivity changes', () => {
			let subscriptionCallback;
			subscribeConnectionStatus.mockImplementation( ( callback ) => {
				subscriptionCallback = callback;
				return { remove: jest.fn() };
			} );

			const { result } = renderHook( () => useNetworkConnectivity() );

			expect( result.current.isConnected ).toBe( false );

			act( () => subscriptionCallback( { isConnected: true } ) );

			expect( result.current.isConnected ).toBe( true );
		} );
	} );
} );
