import { describe, expect, it } from 'vitest';
import {
	getNewIndexFromPresets,
	getValidPseudoStates,
	withUserCustomPresets,
} from '../utils';

const validPresets = {
	single: [ { slug: 'preset-1' } ],
	multiple: [ { slug: 'preset-1' }, { slug: 'preset-2' } ],
	withGaps: [ { slug: 'preset-1' }, { slug: 'preset-3' } ],
	mixedPrefixes: [
		{ slug: 'preset-1' },
		{ slug: 'shadow-2' },
		{ slug: 'preset-3' },
	],
	nonStringSlug: [ { slug: 'preset-1' }, { slug: 2 } ],
	emptyArray: [],
};

const invalidPresets = {
	noMatch: [ { slug: 'preset-alpha' }, { slug: 'preset-beta' } ],
	emptySlug: [ { slug: '' } ],
	nullSlug: [ { slug: null } ],
	undefinedSlug: [ { slug: undefined } ],
	nonObjectElements: [ 'preset-1' ],
};

const getExpectedIndex = ( presetKey, presets ) => {
	if ( presetKey === 'withGaps' ) {
		return 4;
	}
	if ( presetKey === 'mixedPrefixes' ) {
		return 4;
	}
	if ( presetKey === 'nonStringSlug' ) {
		return 2;
	}
	return presets.length + 1;
};

describe( 'getNewIndexFromPresets', () => {
	Object.entries( validPresets ).forEach( ( [ presetKey, presets ] ) => {
		describe( `test valid preset format: ${ presetKey }`, () => {
			const newIndex = getNewIndexFromPresets( presets, 'preset-' );
			it( `should return correct new index for ${ presetKey }`, () => {
				const expectedIndex = getExpectedIndex( presetKey, presets );
				expect( newIndex ).toBe( expectedIndex );
			} );
		} );
	} );

	Object.entries( invalidPresets ).forEach( ( [ presetKey, presets ] ) => {
		describe( `test invalid preset format: ${ presetKey }`, () => {
			const newIndex = getNewIndexFromPresets( presets, 'preset-' );
			it( `should return 1 for ${ presetKey }`, () => {
				expect( newIndex ).toBe( 1 );
			} );
		} );
	} );
} );

describe( 'getValidPseudoStates', () => {
	it( 'offers hover, focus, focus-visible and active for the Navigation Link block', () => {
		expect(
			getValidPseudoStates( 'core/navigation-link' ).map(
				( state ) => state.value
			)
		).toEqual( [ ':hover', ':focus', ':focus-visible', ':active' ] );
	} );
} );

describe( 'withUserCustomPresets', () => {
	const customColors = [
		{ slug: 'my-blue', color: '#0000ff', name: 'MyBlue' },
	];
	const themeColors = [ { slug: 'base', color: '#ffffff', name: 'Base' } ];

	it( 'returns the variation unchanged when the user has no custom presets', () => {
		const variation = {
			settings: { color: { palette: { theme: themeColors } } },
		};
		expect( withUserCustomPresets( variation, {} ) ).toBe( variation );
		expect( withUserCustomPresets( variation, undefined ) ).toBe(
			variation
		);
	} );

	it.each( [
		[ 'color', 'palette' ],
		[ 'color', 'gradients' ],
		[ 'color', 'duotone' ],
		[ 'shadow', 'presets' ],
		[ 'typography', 'fontSizes' ],
		[ 'typography', 'fontFamilies' ],
		[ 'typography', 'textShadowPresets' ],
		[ 'spacing', 'spacingSizes' ],
		[ 'border', 'radiusSizes' ],
		[ 'dimensions', 'dimensionSizes' ],
	] )( 'keeps the user custom %s.%s presets', ( group, key ) => {
		const custom = [ { slug: 'my-preset', name: 'My preset' } ];
		const user = { settings: { [ group ]: { [ key ]: { custom } } } };

		expect( withUserCustomPresets( { title: 'Ember' }, user ) ).toEqual( {
			title: 'Ember',
			settings: { [ group ]: { [ key ]: { custom } } },
		} );
	} );

	it( 'keeps the user custom fonts, font sizes and shadows', () => {
		const customFontFamilies = [
			{ slug: 'my-font', fontFamily: 'My Font', name: 'My Font' },
		];
		const customFontSizes = [
			{ slug: 'my-size', size: '20px', name: 'My size' },
		];
		const customShadows = [
			{
				slug: 'my-shadow',
				shadow: '1px 1px 1px #000',
				name: 'My shadow',
			},
		];
		const customTextShadows = [
			{
				slug: 'my-text-shadow',
				textShadow: '1px 1px 1px #000',
				name: 'My text shadow',
			},
		];
		const themeFontSizes = [
			{ slug: 'small', size: '14px', name: 'Small' },
		];
		const variation = {
			settings: {
				typography: {
					fluid: true,
					fontSizes: { theme: themeFontSizes },
				},
			},
		};
		const user = {
			settings: {
				typography: {
					fontFamilies: { custom: customFontFamilies },
					fontSizes: { custom: customFontSizes },
					textShadowPresets: { custom: customTextShadows },
				},
				shadow: { presets: { custom: customShadows } },
			},
		};

		expect( withUserCustomPresets( variation, user ) ).toEqual( {
			settings: {
				typography: {
					fluid: true,
					fontFamilies: { custom: customFontFamilies },
					fontSizes: {
						theme: themeFontSizes,
						custom: customFontSizes,
					},
					textShadowPresets: { custom: customTextShadows },
				},
				shadow: { presets: { custom: customShadows } },
			},
		} );
	} );

	it( 'keeps the custom font sizes the variation defines itself', () => {
		const variationFontSizes = [
			{ slug: 'variation', size: '30px', name: 'Variation' },
		];
		const userFontSizes = [
			{ slug: 'my-size', size: '20px', name: 'Mine' },
		];
		const userFontFamilies = [
			{ slug: 'my-font', fontFamily: 'My Font', name: 'My Font' },
		];
		const variation = {
			settings: {
				typography: { fontSizes: { custom: variationFontSizes } },
			},
		};
		const user = {
			settings: {
				typography: {
					fontSizes: { custom: userFontSizes },
					fontFamilies: { custom: userFontFamilies },
				},
			},
		};

		expect( withUserCustomPresets( variation, user ) ).toEqual( {
			settings: {
				typography: {
					fontSizes: { custom: variationFontSizes },
					fontFamilies: { custom: userFontFamilies },
				},
			},
		} );
	} );

	it( 'ignores user settings that are not presets', () => {
		const variation = { settings: { typography: { fluid: false } } };
		const user = {
			settings: {
				typography: { fluid: true },
				layout: { contentSize: '800px' },
			},
		};

		expect( withUserCustomPresets( variation, user ) ).toBe( variation );
	} );

	it( 'does not change a variation whose palette is a plain array', () => {
		const variation = {
			settings: { color: { palette: themeColors } },
		};
		const user = {
			settings: { color: { palette: { custom: customColors } } },
		};

		expect( withUserCustomPresets( variation, user ) ).toBe( variation );
	} );
} );
