import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMediaResults } from '../hooks';

describe( 'useMediaResults', () => {
	const createCategory = ( name, items ) => ( {
		name,
		fetch: vi.fn( async () => items ),
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

	it( 'omits the default first page from the fetch query', async () => {
		const category = createCategory( 'images', [ { id: 1 } ] );
		renderHook( () =>
			useMediaResults(
				category,
				{ per_page: 20, page: 1, search: '' },
				0
			)
		);
		await waitFor( () =>
			expect( category.fetch ).toHaveBeenCalledWith( {
				per_page: 20,
				search: '',
			} )
		);
	} );

	it( 'passes `page` to the fetch query when paging past the first page', async () => {
		const category = createCategory( 'images', [ { id: 1 } ] );
		renderHook( () =>
			useMediaResults(
				category,
				{ per_page: 20, page: 2, search: '' },
				0
			)
		);
		await waitFor( () =>
			expect( category.fetch ).toHaveBeenCalledWith( {
				per_page: 20,
				page: 2,
				search: '',
			} )
		);
	} );

	it( 'leaves paging totals undefined for an array-returning source', async () => {
		const category = createCategory( 'images', [ { id: 1 } ] );
		const { result } = renderHook( () =>
			useMediaResults( category, { search: '' }, 0 )
		);
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.totalItems ).toBeUndefined();
		expect( result.current.totalPages ).toBeUndefined();
	} );

	it( 'surfaces paging totals from a source that returns them', async () => {
		const category = {
			name: 'images',
			fetch: vi.fn( async () => ( {
				mediaItems: [ { id: 1 } ],
				totalItems: 42,
				totalPages: 3,
			} ) ),
		};
		const { result } = renderHook( () =>
			useMediaResults( category, { search: '' }, 0 )
		);
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.mediaList ).toEqual( [ { id: 1 } ] );
		expect( result.current.totalItems ).toBe( 42 );
		expect( result.current.totalPages ).toBe( 3 );
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
			fetch: vi.fn(
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

	it( 'reports no results for a source that has not resolved yet', async () => {
		const images = createCategory( 'images', [ { id: 1 } ] );
		// Every render is recorded, because the guarantee is about the render
		// itself: by the time effects have run the list has been cleared
		// either way, and it's the render in between that would put the
		// previous source's items on screen.
		const renders = [];
		const { result, rerender } = renderHook(
			( { category } ) => {
				const results = useMediaResults( category, { search: '' }, 0 );
				renders.push( {
					source: category.name,
					mediaList: results.mediaList,
				} );
				return results;
			},
			{ initialProps: { category: images } }
		);
		await waitFor( () =>
			expect( result.current.mediaList ).toEqual( [ { id: 1 } ] )
		);
		expect( result.current.isSwitchingSource ).toBe( false );

		let resolveFetch;
		const videos = {
			name: 'videos',
			fetch: vi.fn(
				() =>
					new Promise( ( resolve ) => {
						resolveFetch = resolve;
					} )
			),
		};
		renders.length = 0;
		rerender( { category: videos } );

		// `DataViews` keeps showing the last non-empty list it was given, so
		// the images must never be handed over once videos are the source —
		// one such render is enough to leave them under the Videos tab.
		expect(
			renders.filter(
				( render ) =>
					render.source === 'videos' && render.mediaList.length > 0
			)
		).toEqual( [] );
		expect( result.current.isSwitchingSource ).toBe( true );
		expect( result.current.totalItems ).toBeUndefined();
		expect( result.current.totalPages ).toBeUndefined();

		await act( async () => {
			resolveFetch( [ { id: 2 } ] );
		} );
		expect( result.current.mediaList ).toEqual( [ { id: 2 } ] );
		expect( result.current.isSwitchingSource ).toBe( false );
	} );

	it( 'does not refetch when only the category wrapper changes', async () => {
		const fetch = vi.fn( async () => [ { id: 1 } ] );
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
