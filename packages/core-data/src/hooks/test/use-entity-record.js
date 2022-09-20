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

	it( 'resolves the entity record when missing from the state', async () => {
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

		expect( data ).toEqual( {
			edit: expect.any( Function ),
			editedRecord: {},
			hasEdits: false,
			record: undefined,
			save: expect.any( Function ),
			hasResolved: false,
			isResolving: false,
			status: 'IDLE',
		} );

		await act( async () => {
			jest.advanceTimersByTime( 1 );
		} );

		// Fetch request should have been issued
		expect( triggerFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/widgets/1?context=edit',
		} );

		expect( data ).toEqual( {
			edit: expect.any( Function ),
			editedRecord: { hello: 'world', id: 1 },
			hasEdits: false,
			record: { hello: 'world', id: 1 },
			save: expect.any( Function ),
			hasResolved: true,
			isResolving: false,
			status: 'SUCCESS',
		} );
	} );

	it( 'applies edits to the entity record', async () => {
		// Provide response
		triggerFetch.mockImplementation( () => TEST_RECORD );

		let widget;
		const TestComponent = () => {
			widget = useEntityRecord( 'root', 'widget', 1 );
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

		expect( widget ).toEqual( {
			edit: expect.any( Function ),
			editedRecord: { hello: 'world', id: 1 },
			hasEdits: false,
			record: { hello: 'world', id: 1 },
			save: expect.any( Function ),
			hasResolved: true,
			isResolving: false,
			status: 'SUCCESS',
		} );

		await act( async () => {
			widget.edit( { hello: 'foo' } );
			jest.advanceTimersByTime( 1 );
		} );

		expect( widget.hasEdits ).toEqual( true );
		expect( widget.record ).toEqual( { hello: 'world', id: 1 } );
		expect( widget.editedRecord ).toEqual( { hello: 'foo', id: 1 } );
	} );
} );
