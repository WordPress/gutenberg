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
import useEntityRecords from '../use-entity-records';

describe( 'useEntityRecords', () => {
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

	const TEST_RECORDS = [
		{ id: 1, hello: 'world1' },
		{ id: 2, hello: 'world2' },
		{ id: 3, hello: 'world3' },
	];

	it( 'retrieves the relevant entity record', async () => {
		let data;
		await registry
			.dispatch( coreDataStore )
			.receiveEntityRecords( 'root', 'widget', TEST_RECORDS, {} );
		const TestComponent = () => {
			data = useEntityRecords( 'root', 'widget' );
			return <div />;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);
		expect( data ).toEqual( {
			records: TEST_RECORDS,
			hasResolved: false,
			isResolving: false,
			status: 'IDLE',
		} );

		// Required to make sure no updates happen outside of act()
		await act( async () => {
			jest.advanceTimersByTime( 1 );
		} );

		expect( data ).toEqual( {
			records: TEST_RECORDS,
			hasResolved: true,
			isResolving: false,
			status: 'SUCCESS',
		} );
	} );

	it( 'resolves the entity if missing from state', async () => {
		// Provide response
		triggerFetch.mockImplementation( () => TEST_RECORDS );

		let data;
		const TestComponent = () => {
			data = useEntityRecords( 'root', 'widget', { status: 'draft' } );
			return <div />;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		await act( async () => {
			jest.advanceTimersByTime( 1 );
		} );

		// Fetch request should have been issued
		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/widgets?context=edit&status=draft',
		} );

		expect( data ).toEqual( {
			records: TEST_RECORDS,
			hasResolved: true,
			isResolving: false,
			status: 'SUCCESS',
		} );
	} );
} );
