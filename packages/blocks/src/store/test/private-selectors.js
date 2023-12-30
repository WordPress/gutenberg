/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { getSupportedStyles } from '../private-selectors';

const keyBlocksByName = ( blocks ) =>
	blocks.reduce(
		( result, block ) => ( { ...result, [ block.name ]: block } ),
		{}
	);

describe( 'private selectors', () => {
	describe( 'getSupportedStyles', () => {
		const getState = ( blocks ) => {
			return deepFreeze( {
				blockTypes: keyBlocksByName( blocks ),
			} );
		};

		it( 'return the list of globally supported panels (no block name)', () => {
			const supports = getSupportedStyles( getState( [] ) );

			expect( supports ).toEqual( [
				'background',
				'backgroundColor',
				'color',
				'linkColor',
				'captionColor',
				'buttonColor',
				'headingColor',
				'fontFamily',
				'fontSize',
				'fontStyle',
				'fontWeight',
				'lineHeight',
				'padding',
				'contentSize',
				'wideSize',
				'blockGap',
			] );
		} );

		it( 'return the list of globally supported panels including link specific styles', () => {
			const supports = getSupportedStyles( getState( [] ), null, 'link' );

			expect( supports ).toEqual( [
				'background',
				'backgroundColor',
				'color',
				'linkColor',
				'captionColor',
				'buttonColor',
				'headingColor',
				'fontFamily',
				'fontSize',
				'fontStyle',
				'fontWeight',
				'lineHeight',
				'padding',
				'contentSize',
				'wideSize',
				'blockGap',
				'textDecoration',
			] );
		} );

		it( 'return the list of globally supported panels including heading specific styles', () => {
			const supports = getSupportedStyles(
				getState( [] ),
				null,
				'heading'
			);

			expect( supports ).toEqual( [
				'background',
				'backgroundColor',
				'color',
				'linkColor',
				'captionColor',
				'buttonColor',
				'headingColor',
				'fontFamily',
				'fontStyle',
				'fontWeight',
				'lineHeight',
				'padding',
				'contentSize',
				'wideSize',
				'blockGap',
				'textTransform',
				'letterSpacing',
			] );
		} );

		it( 'return an empty list for unknown blocks', () => {
			const supports = getSupportedStyles(
				getState( [] ),
				'unkown/block'
			);

			expect( supports ).toEqual( [] );
		} );

		it( 'return empty by default for blocks without support keys', () => {
			const supports = getSupportedStyles(
				getState( [
					{
						name: 'core/example-block',
						supports: {},
					},
				] ),
				'core/example-block'
			);

			expect( supports ).toEqual( [] );
		} );

		it( 'return the allowed styles according to the blocks support keys', () => {
			const supports = getSupportedStyles(
				getState( [
					{
						name: 'core/example-block',
						supports: {
							typography: {
								__experimentalFontFamily: true,
								__experimentalFontStyle: true,
								__experimentalFontWeight: true,
								__experimentalTextDecoration: true,
								__experimentalTextTransform: true,
								__experimentalLetterSpacing: true,
								fontSize: true,
								lineHeight: true,
							},
						},
					},
				] ),
				'core/example-block'
			);

			expect( supports ).toEqual( [
				'fontFamily',
				'fontSize',
				'fontStyle',
				'fontWeight',
				'lineHeight',
				'textDecoration',
				'textTransform',
				'letterSpacing',
			] );
		} );
	} );
} );
