import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import usePageAncestorPaths from '../use-page-ancestor-paths';

vi.mock( import( '@wordpress/api-fetch' ), () => ( {
	default: vi.fn() as unknown as typeof apiFetch,
} ) );
const fetchPages = vi.mocked( apiFetch );

afterEach( () => fetchPages.mockReset() );

describe( 'Page search locations', () => {
	it( 'shows complete paths for shared parents using one request per depth', async () => {
		fetchPages.mockImplementation( async ( { path } ) => {
			const include = new URL(
				path!,
				'https://example.com'
			).searchParams.get( 'include' );
			if ( include === '8' ) {
				return [ { id: 8, parent: 7, title: { rendered: 'East' } } ];
			}
			return [ { id: 7, parent: 0, title: { rendered: 'North' } } ];
		} );
		const { result } = renderHook( () =>
			usePageAncestorPaths(
				[
					{ id: 9, parent: 8 },
					{ id: 10, parent: 8 },
				],
				true
			)
		);
		await waitFor( () =>
			expect( result.current.paths[ 9 ] ).toEqual( [ 'North', 'East' ] )
		);
		expect( result.current.paths[ 10 ] ).toEqual( [ 'North', 'East' ] );
		expect( fetchPages ).toHaveBeenCalledTimes( 2 );
		expect( fetchPages.mock.calls[ 0 ][ 0 ].path ).toContain(
			'status=any'
		);
	} );

	it( 'does not show an incomplete path when an ancestor is missing', async () => {
		fetchPages.mockResolvedValue( [] );
		const { result } = renderHook( () =>
			usePageAncestorPaths( [ { id: 9, parent: 8 } ], true )
		);
		await waitFor( () => expect( fetchPages ).toHaveBeenCalledTimes( 1 ) );
		await waitFor( () => expect( result.current.loading ).toBeFalsy() );
		expect( result.current.paths[ 9 ] ).toBeUndefined();
	} );

	it( 'does not show a cyclic parent path', async () => {
		fetchPages.mockResolvedValue( [
			{ id: 8, parent: 9, title: { rendered: 'East' } },
		] );
		const { result } = renderHook( () =>
			usePageAncestorPaths( [ { id: 9, parent: 8 } ], true )
		);
		await waitFor( () => expect( result.current.loading ).toBeFalsy() );
		expect( result.current.paths[ 9 ] ).toBeUndefined();
		expect( fetchPages ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not show old locations when search results change mid-request', async () => {
		let finishFirst!: ( pages: unknown ) => void;
		fetchPages.mockImplementation( ( { path } ) => {
			if ( path?.includes( 'include=8' ) ) {
				return new Promise( ( resolve ) => {
					finishFirst = resolve;
				} );
			}
			return Promise.resolve( [
				{ id: 20, parent: 0, title: { rendered: 'New parent' } },
			] );
		} );
		const { result, rerender } = renderHook(
			( { id, parent } ) =>
				usePageAncestorPaths( [ { id, parent } ], true ),
			{ initialProps: { id: 9, parent: 8 } }
		);
		await waitFor( () => expect( finishFirst ).toBeTypeOf( 'function' ) );
		rerender( { id: 21, parent: 20 } );
		finishFirst( [ { id: 8, parent: 0, title: { rendered: 'Old' } } ] );
		await waitFor( () =>
			expect( result.current.paths[ 21 ] ).toEqual( [ 'New parent' ] )
		);
		expect( result.current.paths[ 9 ] ).toBeUndefined();
	} );
} );
