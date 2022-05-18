/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';

jest.mock( '@wordpress/api-fetch' );

/**
 * External dependencies
 */
import { act, render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { store as coreDataStore } from '../../index';
import useResourcePermissions from '../use-resource-permissions';

describe( 'useResourcePermissions', () => {
	let registry;
	beforeEach( () => {
		jest.useFakeTimers();

		registry = createRegistry();
		registry.register( coreDataStore );
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	it( 'retrieves the relevant permissions for a key-less resource', async () => {
		triggerFetch.mockImplementation( () => ( {
			headers: {
				Allow: 'POST',
			},
		} ) );
		let data;
		const TestComponent = () => {
			data = useResourcePermissions( 'widgets' );
			return <div />;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);
		expect( data ).toEqual( [
			false,
			{
				status: 'IDLE',
				isResolving: false,
				canCreate: false,
			},
		] );

		// Required to make sure no updates happen outside of act()
		await act( async () => {
			jest.advanceTimersByTime( 1 );
		} );

		expect( data ).toEqual( [
			true,
			{
				status: 'SUCCESS',
				isResolving: false,
				canCreate: true,
			},
		] );
	} );

	it( 'retrieves the relevant permissions for a resource with a key', async () => {
		triggerFetch.mockImplementation( () => ( {
			headers: {
				Allow: 'POST',
			},
		} ) );
		let data;
		const TestComponent = () => {
			data = useResourcePermissions( 'widgets', 1 );
			return <div />;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);
		expect( data ).toEqual( [
			false,
			{
				status: 'IDLE',
				isResolving: false,
				canCreate: false,
				canUpdate: false,
				canDelete: false,
			},
		] );

		// Required to make sure no updates happen outside of act()
		await act( async () => {
			jest.advanceTimersByTime( 1 );
		} );

		expect( data ).toEqual( [
			true,
			{
				status: 'SUCCESS',
				isResolving: false,
				canCreate: true,
				canUpdate: false,
				canDelete: false,
			},
		] );
	} );
} );
