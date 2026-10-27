import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
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
			expect( getOverridingBlockTypes( config, element ) ).toEqual( [
				'core/post-title',
			] );
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
		expect( getOverridingBlockTypes( config, 'heading' ) ).toEqual( [] );
	} );

	describe( 'with a heading block whose level defaults to 0', () => {
		beforeAll( () => {
			registerBlockType( 'core/site-tagline', {
				apiVersion: 3,
				title: 'Site Tagline',
				category: 'theme',
				attributes: { level: { type: 'number', default: 0 } },
			} );
		} );

		afterAll( () => {
			unregisterBlockType( 'core/site-tagline' );
		} );

		it( 'does not list it', () => {
			const config = getConfig( {
				'core/site-tagline': { typography: { fontWeight: '700' } },
			} );
			expect( getOverridingBlockTypes( config, 'heading' ) ).toEqual(
				[]
			);
		} );
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
		expect( getOverridingBlockTypes( config, 'heading' ) ).toEqual( [
			'core/heading',
			'core/post-title',
		] );
	} );

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
	] )( 'lists %s', ( _, elementStyle, blockStyle ) => {
		const config = {
			styles: {
				elements: { button: elementStyle },
				blocks: { 'core/button': blockStyle },
			},
		};
		expect( getOverridingBlockTypes( config, 'button' ) ).toEqual( [
			'core/button',
		] );
	} );
} );
