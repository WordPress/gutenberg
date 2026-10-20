import { describe, expect, it } from 'vitest';
import { getInheritedTypographyStyle } from '../screen-block';

const ROOT_FONT = 'var:preset|font-family|body';
const HEADING_FONT = 'var:preset|font-family|heading';
const BLOCK_FONT = 'var:preset|font-family|block';
const VARIATION_FONT = 'var:preset|font-family|variation';

function getConfig( styles ) {
	return { settings: {}, styles };
}

describe( 'getInheritedTypographyStyle', () => {
	it( 'adds the root font family when the block has none', () => {
		const inheritedStyle = { typography: { fontSize: '1rem' } };
		const config = getConfig( {
			typography: { fontFamily: ROOT_FONT },
		} );

		expect(
			getInheritedTypographyStyle( config, inheritedStyle, {
				blockName: 'core/paragraph',
			} )
		).toEqual( {
			typography: { fontSize: '1rem', fontFamily: ROOT_FONT },
		} );
	} );

	it( 'prefers the heading element font family over the root one', () => {
		const config = getConfig( {
			typography: { fontFamily: ROOT_FONT },
			elements: { heading: { typography: { fontFamily: HEADING_FONT } } },
		} );

		expect(
			getInheritedTypographyStyle(
				config,
				{},
				{ blockName: 'core/heading' }
			).typography.fontFamily
		).toBe( HEADING_FONT );
	} );

	it( 'keeps a font family the block sets itself', () => {
		const inheritedStyle = { typography: { fontFamily: BLOCK_FONT } };
		const config = getConfig( {
			typography: { fontFamily: ROOT_FONT },
			blocks: {
				'core/paragraph': { typography: { fontFamily: BLOCK_FONT } },
			},
		} );

		expect(
			getInheritedTypographyStyle( config, inheritedStyle, {
				blockName: 'core/paragraph',
			} )
		).toBe( inheritedStyle );
	} );

	it( 'falls back to the block font family under a block style variation', () => {
		const config = getConfig( {
			typography: { fontFamily: ROOT_FONT },
			blocks: {
				'core/paragraph': {
					typography: { fontFamily: BLOCK_FONT },
					variations: { plain: { color: { text: 'red' } } },
				},
			},
		} );

		expect(
			getInheritedTypographyStyle(
				config,
				{ color: { text: 'red' } },
				{ blockName: 'core/paragraph', variationName: 'plain' }
			)
		).toEqual( {
			color: { text: 'red' },
			typography: { fontFamily: BLOCK_FONT },
		} );
	} );

	it( 'keeps the font family a block style variation sets', () => {
		const inheritedStyle = { typography: { fontFamily: VARIATION_FONT } };
		const config = getConfig( {
			typography: { fontFamily: ROOT_FONT },
			blocks: {
				'core/paragraph': {
					variations: {
						plain: { typography: { fontFamily: VARIATION_FONT } },
					},
				},
			},
		} );

		expect(
			getInheritedTypographyStyle( config, inheritedStyle, {
				blockName: 'core/paragraph',
				variationName: 'plain',
			} )
		).toBe( inheritedStyle );
	} );

	it( 'resolves the default state font family for a viewport state', () => {
		const config = getConfig( {
			typography: { fontFamily: ROOT_FONT },
		} );

		expect(
			getInheritedTypographyStyle(
				config,
				{},
				{ blockName: 'core/paragraph', viewport: '@mobile' }
			).typography.fontFamily
		).toBe( ROOT_FONT );
	} );

	it( 'returns the inherited style unchanged when no font family resolves', () => {
		const inheritedStyle = { typography: { fontSize: '1rem' } };

		expect(
			getInheritedTypographyStyle( getConfig( {} ), inheritedStyle, {
				blockName: 'core/paragraph',
			} )
		).toBe( inheritedStyle );
	} );
} );
