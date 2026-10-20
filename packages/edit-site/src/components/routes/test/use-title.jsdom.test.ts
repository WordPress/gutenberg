import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { speak } from '@wordpress/a11y';

type UseSelect = ( typeof import( '@wordpress/data' ) )[ 'useSelect' ];
type CoreStore = ( typeof import( '@wordpress/core-data' ) )[ 'store' ];
type RouterPrivateApis =
	( typeof import( '@wordpress/router' ) )[ 'privateApis' ];
type Unlock = ( typeof import( '../../../lock-unlock' ) )[ 'unlock' ];
type UseTitle = ( typeof import( '../use-title' ) )[ 'default' ];
type Props = { title?: string | false };

let location: { path: string; query: Record< string, string > };

vi.mock( import( '@wordpress/a11y' ), () => ( { speak: vi.fn() } ) );

vi.mock( import( '@wordpress/data' ), () => ( {
	useSelect: ( () => 'My Site' ) as unknown as UseSelect,
} ) );

vi.mock( import( '@wordpress/core-data' ), () => ( {
	store: 'core' as unknown as CoreStore,
} ) );

vi.mock( import( '@wordpress/router' ), () => ( {
	privateApis: {
		useLocation: () => location,
	} as unknown as RouterPrivateApis,
} ) );

vi.mock( import( '../../../lock-unlock' ), () => ( {
	unlock: ( ( object: unknown ) => object ) as unknown as Unlock,
} ) );

async function loadUseTitle() {
	vi.resetModules();
	return ( await import( '../use-title' ) ).default;
}

function navigate( path: string, query: Record< string, string > = {} ) {
	location = { path, query };
}

describe( 'useTitle', () => {
	let useTitle: UseTitle;

	beforeEach( async () => {
		vi.mocked( speak ).mockClear();
		document.title = 'Server title';
		navigate( '/' );
		useTitle = await loadUseTitle();
	} );

	it( 'sets the document title but does not announce on first load', () => {
		renderHook( () => useTitle( 'Design' ) );

		expect( document.title ).toBe(
			'Design ‹ My Site ‹ Editor — WordPress'
		);
		expect( speak ).not.toHaveBeenCalled();
	} );

	it( 'announces the new screen when the path changes', () => {
		const { rerender } = renderHook(
			( { title }: Props ) => useTitle( title ),
			{ initialProps: { title: 'Design' } }
		);

		navigate( '/page' );
		rerender( { title: 'Pages' } );

		expect( speak ).toHaveBeenCalledTimes( 1 );
		expect( speak ).toHaveBeenCalledWith( 'Pages', 'assertive' );
		expect( document.title ).toBe( 'Pages ‹ My Site ‹ Editor — WordPress' );
	} );

	it( 'does not announce when only the query changes', () => {
		navigate( '/page' );
		const { rerender } = renderHook(
			( { title }: Props ) => useTitle( title ),
			{ initialProps: { title: 'Pages' } }
		);

		navigate( '/page', { search: 'Team' } );
		rerender( { title: 'Pages' } );
		navigate( '/page', { search: 'Team', postId: '12' } );
		rerender( { title: 'Pages' } );

		expect( speak ).not.toHaveBeenCalled();
	} );

	it( 'does not announce a title that changes on the same screen', () => {
		navigate( '/page/12', { canvas: 'edit' } );
		const { rerender } = renderHook(
			( { title }: Props ) => useTitle( title ),
			{ initialProps: { title: 'About ‹ Page' } }
		);

		rerender( { title: 'About us ‹ Page' } );

		expect( speak ).not.toHaveBeenCalled();
		expect( document.title ).toBe(
			'About us ‹ Page ‹ My Site ‹ Editor — WordPress'
		);
	} );

	it( 'announces when the canvas switches to edit mode', () => {
		navigate( '/page/12' );
		const { rerender } = renderHook(
			( { title }: Props ) => useTitle( title ),
			{ initialProps: { title: 'Pages' } }
		);

		navigate( '/page/12', { canvas: 'edit' } );
		rerender( { title: 'About ‹ Page' } );

		expect( speak ).toHaveBeenCalledWith( 'About ‹ Page', 'assertive' );
	} );

	it( 'shares the last announced screen between callers', () => {
		navigate( '/page' );
		const { rerender: rerenderLayout } = renderHook< void, Props >(
			( { title } ) => useTitle( title ),
			{ initialProps: { title: 'Pages' } }
		);
		const { rerender: rerenderEditor } = renderHook< void, Props >(
			( { title } ) => useTitle( title ),
			{ initialProps: { title: undefined } }
		);

		navigate( '/page/12', { canvas: 'edit' } );
		rerenderLayout( { title: undefined } );
		rerenderEditor( { title: 'About ‹ Page' } );

		expect( speak ).toHaveBeenCalledTimes( 1 );
		expect( speak ).toHaveBeenCalledWith( 'About ‹ Page', 'assertive' );
	} );
} );
