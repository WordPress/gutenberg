import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { speak } from '@wordpress/a11y';
import useRouteTitle from '../use-route-title';

type UseSelect = ( typeof import( '@wordpress/data' ) )[ 'useSelect' ];
type CoreStore = ( typeof import( '@wordpress/core-data' ) )[ 'store' ];
type RoutePrivateApis =
	( typeof import( '@wordpress/route' ) )[ 'privateApis' ];
type Unlock = ( typeof import( '../../../lock-unlock' ) )[ 'unlock' ];
type Match = {
	pathname: string;
	search?: Record< string, unknown >;
	loaderData?: { title: string };
};

let matches: Match[];

vi.mock( import( '@wordpress/a11y' ), () => ( { speak: vi.fn() } ) );

vi.mock( import( '@wordpress/data' ), () => ( {
	useSelect: ( () => 'My Site' ) as unknown as UseSelect,
} ) );

vi.mock( import( '@wordpress/core-data' ), () => ( {
	store: 'core' as unknown as CoreStore,
} ) );

vi.mock( import( '@wordpress/route' ), () => ( {
	privateApis: { useMatches: () => matches } as unknown as RoutePrivateApis,
} ) );

vi.mock( import( '../../../lock-unlock' ), () => ( {
	unlock: ( ( object: unknown ) => object ) as unknown as Unlock,
} ) );

function navigate(
	pathname: string,
	title: string,
	search: Record< string, unknown > = {}
) {
	matches = [
		{ pathname: '/' },
		{ pathname, search, loaderData: { title } },
	];
}

describe( 'useRouteTitle', () => {
	beforeEach( () => {
		vi.mocked( speak ).mockClear();
		document.title = 'Server title';
		navigate( '/', 'Home' );
	} );

	it( 'sets the document title but does not announce on first load', () => {
		renderHook( () => useRouteTitle() );

		expect( document.title ).toBe( 'Home ‹ My Site — WordPress' );
		expect( speak ).not.toHaveBeenCalled();
	} );

	it( 'announces the new route title when the path changes', () => {
		const { rerender } = renderHook( () => useRouteTitle() );

		navigate( '/types/page/list/all', 'Pages' );
		rerender();

		expect( speak ).toHaveBeenCalledTimes( 1 );
		expect( speak ).toHaveBeenCalledWith( 'Pages', 'assertive' );
		expect( document.title ).toBe( 'Pages ‹ My Site — WordPress' );
	} );

	it( 'does not announce when only the search params change', () => {
		navigate( '/types/page/list/all', 'Pages' );
		const { rerender } = renderHook( () => useRouteTitle() );

		navigate( '/types/page/list/all', 'Pages', { search: 'Team' } );
		rerender();
		navigate( '/types/page/list/all', 'Pages', {
			search: 'Team',
			postIds: [ 12 ],
		} );
		rerender();

		expect( speak ).not.toHaveBeenCalled();
	} );

	it( 'does not announce a path change that keeps the same title', () => {
		navigate( '/types/page/list/all', 'Pages' );
		const { rerender } = renderHook( () => useRouteTitle() );

		navigate( '/types/page/list/draft', 'Pages' );
		rerender();

		expect( speak ).not.toHaveBeenCalled();
	} );

	it( 'does not announce the previous title while the new route loads', () => {
		navigate( '/types/page/list/all', 'Pages' );
		const { rerender } = renderHook( () => useRouteTitle() );

		// The router updates the location before the matches, so the hook
		// renders again while the matches still hold the previous route.
		rerender();
		expect( speak ).not.toHaveBeenCalled();

		navigate( '/types/page/edit/12', 'About' );
		rerender();
		expect( speak ).toHaveBeenCalledTimes( 1 );
		expect( speak ).toHaveBeenCalledWith( 'About', 'assertive' );
	} );
} );
