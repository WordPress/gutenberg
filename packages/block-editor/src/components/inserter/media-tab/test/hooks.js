/**
 * External dependencies
 */
import { renderHook, act, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useDelayedLoading, useMediaResults } from '../hooks';

describe( 'useDelayedLoading', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );
	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'does not surface loading before the delay elapses', () => {
		const { result } = renderHook( () => useDelayedLoading( true, 400 ) );
		expect( result.current ).toBe( false );
		act( () => {
			jest.advanceTimersByTime( 399 );
		} );
		expect( result.current ).toBe( false );
	} );

	it( 'surfaces loading once the delay elapses', () => {
		const { result } = renderHook( () => useDelayedLoading( true, 400 ) );
		act( () => {
			jest.advanceTimersByTime( 400 );
		} );
		expect( result.current ).toBe( true );
	} );

	it( 'never surfaces loading for an operation that ends before the delay', () => {
		const { result, rerender } = renderHook(
			( { isLoading } ) => useDelayedLoading( isLoading, 400 ),
			{ initialProps: { isLoading: true } }
		);
		act( () => {
			jest.advanceTimersByTime( 200 );
		} );
		rerender( { isLoading: false } );
		act( () => {
			jest.advanceTimersByTime( 400 );
		} );
		expect( result.current ).toBe( false );
	} );

	it( 'resets once loading finishes', () => {
		const { result, rerender } = renderHook(
			( { isLoading } ) => useDelayedLoading( isLoading, 400 ),
			{ initialProps: { isLoading: true } }
		);
		act( () => {
			jest.advanceTimersByTime( 400 );
		} );
		expect( result.current ).toBe( true );
		rerender( { isLoading: false } );
		expect( result.current ).toBe( false );
	} );
} );

describe( 'useMediaResults', () => {
	const createCategory = ( name, items ) => ( {
		name,
		fetch: jest.fn( async () => items ),
	} );

	it( 'fetches and returns media for the query', async () => {
		const category = createCategory( 'images', [ { id: 1 } ] );
		const { result } = renderHook( () =>
			useMediaResults( category, { search: '' }, 0 )
		);
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( category.fetch ).toHaveBeenCalledWith( { search: '' } );
		expect( result.current.mediaList ).toEqual( [ { id: 1 } ] );
	} );

	it( 'clears the previous results when the query changes', async () => {
		const category = createCategory( 'images', [ { id: 1 } ] );
		const { result, rerender } = renderHook(
			( { query } ) => useMediaResults( category, query, 0 ),
			{ initialProps: { query: { search: 'a' } } }
		);
		await waitFor( () =>
			expect( result.current.mediaList ).toEqual( [ { id: 1 } ] )
		);

		// Hold the next request open so the intermediate (cleared) state is observable.
		let resolveFetch;
		category.fetch.mockImplementationOnce(
			() =>
				new Promise( ( resolve ) => {
					resolveFetch = resolve;
				} )
		);
		rerender( { query: { search: 'b' } } );

		// A query change blanks the grid while the new request is in flight.
		await waitFor( () => expect( result.current.mediaList ).toEqual( [] ) );
		await act( async () => {
			resolveFetch( [ { id: 2 } ] );
		} );
		expect( result.current.mediaList ).toEqual( [ { id: 2 } ] );
	} );

	it( 'keeps the existing results while a refresh (refreshKey bump) refetches', async () => {
		const category = createCategory( 'attached-images', [ { id: 1 } ] );
		const { result, rerender } = renderHook(
			( { refreshKey } ) =>
				useMediaResults( category, { search: '' }, refreshKey ),
			{ initialProps: { refreshKey: 0 } }
		);
		await waitFor( () =>
			expect( result.current.mediaList ).toEqual( [ { id: 1 } ] )
		);

		// Hold the refetch open so we can assert the grid is not blanked.
		let resolveFetch;
		category.fetch.mockImplementationOnce(
			() =>
				new Promise( ( resolve ) => {
					resolveFetch = resolve;
				} )
		);
		rerender( { refreshKey: 1 } );

		// Same query, only `refreshKey` changed: existing items stay put.
		await waitFor( () => expect( result.current.isLoading ).toBe( true ) );
		expect( result.current.mediaList ).toEqual( [ { id: 1 } ] );
		await act( async () => {
			resolveFetch( [ { id: 2 } ] );
		} );
		expect( result.current.mediaList ).toEqual( [ { id: 2 } ] );
	} );

	it( 'clears and refetches when the category source changes with the same name and query', async () => {
		const firstCategory = createCategory( 'attached-images', [
			{ id: 1 },
		] );
		const { result, rerender } = renderHook(
			( { category } ) => useMediaResults( category, { search: '' }, 0 ),
			{ initialProps: { category: firstCategory } }
		);
		await waitFor( () =>
			expect( result.current.mediaList ).toEqual( [ { id: 1 } ] )
		);

		let resolveFetch;
		const secondCategory = {
			name: 'attached-images',
			fetch: jest.fn(
				() =>
					new Promise( ( resolve ) => {
						resolveFetch = resolve;
					} )
			),
		};
		rerender( { category: secondCategory } );

		await waitFor( () =>
			expect( secondCategory.fetch ).toHaveBeenCalledWith( {
				search: '',
			} )
		);
		expect( result.current.mediaList ).toEqual( [] );
		expect( result.current.isLoading ).toBe( true );

		await act( async () => {
			resolveFetch( [ { id: 2 } ] );
		} );
		expect( result.current.mediaList ).toEqual( [ { id: 2 } ] );
	} );

	it( 'does not refetch when only the category wrapper changes', async () => {
		const fetch = jest.fn( async () => [ { id: 1 } ] );
		const { result, rerender } = renderHook(
			( { category } ) => useMediaResults( category, { search: '' }, 0 ),
			{
				initialProps: {
					category: {
						name: 'images',
						fetch,
					},
				},
			}
		);
		await waitFor( () =>
			expect( result.current.mediaList ).toEqual( [ { id: 1 } ] )
		);

		rerender( {
			category: {
				name: 'images',
				fetch,
			},
		} );

		expect( fetch ).toHaveBeenCalledTimes( 1 );
		expect( result.current.mediaList ).toEqual( [ { id: 1 } ] );
	} );
} );
