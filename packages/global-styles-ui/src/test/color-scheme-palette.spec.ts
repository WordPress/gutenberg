/**
 * Internal dependencies
 */
import {
	addBasePresetNames,
	flattenSchemePresets,
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

describe( 'addBasePresetNames', () => {
	it( 'uses the matching base preset name when a scheme omits it', () => {
		expect(
			addBasePresetNames(
				[ { slug: 'base', color: '#111' } ],
				[ { slug: 'base', name: 'Base', color: '#fff' } ]
			)
		).toEqual( [ { slug: 'base', name: 'Base', color: '#111' } ] );
	} );

	it( 'preserves a scheme-specific name', () => {
		expect(
			addBasePresetNames(
				[ { slug: 'base', name: 'Night base', color: '#111' } ],
				[ { slug: 'base', name: 'Base', color: '#fff' } ]
			)
		).toEqual( [ { slug: 'base', name: 'Night base', color: '#111' } ] );
	} );
} );
