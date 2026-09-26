import { beforeEach, expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import usePageHierarchy from '../use-page-hierarchy';

vi.mock( '@wordpress/api-fetch' );

const query = { per_page: 2, orderby: 'title' };
const response = ( records, totalPages = 2 ) => ( {
	json: async () => records,
	headers: { get: () => String( totalPages ) },
} );

beforeEach( () => vi.mocked( apiFetch ).mockReset() );

test( 'loads root and each expanded parent independently without losing earlier pages', async () => {
	apiFetch.mockImplementation( async ( { path } = {} ) => {
		if ( ! path ) {
			return response( [], 1 );
		}
		const params = new URLSearchParams( path.split( '?' )[ 1 ] );
		const parent = Number( params.get( 'parent' ) );
		const page = Number( params.get( 'page' ) );
		return response(
			parent === 0
				? [ { id: page } ]
				: [ { id: parent * 10 + page, parent } ]
		);
	} );
	const { result } = renderHook( () =>
		usePageHierarchy( true, query, 'initial' )
	);
	await waitFor( () => expect( result.current.records ).toHaveLength( 1 ) );
	await act( async () => {
		await Promise.all( [
			result.current.load( '1' ),
			result.current.load( '2' ),
		] );
	} );
	await waitFor( () => expect( result.current.records ).toHaveLength( 3 ) );
	await act( async () => result.current.load( '1' ) );
	await waitFor( () => expect( result.current.records ).toHaveLength( 4 ) );
	await act( async () => result.current.load( null ) );
	await waitFor( () => expect( result.current.records ).toHaveLength( 5 ) );
	expect( result.current.records.map( ( record ) => record.id ) ).toEqual( [
		1, 2, 11, 12, 21,
	] );
	expect( result.current.getPaginationInfo( '1' ).hasMore ).toBe( false );
	expect( result.current.getPaginationInfo( '2' ).hasMore ).toBe( true );
	expect(
		apiFetch.mock.calls
			.map( ( [ options ] ) => options?.path )
			.filter( Boolean )
	).toHaveLength( 5 );
} );

test( 'retries only a failed parent and treats an empty child response as a leaf', async () => {
	apiFetch.mockResolvedValueOnce( response( [ { id: 1 } ], 1 ) );
	apiFetch.mockRejectedValueOnce( {
		json: async () => ( { message: '<b>Permission denied</b>' } ),
	} );
	apiFetch.mockResolvedValueOnce( response( [], 1 ) );
	const { result } = renderHook( () =>
		usePageHierarchy( true, query, 'initial' )
	);
	await waitFor( () => expect( result.current.records ).toHaveLength( 1 ) );
	await act( async () => result.current.load( '1' ) );
	await waitFor( () =>
		expect( result.current.getPaginationInfo( '1' ).error ).toBe(
			'Permission denied'
		)
	);
	await act( async () => result.current.load( '1' ) );
	await waitFor( () =>
		expect( result.current.getPaginationInfo( '1' ).hasMore ).toBe( false )
	);
	expect( result.current.records ).toHaveLength( 1 );
	expect( apiFetch ).toHaveBeenCalledTimes( 3 );
} );

test( 'retries a failed root request without loading children', async () => {
	apiFetch.mockRejectedValueOnce( new Response( null, { status: 503 } ) );
	apiFetch.mockResolvedValueOnce( response( [ { id: 1 } ], 1 ) );
	const { result } = renderHook( () =>
		usePageHierarchy( true, query, 'initial' )
	);
	await waitFor( () =>
		expect( result.current.getPaginationInfo( null ).error ).toBe(
			'Could not load pages. Try again.'
		)
	);
	await act( async () => result.current.load( null ) );
	expect( result.current.records ).toEqual( [ { id: 1 } ] );
	expect( apiFetch.mock.calls ).toHaveLength( 2 );
} );

test( 'restarts an interrupted root request when hierarchy is re-enabled', async () => {
	let finishOldRequest;
	apiFetch.mockImplementationOnce(
		() => new Promise( ( resolve ) => ( finishOldRequest = resolve ) )
	);
	apiFetch.mockResolvedValueOnce( response( [ { id: 2 } ], 1 ) );
	const { result, rerender } = renderHook(
		( { enabled } ) => usePageHierarchy( enabled, query, 'same' ),
		{ initialProps: { enabled: true } }
	);
	await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
	rerender( { enabled: false } );
	rerender( { enabled: true } );
	await waitFor( () =>
		expect( result.current.records ).toEqual( [ { id: 2 } ] )
	);
	await act( async () => finishOldRequest( response( [ { id: 1 } ] ) ) );
	expect( result.current.records ).toEqual( [ { id: 2 } ] );
} );

test( 'drops responses from a previous query', async () => {
	let finishOldRequest;
	apiFetch.mockImplementationOnce(
		() => new Promise( ( resolve ) => ( finishOldRequest = resolve ) )
	);
	apiFetch.mockResolvedValueOnce( response( [ { id: 2 } ], 1 ) );
	const { result, rerender } = renderHook(
		( { key } ) => usePageHierarchy( true, query, key ),
		{ initialProps: { key: 'old' } }
	);
	await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
	rerender( { key: 'new' } );
	await waitFor( () =>
		expect( result.current.records.map( ( record ) => record.id ) ).toEqual(
			[ 2 ]
		)
	);
	await act( async () => finishOldRequest( response( [ { id: 1 } ] ) ) );
	expect( result.current.records.map( ( record ) => record.id ) ).toEqual( [
		2,
	] );
} );
