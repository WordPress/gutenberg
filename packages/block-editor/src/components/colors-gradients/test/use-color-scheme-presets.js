/**
 * WordPress dependencies
 */
import { useMediaQuery } from '@wordpress/compose';
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useSettings } from '../../use-settings';
import useColorSchemePresets from '../use-color-scheme-presets';

jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useMediaQuery: jest.fn(),
} ) );

jest.mock( '../../use-settings', () => ( {
	useSettings: jest.fn(),
} ) );

const baseColors = [
	{ slug: 'base', name: 'Base', color: '#fff' },
	{ slug: 'accent', name: 'Accent', color: '#f00' },
];

describe( 'useColorSchemePresets', () => {
	beforeEach( () => {
		useSettings.mockReset();
		useMediaQuery.mockReset();
	} );

	it( 'returns a complete dark palette for a partial alternative', () => {
		useSettings.mockReturnValue( [
			undefined,
			[
				{ slug: 'base', color: '#111' },
				{ slug: 'unknown', color: '#f0f' },
			],
		] );
		useMediaQuery.mockImplementation( ( query ) =>
			query.includes( 'dark' )
		);

		const { result } = renderHook( () =>
			useColorSchemePresets( 'palette', baseColors )
		);

		expect( result.current ).toEqual( {
			colorScheme: 'dark',
			hasColorSchemes: true,
			presets: [
				{ slug: 'base', name: 'Base', color: '#111' },
				{ slug: 'accent', name: 'Accent', color: '#f00' },
			],
		} );
	} );

	it( 'uses the base palette when the available scheme does not match', () => {
		useSettings.mockReturnValue( [
			undefined,
			[ { slug: 'base', color: '#111' } ],
		] );
		useMediaQuery.mockImplementation( ( query ) =>
			query.includes( 'light' )
		);

		const { result } = renderHook( () =>
			useColorSchemePresets( 'palette', baseColors )
		);

		expect( result.current ).toEqual( {
			colorScheme: undefined,
			hasColorSchemes: true,
			presets: baseColors,
		} );
	} );
} );
