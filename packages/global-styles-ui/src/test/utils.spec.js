/**
 * Internal dependencies
 */
import { getNewIndexFromPresets } from '../utils';
import { getFontFaceVariantName } from '../font-library/utils';

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

describe( 'getFontFaceVariantName', () => {
	it( 'uses the start of a variable weight range and explicit style', () => {
		expect(
			getFontFaceVariantName( {
				fontFamily: 'Afacad',
				fontStyle: 'normal',
				fontWeight: '400 700',
			} )
		).toBe( '400 Normal' );
	} );

	it( 'includes normal style for static weights', () => {
		expect(
			getFontFaceVariantName( {
				fontFamily: 'Afacad',
				fontStyle: 'normal',
				fontWeight: '600',
			} )
		).toBe( '600 Normal' );
	} );

	it( 'keeps numeric normal weight instead of semantic duplicated names', () => {
		expect(
			getFontFaceVariantName( {
				fontFamily: 'AR One Sans',
				fontStyle: 'normal',
				fontWeight: '400',
			} )
		).toBe( '400 Normal' );
	} );
} );
