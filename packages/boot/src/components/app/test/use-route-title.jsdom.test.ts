import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { speak } from '@wordpress/a11y';
import useRouteTitle from '../use-route-title';

let location: { pathname: string; search: Record< string, unknown > };

vi.mock( import( '@wordpress/a11y' ), () => ( { speak: vi.fn() } ) as any );
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: ( () => 'My Site' ) as any,
} ) );
vi.mock(
	import( '../../../lock-unlock' ),
	() =>
		( {
			unlock: () => ( {
				useLocation: () => location,
				useMatches: () => [ { loaderData: { title: 'Pages' } } ],
			} ),
		} ) as any
);

describe( 'useRouteTitle', () => {
	beforeEach( () => {
		vi.mocked( speak ).mockClear();
		location = { pathname: '/types/page/list/all', search: {} };
	} );

	it( 'announces the title when the path changes', () => {
		const { rerender } = renderHook( () => useRouteTitle() );
		vi.mocked( speak ).mockClear();
		location = { ...location, pathname: '/types/page/list/draft' };
		rerender();
		expect( speak ).toHaveBeenCalledWith( 'Pages', 'assertive' );
	} );

	it( 'does not announce the title when only the search changes', () => {
		const { rerender } = renderHook( () => useRouteTitle() );
		vi.mocked( speak ).mockClear();
		location = { ...location, search: { postIds: [ '1' ] } };
		rerender();
		expect( speak ).not.toHaveBeenCalled();
	} );
} );
