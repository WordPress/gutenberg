/**
 * Internal dependencies
 */
import {
	flattenSchemePresets,
	normalizeColorSchemePresets,
} from '../color-scheme-palette';

describe( 'flattenSchemePresets', () => {
	it( 'returns an inline scheme palette unchanged', () => {
		const presets = [ { slug: 'base', color: '#fff' } ];

		expect( flattenSchemePresets( presets ) ).toEqual( presets );
	} );

	it( 'flattens an origin-keyed scheme palette', () => {
		expect(
			flattenSchemePresets( {
				theme: [ { slug: 'base', color: '#fff' } ],
				custom: [ { slug: 'accent', color: '#f00' } ],
			} )
		).toEqual( [
			{ slug: 'base', color: '#fff' },
			{ slug: 'accent', color: '#f00' },
		] );
	} );
} );

describe( 'normalizeColorSchemePresets', () => {
	it( 'creates a complete alternative palette in base order', () => {
		expect(
			normalizeColorSchemePresets(
				[
					{ slug: 'base', name: 'Base', color: '#fff' },
					{ slug: 'accent', name: 'Accent', color: '#f00' },
				],
				[ { slug: 'base', color: '#111' } ]
			)
		).toEqual( [
			{ slug: 'base', name: 'Base', color: '#111' },
			{ slug: 'accent', name: 'Accent', color: '#f00' },
		] );
	} );

	it( 'uses base identity and ignores unmatched alternative presets', () => {
		expect(
			normalizeColorSchemePresets(
				[ { slug: 'base', name: 'Base', color: '#fff' } ],
				[
					{ slug: 'base', name: 'Night base', color: '#111' },
					{ slug: 'unknown', color: '#f0f' },
				]
			)
		).toEqual( [ { slug: 'base', name: 'Base', color: '#111' } ] );
	} );
} );
