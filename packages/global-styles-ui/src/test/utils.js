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
	const customGradients = [
		{
			slug: 'my-gradient',
			gradient: 'linear-gradient(#fff, #000)',
			name: 'MyGradient',
		},
	];
	const customDuotones = [
		{ slug: 'my-duotone', colors: [ '#000', '#fff' ], name: 'MyDuotone' },
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

	it( 'keeps the user custom colors, gradients and duotones', () => {
		const variation = {
			title: 'Ember',
			settings: { color: { palette: { theme: themeColors } } },
			styles: { color: { background: 'red' } },
		};
		const user = {
			settings: {
				color: {
					palette: { custom: customColors },
					gradients: { custom: customGradients },
					duotone: { custom: customDuotones },
				},
			},
		};

		expect( withUserCustomPresets( variation, user ) ).toEqual( {
			title: 'Ember',
			settings: {
				color: {
					palette: { theme: themeColors, custom: customColors },
					gradients: { custom: customGradients },
					duotone: { custom: customDuotones },
				},
			},
			styles: { color: { background: 'red' } },
		} );
	} );

	it( 'adds the user custom colors to a variation without settings', () => {
		const user = {
			settings: { color: { palette: { custom: customColors } } },
		};

		expect( withUserCustomPresets( { title: 'Default' }, user ) ).toEqual( {
			title: 'Default',
			settings: { color: { palette: { custom: customColors } } },
		} );
	} );

	it( 'keeps the custom colors the variation defines itself', () => {
		const variationColors = [
			{ slug: 'variation', color: '#ff0000', name: 'Variation' },
		];
		const variation = {
			settings: { color: { palette: { custom: variationColors } } },
		};
		const user = {
			settings: { color: { palette: { custom: customColors } } },
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

	it( 'keeps the user custom colors set on a block', () => {
		const variation = {
			settings: {
				color: { palette: { theme: themeColors } },
				blocks: {
					'core/paragraph': { typography: { fontSize: '1rem' } },
				},
			},
		};
		const user = {
			settings: {
				blocks: {
					'core/paragraph': {
						color: { palette: { custom: customColors } },
					},
					'core/heading': {
						color: { gradients: { custom: customGradients } },
					},
				},
			},
		};

		expect( withUserCustomPresets( variation, user ) ).toEqual( {
			settings: {
				color: { palette: { theme: themeColors } },
				blocks: {
					'core/paragraph': {
						typography: { fontSize: '1rem' },
						color: { palette: { custom: customColors } },
					},
					'core/heading': {
						color: { gradients: { custom: customGradients } },
					},
				},
			},
		} );
	} );

	it( 'keeps the block custom colors the variation defines itself', () => {
		const variationColors = [
			{ slug: 'variation', color: '#ff0000', name: 'Variation' },
		];
		const variation = {
			settings: {
				blocks: {
					'core/paragraph': {
						color: { palette: { custom: variationColors } },
					},
				},
			},
		};
		const user = {
			settings: {
				blocks: {
					'core/paragraph': {
						color: { palette: { custom: customColors } },
					},
				},
			},
		};

		expect( withUserCustomPresets( variation, user ) ).toBe( variation );
	} );
} );
