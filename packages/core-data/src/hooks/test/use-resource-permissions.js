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

		triggerFetch.mockImplementation( () => ( {
			headers: {
				get: () => ( {
					allow: 'POST',
				} ),
			},
		} ) );
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	it( 'retrieves the relevant permissions for a key-less resource', async () => {
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
		expect( data ).toEqual( {
			status: 'IDLE',
			isResolving: false,
			hasResolved: false,
			canCreate: false,
			canRead: false,
		} );

		// Required to make sure no updates happen outside of act()
		await act( async () => {
			jest.advanceTimersByTime( 1 );
		} );

		expect( data ).toEqual( {
			status: 'SUCCESS',
			isResolving: false,
			hasResolved: true,
			canCreate: true,
			canRead: false,
		} );
	} );

	it( 'retrieves the relevant permissions for a resource with a key', async () => {
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
		expect( data ).toEqual( {
			status: 'IDLE',
			isResolving: false,
			hasResolved: false,
			canCreate: false,
			canRead: false,
			canUpdate: false,
			canDelete: false,
		} );

		// Required to make sure no updates happen outside of act()
		await act( async () => {
			jest.advanceTimersByTime( 1 );
		} );

		expect( data ).toEqual( {
			status: 'SUCCESS',
			isResolving: false,
			hasResolved: true,
			canCreate: true,
			canRead: false,
			canUpdate: false,
			canDelete: false,
		} );
	} );
} );
