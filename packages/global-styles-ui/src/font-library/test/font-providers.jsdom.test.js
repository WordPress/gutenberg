import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { getFontCardKey, useFontProviders } from '../font-providers';

vi.mock( import( '@wordpress/api-fetch' ), () => ( {
	default: vi.fn(),
} ) );

const mockApiFetch = vi.mocked( apiFetch );

const response = [
	{
		slug: 'example-kr',
		label: 'Example Korean',
		description: 'Korean fallback.',
		font_families: [
			{
				name: 'Noto Serif KR',
				slug: 'noto-serif-kr',
				fontFamily: '"Noto Serif KR", serif',
				fontFace: [],
			},
			{
				name: 'Noto Sans KR',
				slug: 'noto-sans-kr',
				fontFamily: '"Noto Sans KR", sans-serif',
				fontFace: [],
			},
		],
	},
];

describe( 'useFontProviders', () => {
	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'is unresolved until the request settles, then lists the providers as plugin fonts', async () => {
		let resolve;
		mockApiFetch.mockReturnValue(
			new Promise( ( r ) => {
				resolve = r;
			} )
		);

		const { result } = renderHook( () => useFontProviders() );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/font-providers',
		} );
		expect( result.current ).toEqual( {
			providers: [],
			hasResolved: false,
		} );

		resolve( response );

		await waitFor( () =>
			expect( result.current.hasResolved ).toBe( true )
		);
		const [ provider ] = result.current.providers;
		expect( provider.slug ).toBe( 'example-kr' );
		expect( provider.label ).toBe( 'Example Korean' );
		expect( provider.fontFamilies.map( ( f ) => f.slug ) ).toEqual( [
			'noto-sans-kr',
			'noto-serif-kr',
		] );
		expect(
			provider.fontFamilies.every( ( f ) => f.source === 'plugin' )
		).toBe( true );
	} );

	it( 'resolves to no providers when the request fails', async () => {
		mockApiFetch.mockRejectedValue( {
			code: 'rest_no_route',
			message: 'No route was found.',
		} );

		const { result } = renderHook( () => useFontProviders() );

		await waitFor( () =>
			expect( result.current.hasResolved ).toBe( true )
		);
		expect( result.current.providers ).toEqual( [] );
	} );
} );

describe( 'getFontCardKey', () => {
	it( 'tells apart fonts that share a slug', () => {
		const slug = 'noto-sans-kr';
		const keys = [
			getFontCardKey( { slug, source: 'theme' } ),
			getFontCardKey( { slug, source: 'custom' } ),
			getFontCardKey( { slug, source: 'plugin' }, 'example-kr' ),
			getFontCardKey( { slug, source: 'plugin' }, 'other-provider' ),
		];

		expect( new Set( keys ).size ).toBe( keys.length );
	} );

	it( 'is stable for the same font and provider', () => {
		expect(
			getFontCardKey( { slug: 'exo-2', source: 'plugin' }, 'test' )
		).toBe( getFontCardKey( { slug: 'exo-2', source: 'plugin' }, 'test' ) );
	} );
} );
