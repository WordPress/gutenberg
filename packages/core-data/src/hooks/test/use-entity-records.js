/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';

jest.mock( '@wordpress/api-fetch' );

/**
 * External dependencies
 */
import { render, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { store as coreDataStore } from '../../index';
import useEntityRecords from '../use-entity-records';

describe( 'useEntityRecords', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistry();
		registry.register( coreDataStore );
	} );

	const TEST_RECORDS = [
		{ id: 1, hello: 'world1' },
		{ id: 2, hello: 'world2' },
		{ id: 3, hello: 'world3' },
	];

	it( 'resolves the entity records when missing from the state', async () => {
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

		expect( data ).toEqual( {
			records: null,
			hasResolved: false,
			hasStarted: false,
			isResolving: false,
			status: 'IDLE',
			totalItems: null,
			totalPages: null,
		} );

		// Fetch request should have been issued
		await waitFor( () =>
			expect( triggerFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/widgets?context=edit&status=draft',
			} )
		);

		expect( data ).toEqual( {
			records: TEST_RECORDS,
			hasResolved: true,
			hasStarted: true,
			isResolving: false,
			status: 'SUCCESS',
			totalItems: 3,
			totalPages: 1,
		} );
	} );
} );
