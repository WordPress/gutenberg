import { describe, expect, it } from 'vitest';
import { hasUserStylesForBlock } from '../screen-block-list';
import { getOverridingBlockTypes } from '../utils';

describe( 'hasUserStylesForBlock', () => {
	it( 'returns false when there is no user config', () => {
		expect( hasUserStylesForBlock( undefined, 'core/quote' ) ).toBe(
			false
		);
		expect( hasUserStylesForBlock( {}, 'core/quote' ) ).toBe( false );
	} );

	it( 'returns false for a block with no entry', () => {
		const user = {
			styles: {
				blocks: { 'core/paragraph': { color: { text: 'red' } } },
			},
		};
		expect( hasUserStylesForBlock( user, 'core/quote' ) ).toBe( false );
	} );

	it( 'returns true for a styles entry', () => {
		const user = {
			styles: { blocks: { 'core/quote': { color: { text: 'red' } } } },
		};
		expect( hasUserStylesForBlock( user, 'core/quote' ) ).toBe( true );
	} );

	it( 'returns true for a settings-only entry', () => {
		const user = {
			settings: {
				blocks: {
					'core/quote': {
						color: { palette: [ { slug: 'a', color: '#fff' } ] },
					},
				},
			},
		};
		expect( hasUserStylesForBlock( user, 'core/quote' ) ).toBe( true );
	} );

	it( 'returns true for a block style variation entry', () => {
		const user = {
			styles: {
				blocks: {
					'core/quote': {
						variations: { plain: { color: { text: 'red' } } },
					},
				},
			},
		};
		expect( hasUserStylesForBlock( user, 'core/quote' ) ).toBe( true );
	} );

	// Clearing a value writes `undefined` in place rather than removing the
	// key, so a husk like this means "not customized".
	it( 'returns false for an entry whose values were all cleared', () => {
		const user = {
			styles: {
				blocks: {
					'core/quote': {
						color: { text: undefined, background: undefined },
						typography: {},
					},
				},
			},
		};
		expect( hasUserStylesForBlock( user, 'core/quote' ) ).toBe( false );
	} );

	it( 'returns false for an empty array but true for a populated one', () => {
		const emptyPalette = {
			settings: { blocks: { 'core/quote': { color: { palette: [] } } } },
		};
		expect( hasUserStylesForBlock( emptyPalette, 'core/quote' ) ).toBe(
			false
		);

		const fullPalette = {
			settings: {
				blocks: {
					'core/quote': {
						color: { palette: [ { slug: 'a', color: '#fff' } ] },
					},
				},
			},
		};
		expect( hasUserStylesForBlock( fullPalette, 'core/quote' ) ).toBe(
			true
		);
	} );

	it( 'treats an empty string and zero as real values', () => {
		const emptyString = {
			styles: { blocks: { 'core/quote': { css: '' } } },
		};
		expect( hasUserStylesForBlock( emptyString, 'core/quote' ) ).toBe(
			true
		);

		const zero = {
			styles: { blocks: { 'core/quote': { spacing: { padding: 0 } } } },
		};
		expect( hasUserStylesForBlock( zero, 'core/quote' ) ).toBe( true );
	} );

	it( 'returns true when only one of the two roots has a real value', () => {
		const user = {
			styles: {
				blocks: { 'core/quote': { color: { text: undefined } } },
			},
			settings: {
				blocks: {
					'core/quote': { typography: { customFontSize: true } },
				},
			},
		};
		expect( hasUserStylesForBlock( user, 'core/quote' ) ).toBe( true );
	} );
} );

