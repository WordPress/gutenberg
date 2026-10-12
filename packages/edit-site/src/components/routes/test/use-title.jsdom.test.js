import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { speak } from '@wordpress/a11y';

let location;

vi.mock( import( '@wordpress/a11y' ), () => ( { speak: vi.fn() } ) );

vi.mock( import( '@wordpress/data' ), () => ( {
	useSelect: () => 'My Site',
} ) );

vi.mock( import( '@wordpress/core-data' ), () => ( { store: 'core' } ) );

vi.mock( import( '@wordpress/router' ), () => ( {
	privateApis: { useLocation: () => location },
} ) );

vi.mock( import( '../../../lock-unlock' ), () => ( {
	unlock: ( object ) => object,
} ) );

async function loadUseTitle() {
	vi.resetModules();
	return ( await import( '../use-title' ) ).default;
}

function navigate( path, query = {} ) {
	location = { path, query };
}

describe( 'useTitle', () => {
	let useTitle;

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
		const { rerender } = renderHook( ( { title } ) => useTitle( title ), {
			initialProps: { title: 'Design' },
		} );

		navigate( '/page' );
		rerender( { title: 'Pages' } );

		expect( speak ).toHaveBeenCalledTimes( 1 );
		expect( speak ).toHaveBeenCalledWith( 'Pages', 'assertive' );
		expect( document.title ).toBe( 'Pages ‹ My Site ‹ Editor — WordPress' );
	} );

	it( 'does not announce when only the query changes', () => {
		navigate( '/page' );
		const { rerender } = renderHook( ( { title } ) => useTitle( title ), {
			initialProps: { title: 'Pages' },
		} );

		navigate( '/page', { search: 'Team' } );
		rerender( { title: 'Pages' } );
		navigate( '/page', { search: 'Team', postId: '12' } );
		rerender( { title: 'Pages' } );

		expect( speak ).not.toHaveBeenCalled();
	} );

	it( 'does not announce a title that changes on the same screen', () => {
		navigate( '/page/12', { canvas: 'edit' } );
		const { rerender } = renderHook( ( { title } ) => useTitle( title ), {
			initialProps: { title: 'About ‹ Page' },
		} );

		rerender( { title: 'About us ‹ Page' } );

		expect( speak ).not.toHaveBeenCalled();
		expect( document.title ).toBe(
			'About us ‹ Page ‹ My Site ‹ Editor — WordPress'
		);
	} );

	it( 'announces when the canvas switches to edit mode', () => {
		navigate( '/page/12' );
		const { rerender } = renderHook( ( { title } ) => useTitle( title ), {
			initialProps: { title: 'Pages' },
		} );

		navigate( '/page/12', { canvas: 'edit' } );
		rerender( { title: 'About ‹ Page' } );

		expect( speak ).toHaveBeenCalledWith( 'About ‹ Page', 'assertive' );
	} );

	it( 'shares the last announced screen between callers', () => {
		navigate( '/page' );
		const { rerender: rerenderLayout } = renderHook(
			( { title } ) => useTitle( title ),
			{ initialProps: { title: 'Pages' } }
		);
		const { rerender: rerenderEditor } = renderHook(
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
