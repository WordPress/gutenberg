import { describe, expect, it } from 'vitest';
import deepFreeze from 'deep-freeze';
import {
	getBlockKeyboardShortcuts,
	getSupportedStyles,
} from '../private-selectors';

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
				'textAlign',
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
				'textAlign',
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
				'textAlign',
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

		it( 'return the list of globally supported panels for text element (textIndent should be excluded)', () => {
			const supports = getSupportedStyles( getState( [] ), null, 'text' );

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
				'textAlign',
				'textTransform',
				'letterSpacing',
			] );
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

		it( 'return textIndent when supported by blocks (not elements)', () => {
			const supports = getSupportedStyles(
				getState( [
					{
						name: 'core/paragraph',
						supports: {
							typography: {
								textIndent: true,
								fontSize: true,
							},
						},
					},
				] ),
				'core/paragraph'
			);

			expect( supports ).toEqual( [ 'fontSize', 'textIndent' ] );
		} );
	} );

	describe( 'getBlockKeyboardShortcuts', () => {
		const shortcut = {
			name: 'test/shortcut',
			description: 'Test shortcut.',
			keyCombination: { modifier: 'access', character: '1' },
		};

		const getState = ( { blockTypes = [], blockVariations = {} } = {} ) =>
			deepFreeze( {
				blockTypes: keyBlocksByName( blockTypes ),
				blockVariations,
			} );

		it( 'returns an empty list when no block declares a shortcut', () => {
			expect(
				getBlockKeyboardShortcuts(
					getState( {
						blockTypes: [
							{
								name: 'core/heading',
								transforms: {
									to: [
										{
											type: 'block',
											blocks: [ 'core/paragraph' ],
										},
									],
								},
							},
						],
						blockVariations: {
							'core/heading': [ { name: 'h1' } ],
						},
					} )
				)
			).toEqual( [] );
		} );

		it( 'restricts a variation shortcut to the block type declaring it', () => {
			expect(
				getBlockKeyboardShortcuts(
					getState( {
						blockTypes: [ { name: 'core/heading' } ],
						blockVariations: {
							'core/heading': [ { name: 'h1', shortcut } ],
						},
					} )
				)
			).toEqual( [
				{
					...shortcut,
					targetBlockName: 'core/heading',
					blockNames: [ 'core/heading' ],
					variationName: 'h1',
				},
			] );
		} );

		it( 'resolves a `to` transform shortcut to the first target block', () => {
			expect(
				getBlockKeyboardShortcuts(
					getState( {
						blockTypes: [
							{
								name: 'core/heading',
								transforms: {
									to: [
										{
											type: 'block',
											blocks: [ 'core/paragraph' ],
											shortcuts: [ shortcut ],
										},
									],
								},
							},
						],
					} )
				)
			).toEqual( [
				{
					...shortcut,
					targetBlockName: 'core/paragraph',
					blockNames: [ 'core/heading' ],
					variationName: undefined,
				},
			] );
		} );

		it( 'resolves a `from` transform shortcut to the declaring block type', () => {
			expect(
				getBlockKeyboardShortcuts(
					getState( {
						blockTypes: [
							{
								name: 'core/heading',
								transforms: {
									from: [
										{
											type: 'block',
											blocks: [
												'core/paragraph',
												'core/list',
											],
											shortcuts: [ shortcut ],
										},
									],
								},
							},
						],
					} )
				)
			).toEqual( [
				{
					...shortcut,
					targetBlockName: 'core/heading',
					blockNames: [ 'core/paragraph', 'core/list' ],
					variationName: undefined,
				},
			] );
		} );

		it( 'lets one transform carry a shortcut per target variation', () => {
			expect(
				getBlockKeyboardShortcuts(
					getState( {
						blockTypes: [
							{
								name: 'core/heading',
								transforms: {
									from: [
										{
											type: 'block',
											blocks: [ 'core/paragraph' ],
											shortcuts: [
												{
													...shortcut,
													name: 'test/h1',
													variationName: 'h1',
												},
												{
													...shortcut,
													name: 'test/h2',
													variationName: 'h2',
												},
											],
										},
									],
								},
							},
						],
					} )
				)
			).toEqual( [
				{
					...shortcut,
					name: 'test/h1',
					targetBlockName: 'core/heading',
					blockNames: [ 'core/paragraph' ],
					variationName: 'h1',
				},
				{
					...shortcut,
					name: 'test/h2',
					targetBlockName: 'core/heading',
					blockNames: [ 'core/paragraph' ],
					variationName: 'h2',
				},
			] );
		} );

		it( 'ignores shortcuts on transforms that cannot apply them', () => {
			expect(
				getBlockKeyboardShortcuts(
					getState( {
						blockTypes: [
							{
								name: 'core/heading',
								transforms: {
									// Not a block transform.
									from: [
										{
											type: 'prefix',
											prefix: '#',
											shortcuts: [ shortcut ],
										},
									],
									// No target block to switch to.
									to: [
										{
											type: 'block',
											shortcuts: [ shortcut ],
										},
									],
								},
							},
						],
					} )
				)
			).toEqual( [] );
		} );
	} );
} );