describe( 'getOverridingBlockTypes', () => {
	function getConfig( blocks ) {
		return {
			settings: { typography: { lineHeight: true } },
			styles: {
				typography: { fontWeight: '300' },
				elements: {
					heading: {
						typography: { fontWeight: '400' },
						':hover': { typography: { fontWeight: '500' } },
					},
					h2: { typography: { fontSize: '2rem' } },
				},
				blocks,
			},
		};
	}

	it.each( [ 'heading', 'h5' ] )(
		'lists a block type that sets a property a heading element sets on %s',
		( element ) => {
			const config = getConfig( {
				'core/post-title': { typography: { fontSize: '3rem' } },
			} );
			expect(
				getOverridingBlockTypes( config, element, [
					'core/heading',
					'core/post-title',
				] )
			).toEqual( [ 'core/post-title' ] );
		}
	);

	it.each( [
		[
			'a property the element leaves to the root styles',
			{ typography: { lineHeight: '2' } },
		],
		[ 'state styles', { ':hover': { typography: { fontWeight: '700' } } } ],
		[
			'block style variations',
			{ variations: { plain: { typography: { fontWeight: '700' } } } },
		],
	] )( 'skips %s', ( _, style ) => {
		const config = getConfig( { 'core/post-title': style } );
		expect(
			getOverridingBlockTypes( config, 'heading', [ 'core/post-title' ] )
		).toEqual( [] );
	} );

	it( 'resolves an element value that refers to block styles', () => {
		const config = {
			styles: {
				elements: {
					heading: {
						typography: {
							letterSpacing: {
								ref: 'styles.blocks.core/heading.typography.letterSpacing',
							},
						},
					},
				},
				blocks: {
					'core/heading': { typography: { letterSpacing: '1px' } },
					'core/post-title': { typography: { letterSpacing: '2px' } },
				},
			},
		};
		expect(
			getOverridingBlockTypes( config, 'heading', [
				'core/heading',
				'core/post-title',
			] )
		).toEqual( [ 'core/heading', 'core/post-title' ] );
	} );

	function getButtonConfig( elementStyle, blockStyle ) {
		return {
			styles: {
				elements: { button: elementStyle },
				blocks: { 'core/button': blockStyle },
			},
		};
	}

	it.each( [
		[
			'a per-side block value against an element shorthand',
			{ border: { radius: '4px' } },
			{ border: { radius: { topLeft: '8px' } } },
		],
		[
			'a block shorthand against a per-side element value',
			{ spacing: { padding: { top: '4px' } } },
			{ spacing: { padding: '8px' } },
		],
		[
			'a block radius shorthand against an element corner',
			{ border: { radius: { bottomRight: '4px' } } },
			{ border: { radius: '8px' } },
		],
		[
			'a block padding side against an element shorthand',
			{ spacing: { padding: '4px' } },
			{ spacing: { padding: { left: '8px' } } },
		],
		[
			'a block margin side against an element shorthand',
			{ spacing: { margin: '4px' } },
			{ spacing: { margin: { bottom: '8px' } } },
		],
		[
			'a block margin shorthand against an element side',
			{ spacing: { margin: { top: '4px' } } },
			{ spacing: { margin: '8px' } },
		],
		[
			'a block border side color against an element border color',
			{ border: { color: '#000' } },
			{ border: { top: { color: '#fff' } } },
		],
		[
			'a block border color against an element border side color',
			{ border: { left: { color: '#000' } } },
			{ border: { color: '#fff' } },
		],
		[
			'a block border side width against an element border width',
			{ border: { width: '1px' } },
			{ border: { right: { width: '2px' } } },
		],
		[
			'a block border width against an element border side width',
			{ border: { bottom: { width: '1px' } } },
			{ border: { width: '2px' } },
		],
		[
			'a block border side style against an element border style',
			{ border: { style: 'solid' } },
			{ border: { bottom: { style: 'dashed' } } },
		],
		[
			'a block border style against an element border side style',
			{ border: { top: { style: 'solid' } } },
			{ border: { style: 'dashed' } },
		],
		[
			'a block background color against an element gradient',
			{ color: { gradient: 'linear-gradient(#000, #fff)' } },
			{ color: { background: '#fff' } },
		],
		[
			'a block gradient against an element background color',
			{ color: { background: '#000' } },
			{ color: { gradient: 'linear-gradient(#000, #fff)' } },
		],
		[
			'a block gradient against an element gradient',
			{ color: { gradient: 'linear-gradient(#000, #fff)' } },
			{ color: { gradient: 'linear-gradient(#fff, #000)' } },
		],
	] )( 'lists %s', ( _, elementStyle, blockStyle ) => {
		expect(
			getOverridingBlockTypes(
				getButtonConfig( elementStyle, blockStyle ),
				'button',
				[ 'core/button' ]
			)
		).toEqual( [ 'core/button' ] );
	} );

	it.each( [
		[
			'border colors on different sides',
			{ border: { left: { color: '#000' } } },
			{ border: { top: { color: '#fff' } } },
		],
		[
			'padding on different sides',
			{ spacing: { padding: { top: '4px' } } },
			{ spacing: { padding: { left: '8px' } } },
		],
		[
			'different radius corners',
			{ border: { radius: { topLeft: '4px' } } },
			{ border: { radius: { topRight: '8px' } } },
		],
		[
			'a border side width against a border color',
			{ border: { color: '#000' } },
			{ border: { top: { width: '2px' } } },
		],
		[
			'a text color against a gradient',
			{ color: { gradient: 'linear-gradient(#000, #fff)' } },
			{ color: { text: '#fff' } },
		],
	] )( 'skips %s', ( _, elementStyle, blockStyle ) => {
		expect(
			getOverridingBlockTypes(
				getButtonConfig( elementStyle, blockStyle ),
				'button',
				[ 'core/button' ]
			)
		).toEqual( [] );
	} );
} );
