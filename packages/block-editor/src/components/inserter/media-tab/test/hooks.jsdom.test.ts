import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMediaCategories, useMediaResults } from '../hooks';
import { lock } from '../../../../lock-unlock';

// `useMediaCategories` reads the registered categories and the insertion
// point's permissions from the store. Stand in for both, so the tests only
// exercise what the hook does with them.
const { storeStub } = vi.hoisted( () => ( {
	storeStub: {
		getInserterMediaCategories: vi.fn(),
		canInsertBlockType: vi.fn( () => true ),
	},
} ) );
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return {
		...actual,
		// The hooks only pass a map function, which reads from the stub.
		useSelect: ( ( mapSelect: ( select: () => unknown ) => unknown ) =>
			mapSelect(
				() => storeStub
			) ) as unknown as typeof actual.useSelect,
	};
} );
// The hook reaches the category list through `unlock`, so the stub has to be
// locked rather than mocked: the store itself unlocks at import time.
lock( storeStub, storeStub );

// The stub categories return only the fields the hook passes through.
const useStubMediaResults = useMediaResults as (
	category: {
		name: string;
		fetch?: ( ...args: never[] ) => Promise< unknown >;
	},
	query?: Record< string, unknown >,
	refreshKey?: unknown
) => ReturnType< typeof useMediaResults >;

describe( 'useMediaResults', () => {
	const createCategory = ( name: string, items: unknown ) => ( {
		name,
		fetch: vi.fn( async () => items ),
	} );

	it( 'fetches and returns media for the query', async () => {
		const category = createCategory( 'images', [ { id: 1 } ] );
		const { result } = renderHook( () =>
			useStubMediaResults( category, { search: '' }, 0 )
		);
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( category.fetch ).toHaveBeenCalledWith( { search: '' } );
		expect( result.current.mediaList ).toEqual( [ { id: 1 } ] );
	} );

	it( 'omits the default first page from the fetch query', async () => {
		const category = createCategory( 'images', [ { id: 1 } ] );
		renderHook( () =>
			useStubMediaResults(
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
			useStubMediaResults(
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
			useStubMediaResults( category, { search: '' }, 0 )
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
			useStubMediaResults( category, { search: '' }, 0 )
		);
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.mediaList ).toEqual( [ { id: 1 } ] );
		expect( result.current.totalItems ).toBe( 42 );
		expect( result.current.totalPages ).toBe( 3 );
	} );

	it( 'clears the previous results when the query changes', async () => {
		const category = createCategory( 'images', [ { id: 1 } ] );
		const { result, rerender } = renderHook(
			( { query } ) => useStubMediaResults( category, query, 0 ),
			{ initialProps: { query: { search: 'a' } } }
		);
		await waitFor( () =>
			expect( result.current.mediaList ).toEqual( [ { id: 1 } ] )
		);

		// Hold the next request open so the intermediate (cleared) state is observable.
		// Set by the pending fetch below.
		let resolveFetch!: ( value: unknown ) => void;
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
				useStubMediaResults( category, { search: '' }, refreshKey ),
			{ initialProps: { refreshKey: 0 } }
		);
		await waitFor( () =>
			expect( result.current.mediaList ).toEqual( [ { id: 1 } ] )
		);

		// Hold the refetch open so we can assert the grid is not blanked.
		// Set by the pending fetch below.
		let resolveFetch!: ( value: unknown ) => void;
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
			( { category } ) =>
				useStubMediaResults( category, { search: '' }, 0 ),
			{ initialProps: { category: firstCategory } }
		);
		await waitFor( () =>
			expect( result.current.mediaList ).toEqual( [ { id: 1 } ] )
		);

		// Set by the pending fetch below.
		let resolveFetch!: ( value: unknown ) => void;
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
		const renders: Array< {
			source: string;
			mediaList: unknown[];
		} > = [];
		const { result, rerender } = renderHook(
			( { category } ) => {
				const results = useStubMediaResults(
					category,
					{ search: '' },
					0
				);
				renders.push( {
					source: category.name,
					// The list is set from the first render, as the source switches.
					mediaList: results.mediaList as unknown[],
				} );
				return results;
			},
			{ initialProps: { category: images } }
		);
		await waitFor( () =>
			expect( result.current.mediaList ).toEqual( [ { id: 1 } ] )
		);
		expect( result.current.isSwitchingSource ).toBe( false );

		// Set by the pending fetch below.
		let resolveFetch!: ( value: unknown ) => void;
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
			( { category } ) =>
				useStubMediaResults( category, { search: '' }, 0 ),
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

describe( 'useMediaCategories', () => {
	const imagesCategory = {
		name: 'images',
		mediaType: 'image',
		fetch: vi.fn( async () => [ { id: 1 } ] ),
	};

	beforeEach( () => {
		storeStub.getInserterMediaCategories.mockReturnValue( [
			imagesCategory,
		] );
	} );

	it( 'reports the categories once it has worked out which have media', async () => {
		const { result } = renderHook( () => useMediaCategories() );

		// Finding out takes a request per category, so there is nothing to
		// report yet.
		expect( result.current.hasResolved ).toBe( false );
		expect( result.current.categories ).toEqual( [] );

		await waitFor( () =>
			expect( result.current.hasResolved ).toBe( true )
		);
		expect( result.current.categories ).toEqual( [ imagesCategory ] );
	} );

	it( 'resolves with no categories when none has media', async () => {
		storeStub.getInserterMediaCategories.mockReturnValue( [
			{ ...imagesCategory, fetch: vi.fn( async () => [] ) },
		] );
		const { result } = renderHook( () => useMediaCategories() );

		// An empty list is the answer here, not the absence of one, which is
		// the difference the tab needs to show "no results" rather than wait.
		await waitFor( () =>
			expect( result.current.hasResolved ).toBe( true )
		);
		expect( result.current.categories ).toEqual( [] );
	} );
} );
