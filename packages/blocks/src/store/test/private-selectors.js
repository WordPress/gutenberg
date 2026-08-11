import deepFreeze from 'deep-freeze';
import {
	getSupportedStyles,
	getBlockBindingsSourceRevision,
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

	describe( 'getBlockBindingsSourceRevision', () => {
		it( 'should return 0 when there are no revisions recorded', () => {
			const state = deepFreeze( { blockBindingsSourceRevisions: {} } );

			expect( getBlockBindingsSourceRevision( state, 'my/source' ) ).toBe(
				0
			);
		} );

		it( 'should return the revision recorded for the given source', () => {
			const state = deepFreeze( {
				blockBindingsSourceRevisions: { 'my/source': 3 },
			} );

			expect( getBlockBindingsSourceRevision( state, 'my/source' ) ).toBe(
				3
			);
		} );

		it( 'should not be affected by another source’s revision', () => {
			const state = deepFreeze( {
				blockBindingsSourceRevisions: {
					'my/source': 3,
					'other/source': 10,
				},
			} );

			expect( getBlockBindingsSourceRevision( state, 'my/source' ) ).toBe(
				3
			);
		} );

		it( 'should add the global "__all" revision on top of the source-specific one', () => {
			const state = deepFreeze( {
				blockBindingsSourceRevisions: {
					'my/source': 3,
					__all: 2,
				},
			} );

			expect( getBlockBindingsSourceRevision( state, 'my/source' ) ).toBe(
				5
			);
		} );

		it( 'should return the global revision for a source with no revisions of its own', () => {
			const state = deepFreeze( {
				blockBindingsSourceRevisions: { __all: 2 },
			} );

			expect( getBlockBindingsSourceRevision( state, 'my/source' ) ).toBe(
				2
			);
		} );
	} );
} );
