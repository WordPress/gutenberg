import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { getResolvedUrl, useResolvedUrl } from '../use-resolved-url';

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

describe( 'getResolvedUrl', () => {
	const home = 'https://example.com/blog';

	test.each< [ string | undefined, string | undefined ] >( [
		[ undefined, home ],
		[ '', home ],
		[ '/page', undefined ],
		[ '#section', undefined ],
	] )( 'returns undefined for %s with base %s', ( url, base ) => {
		expect( getResolvedUrl( url, base ) ).toBeUndefined();
	} );

	test.each( [
		[ '#section', 'https://example.com/blog#section' ],
		[ './page', 'https://example.com/page' ],
		[ '../page', 'https://example.com/page' ],
		[ '/page', 'https://example.com/page' ],
	] )( 'resolves %s against the home URL', ( url, expected ) => {
		expect( getResolvedUrl( url, home ) ).toBe( expected );
	} );

	test.each( [
		[ 'https://wordpress.org/news', 'https://wordpress.org/news' ],
		[ 'mailto:hello@example.com', 'mailto:hello@example.com' ],
		[ 'tel:+15555551234', 'tel:+15555551234' ],
	] )( 'keeps the absolute URL %s', ( url, expected ) => {
		expect( getResolvedUrl( url, home ) ).toBe( expected );
		expect( getResolvedUrl( url, undefined ) ).toBe( expected );
	} );
} );

describe( 'useResolvedUrl', () => {
	const select = vi.fn( () => ( {
		getEntityRecord: () => ( { home: 'https://example.com' } ),
	} ) );

	beforeEach( () => {
		select.mockClear();
		( useSelect as Mock ).mockImplementation( ( mapSelect ) =>
			mapSelect( select )
		);
	} );

	test( 'resolves a relative link against the site home URL', () => {
		const { result } = renderHook( () => useResolvedUrl( '/page' ) );
		expect( result.current ).toBe( 'https://example.com/page' );
		expect( select ).toHaveBeenCalled();
	} );

	// A subdirectory install serves its home page at `/blog/`, so a link
	// relative to the home page must resolve inside the subdirectory.
	test.each( [
		[ './page', 'https://example.com/blog/page' ],
		[ '#faq', 'https://example.com/blog/#faq' ],
		[ '?s=term', 'https://example.com/blog/?s=term' ],
		[ '/page', 'https://example.com/page' ],
		[ '../page', 'https://example.com/page' ],
	] )( 'resolves %s against a subdirectory home URL', ( url, expected ) => {
		select.mockImplementation( () => ( {
			getEntityRecord: () => ( { home: 'https://example.com/blog' } ),
		} ) );
		const { result } = renderHook( () => useResolvedUrl( url ) );
		expect( result.current ).toBe( expected );
	} );

	test( 'does not read the home URL for an absolute link', () => {
		const { result } = renderHook( () =>
			useResolvedUrl( 'https://wordpress.org' )
		);
		expect( result.current ).toBe( 'https://wordpress.org/' );
		expect( select ).not.toHaveBeenCalled();
	} );

	test( 'does not read the home URL without a link', () => {
		const { result } = renderHook( () => useResolvedUrl( undefined ) );
		expect( result.current ).toBeUndefined();
		expect( select ).not.toHaveBeenCalled();
	} );
} );
