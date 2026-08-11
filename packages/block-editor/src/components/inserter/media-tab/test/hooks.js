import { renderHook, act, waitFor } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import {
	useDelayedLoading,
	useMediaResults,
	useMediaCategories,
} from '../hooks';

// `useMediaCategories` reads the categories and the insertion capabilities from
// the block editor store. Only `useSelect` is exercised here, so the store and
// its unlock helper are stubbed rather than instantiated — the hook's own logic
// (which sources get probed, and which survive) is what's under test.
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );
jest.mock( '../../../../store', () => ( { store: 'core/block-editor' } ) );
jest.mock( '../../../../lock-unlock', () => ( {
	unlock: ( value ) => value,
} ) );

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
			fetch: jest.fn( async () => ( {
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

describe( 'useMediaCategories', () => {
	// Run each `useSelect` callback against a stub store, rather than returning
	// canned values per call — the hook makes two `useSelect` calls and they must
	// keep answering correctly across re-renders.
	const mockSelects = ( categories ) => {
		const select = () => ( {
			getInserterMediaCategories: () => categories,
			canInsertBlockType: () => true,
		} );
		useSelect.mockImplementation( ( mapSelect ) => mapSelect( select ) );
	};

	beforeEach( () => {
		useSelect.mockReset();
	} );

	it( 'lists a source with an empty message without probing it', async () => {
		// A source that supplies an `emptyMessage` is listed whether or not it
		// has media — so probing it would only throw the result away. Media
		// folders rely on this: an empty folder still has to be reachable so
		// images can be added to it, and N folders must not cost N requests.
		const emptyFolder = {
			name: 'media-folder-7',
			mediaType: 'image',
			emptyMessage: 'No images in this folder.',
			fetch: jest.fn().mockResolvedValue( { mediaItems: [] } ),
		};
		mockSelects( [ emptyFolder ] );

		const { result } = renderHook( () => useMediaCategories( '' ) );

		await waitFor( () =>
			expect( result.current ).toEqual( [ emptyFolder ] )
		);
		expect( emptyFolder.fetch ).not.toHaveBeenCalled();
	} );

	it( 'probes a source without an empty message and drops it when empty', async () => {
		const populated = {
			name: 'images',
			mediaType: 'image',
			fetch: jest.fn().mockResolvedValue( { mediaItems: [ { id: 1 } ] } ),
		};
		const empty = {
			name: 'videos',
			mediaType: 'video',
			fetch: jest.fn().mockResolvedValue( { mediaItems: [] } ),
		};
		mockSelects( [ populated, empty ] );

		const { result } = renderHook( () => useMediaCategories( '' ) );

		await waitFor( () =>
			expect( result.current ).toEqual( [ populated ] )
		);
		expect( populated.fetch ).toHaveBeenCalledWith( { per_page: 1 } );
		expect( empty.fetch ).toHaveBeenCalledWith( { per_page: 1 } );
	} );

	it( 'does not probe an external source', async () => {
		const openverse = {
			name: 'openverse',
			mediaType: 'image',
			isExternalResource: true,
			fetch: jest.fn(),
		};
		mockSelects( [ openverse ] );

		const { result } = renderHook( () => useMediaCategories( '' ) );

		await waitFor( () =>
			expect( result.current ).toEqual( [ openverse ] )
		);
		expect( openverse.fetch ).not.toHaveBeenCalled();
	} );
} );
