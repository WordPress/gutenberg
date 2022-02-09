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
import useEntityRecord from '../use-entity-record';

describe( 'useEntityRecord', () => {
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

	const TEST_RECORD = { id: 1, hello: 'world' };

	it( 'retrieves the relevant entity record', async () => {
		let data;
		await registry
			.dispatch( coreDataStore )
			.receiveEntityRecords( 'root', 'widget', [ TEST_RECORD ] );
		const TestComponent = () => {
			data = useEntityRecord( 'root', 'widget', 1 );
			return <div />;
		};
		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);
		expect( data ).toEqual( {
			record: TEST_RECORD,
			editedRecord: TEST_RECORD,
			hasEdits: false,
			hasResolved: false,
			isResolving: false,
			status: 'IDLE',
		} );

		// Required to make sure no updates happen outside of act()
		await act( async () => {
			jest.advanceTimersByTime( 1 );
		} );
	} );

	it( 'resolves the entity if missing from state', async () => {
		// Provide response
		triggerFetch.mockImplementation( () => TEST_RECORD );

		let data;
		const TestComponent = () => {
			data = useEntityRecord( 'root', 'widget', 1 );
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
			path: '/wp/v2/widgets/1?context=edit',
		} );

		expect( data ).toEqual( {
			record: { hello: 'world', id: 1 },
			editedRecord: { hello: 'world', id: 1 },
			hasEdits: false,
			hasResolved: true,
			isResolving: false,
			status: 'SUCCESS',
		} );
	} );
} );
