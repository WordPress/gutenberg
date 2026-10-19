import { afterEach, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import {
	getNewIndexFromPresets,
	getValidCustomStates,
	getValidPseudoStates,
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

describe( 'getValidCustomStates', () => {
	function registerNavigationLink( selectors ) {
		registerBlockType( 'core/navigation-link', {
			apiVersion: 3,
			title: 'Custom Link',
			category: 'design',
			attributes: {},
			edit: () => null,
			save: () => null,
			selectors,
		} );
	}

	afterEach( () => {
		unregisterBlockType( 'core/navigation-link' );
	} );

	it( 'offers Current for the Navigation Link block when it declares the selector', () => {
		registerNavigationLink( {
			states: { '-current': '.wp-block-navigation .current-menu-item' },
		} );

		expect( getValidCustomStates( 'core/navigation-link' ) ).toEqual( [
			{ value: '-current', label: 'Current' },
		] );
	} );

	it( 'offers no custom states when the block declares no selector for them', () => {
		registerNavigationLink( {} );

		expect( getValidCustomStates( 'core/navigation-link' ) ).toEqual( [] );
	} );
} );
