import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import triggerFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import type { ReactNode } from 'react';
import { store as coreDataStore } from '../../index';
import useEntityRecord from '../use-entity-record';

vi.mock( import( '@wordpress/api-fetch' ) );

// The tests stub REST responses in place of typed requests.
const apiFetchMock = triggerFetch as unknown as Mock<
	( options: { path: string; parse?: boolean } ) => unknown
>;

describe( 'useEntityRecord', () => {
	let registry: ReturnType< typeof createRegistry >;

	beforeEach( () => {
		registry = createRegistry();
		registry.register( coreDataStore );
		apiFetchMock.mockReset();
	} );

	function renderHookWithRegistry< Result, Props >(
		hook: ( props: Props ) => Result,
		options: { initialProps?: Props } = {}
	) {
		const Wrapper = ( { children }: { children?: ReactNode } ) =>
			createElement( RegistryProvider, { value: registry }, children );
		return renderHook( hook, { wrapper: Wrapper, ...options } );
	}

	const TEST_RECORD = { id: 1, hello: 'world' };
	const TEST_RECORD_RESPONSE = { json: () => Promise.resolve( TEST_RECORD ) };

	it( 'resolves the entity record when missing from the state', async () => {
		// Provide response
		apiFetchMock.mockImplementation( () => TEST_RECORD_RESPONSE );

		const { result } = renderHookWithRegistry( () =>
			useEntityRecord( 'root', 'widget', 1 )
		);

		expect( result.current ).toEqual( {
			edit: expect.any( Function ),
			editedRecord: false,
			hasEdits: false,
			edits: {},
			record: null,
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

		expect( result.current ).toEqual( {
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
		apiFetchMock.mockImplementation( () => TEST_RECORD_RESPONSE );

		const { result } = renderHookWithRegistry( () =>
			useEntityRecord( 'root', 'widget', 1 )
		);

		await waitFor( () =>
			expect( result.current ).toEqual( {
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
			result.current.edit( { hello: 'foo' } );
		} );

		await waitFor( () =>
			expect( result.current.hasEdits ).toEqual( true )
		);

		expect( result.current.record ).toEqual( { hello: 'world', id: 1 } );
		expect( result.current.editedRecord ).toEqual( {
			hello: 'foo',
			id: 1,
		} );
		expect( result.current.edits ).toEqual( { hello: 'foo' } );
	} );

	it( 'does not resolve entity record when disabled via options', async () => {
		apiFetchMock.mockImplementation( () => TEST_RECORD_RESPONSE );

		const { result, rerender } = renderHookWithRegistry(
			( { enabled } ) =>
				useEntityRecord( 'root', 'widget', 1, { enabled } ),
			{ initialProps: { enabled: true } }
		);

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
		apiFetchMock.mockReset();

		rerender( { enabled: false } );

		expect( result.current ).toEqual( {
			edit: expect.any( Function ),
			editedRecord: {},
			hasEdits: false,
			edits: {},
			record: null,
			save: expect.any( Function ),
			hasResolved: false,
			hasStarted: false,
			isResolving: false,
			status: 'IDLE',
		} );

		// The same delay.
		await act(
			() => new Promise( ( resolve ) => setTimeout( resolve, 0 ) )
		);
		expect( triggerFetch ).toHaveBeenCalledTimes( 0 );
	} );
} );
