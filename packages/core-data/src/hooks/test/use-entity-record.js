/**
 * WordPress dependencies
 */
import triggerFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';

jest.mock( '@wordpress/api-fetch' );

/**
 * External dependencies
 */
import { act, render, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { store as coreDataStore } from '../../index';
import useEntityRecord from '../use-entity-record';

describe( 'useEntityRecord', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistry();
		registry.register( coreDataStore );
		triggerFetch.mockReset();
	} );

	const TEST_RECORD = { id: 1, hello: 'world' };
	const TEST_RECORD_RESPONSE = { json: () => Promise.resolve( TEST_RECORD ) };

	it( 'resolves the entity record when missing from the state', async () => {
		// Provide response
		triggerFetch.mockImplementation( () => TEST_RECORD_RESPONSE );

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
			editedRecord: false,
			hasEdits: false,
			edits: {},
			record: undefined,
			save: expect.any( Function ),
			hasResolved: false,
			hasStarted: false,
			isResolving: false,
			status: 'IDLE',
		} );

		// Fetch request should have been issued
		await waitFor( () =>
			expect( triggerFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/widgets/1?context=edit',
				parse: false,
			} )
		);

		expect( data ).toEqual( {
			edit: expect.any( Function ),
			editedRecord: { hello: 'world', id: 1 },
			hasEdits: false,
			edits: {},
			record: { hello: 'world', id: 1 },
			save: expect.any( Function ),
			hasResolved: true,
			hasStarted: true,
			isResolving: false,
			status: 'SUCCESS',
		} );
	} );

	it( 'applies edits to the entity record', async () => {
		// Provide response
		triggerFetch.mockImplementation( () => TEST_RECORD_RESPONSE );

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

		await waitFor( () =>
			expect( widget ).toEqual( {
				edit: expect.any( Function ),
				editedRecord: { hello: 'world', id: 1 },
				hasEdits: false,
				edits: {},
				record: { hello: 'world', id: 1 },
				save: expect.any( Function ),
				hasResolved: true,
				hasStarted: true,
				isResolving: false,
				status: 'SUCCESS',
			} )
		);

		await act( async () => {
			widget.edit( { hello: 'foo' } );
		} );

		await waitFor( () => expect( widget.hasEdits ).toEqual( true ) );

		expect( widget.record ).toEqual( { hello: 'world', id: 1 } );
		expect( widget.editedRecord ).toEqual( { hello: 'foo', id: 1 } );
		expect( widget.edits ).toEqual( { hello: 'foo' } );
	} );

	it( 'does not resolve entity record when disabled via options', async () => {
		triggerFetch.mockImplementation( () => TEST_RECORD_RESPONSE );

		let data;
		const TestComponent = ( { enabled } ) => {
			data = useEntityRecord( 'root', 'widget', 1, { enabled } );
			return <div />;
		};
		const UI = ( { enabled } ) => (
			<RegistryProvider value={ registry }>
				<TestComponent enabled={ enabled } />
			</RegistryProvider>
		);

		const { rerender } = render( <UI enabled /> );

		// A minimum delay for a fetch request. The same delay is used again as a control.
		await act(
			() => new Promise( ( resolve ) => setTimeout( resolve, 0 ) )
		);
		await waitFor( () =>
			expect( triggerFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/widgets/1?context=edit',
				parse: false,
			} )
		);
		// Clear the fetch call history.
		triggerFetch.mockReset();

		rerender( <UI enabled={ false } /> );

		expect( data ).toEqual( {
			edit: expect.any( Function ),
			editedRecord: {},
			hasEdits: false,
			edits: {},
			record: null,
			save: expect.any( Function ),
		} );

		// The same delay.
		await act(
			() => new Promise( ( resolve ) => setTimeout( resolve, 0 ) )
		);
		expect( triggerFetch ).toHaveBeenCalledTimes( 0 );
	} );
} );
