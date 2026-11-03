import { describe, expect, it } from 'vitest';
import {
	MAX_CUSTOM_FONT_SIZE,
	MIN_CUSTOM_FONT_SIZE,
	clampCustomFontSize,
	findActiveWritingStyle,
	getSteppedFontSize,
	getWritingStyles,
	groupWritingStylesByFont,
	parseFontSizeToPx,
	resolveStyleTypography,
} from '../utils';

const FONT_FAMILIES = [
	{
		slug: 'display',
		name: 'Bricolage Grotesque',
		fontFamily: '"Bricolage Grotesque", sans-serif',
	},
	{
		slug: 'body',
		name: 'Instrument Sans',
		fontFamily: '"Instrument Sans", sans-serif',
	},
];

const FONT_SIZES = [
	{ slug: 'small', name: 'Small', size: '14px' },
	{ slug: 'medium', name: 'Medium', size: '17px' },
	{ slug: 'large', name: 'Large', size: '24px' },
	{ slug: 'x-large', name: 'Extra large', size: '40px' },
];

// A merged global styles config in the shape `@wordpress/global-styles-engine`
// produces: the root typography, per-element typography for the heading
// levels, and per-block typography for the quote.
const GLOBAL_STYLES = {
	settings: {
		typography: {
			fontFamilies: { theme: FONT_FAMILIES },
			fontSizes: { theme: FONT_SIZES },
		},
	},
	styles: {
		typography: {
			fontFamily: '"Instrument Sans", sans-serif',
			fontSize: '17px',
		},
		elements: {
			h1: {
				typography: {
					fontFamily: '"Bricolage Grotesque", sans-serif',
					fontSize: '60px',
				},
			},
			h2: {
				typography: {
					fontFamily: '"Bricolage Grotesque", sans-serif',
					fontSize: '40px',
				},
			},
		},
		blocks: {
			'core/quote': {
				typography: {
					fontFamily: '"Newsreader", serif',
					fontSize: '22px',
				},
			},
		},
	},
};

const WRITING_BLOCKS = [
	{
		name: 'core/heading',
		title: 'Heading',
		variations: [ 1, 2, 3, 4, 5, 6 ].map( ( level ) => ( {
			name: `h${ level }`,
			title: `Heading ${ level }`,
			attributes: { level },
		} ) ),
	},
	{ name: 'core/paragraph', title: 'Paragraph', variations: [] },
	{ name: 'core/quote', title: 'Quote', variations: [] },
];

describe( 'parseFontSizeToPx', () => {
	it( 'reads px, rem, em and bare numbers', () => {
		expect( parseFontSizeToPx( '24px' ) ).toBe( 24 );
		expect( parseFontSizeToPx( '1.5rem' ) ).toBe( 24 );
		expect( parseFontSizeToPx( '1.5em' ) ).toBe( 24 );
		expect( parseFontSizeToPx( 24 ) ).toBe( 24 );
		expect( parseFontSizeToPx( '24' ) ).toBe( 24 );
	} );

	it( 'gives up on values it cannot measure', () => {
		expect(
			parseFontSizeToPx( 'clamp(1rem, 1rem + 2vw, 2rem)' )
		).toBeUndefined();
		expect( parseFontSizeToPx( '50%' ) ).toBeUndefined();
		expect( parseFontSizeToPx( undefined ) ).toBeUndefined();
		expect( parseFontSizeToPx( '' ) ).toBeUndefined();
	} );
} );

describe( 'clampCustomFontSize', () => {
	it( 'keeps a size within the range the toolbar offers', () => {
		expect( clampCustomFontSize( '32' ) ).toBe( 32 );
		expect( clampCustomFontSize( 32 ) ).toBe( 32 );
		expect( clampCustomFontSize( '32px' ) ).toBe( 32 );
		expect( clampCustomFontSize( 2 ) ).toBe( MIN_CUSTOM_FONT_SIZE );
		expect( clampCustomFontSize( 999 ) ).toBe( MAX_CUSTOM_FONT_SIZE );
	} );

	it( 'rounds to whole pixels', () => {
		expect( clampCustomFontSize( '32.6' ) ).toBe( 33 );
	} );

	it( 'rejects anything that is not a size', () => {
		expect( clampCustomFontSize( 'large' ) ).toBeUndefined();
		expect( clampCustomFontSize( '' ) ).toBeUndefined();
		expect( clampCustomFontSize( undefined ) ).toBeUndefined();
		expect( clampCustomFontSize( NaN ) ).toBeUndefined();
	} );
} );

describe( 'resolveStyleTypography', () => {
	it( 'prefers the element style, which is the specific one', () => {
		expect(
			resolveStyleTypography( GLOBAL_STYLES, 'core/heading', 'h2' )
		).toEqual( {
			fontFamily: '"Bricolage Grotesque", sans-serif',
			fontSize: '40px',
		} );
	} );

	it( 'falls back to the block style', () => {
		expect( resolveStyleTypography( GLOBAL_STYLES, 'core/quote' ) ).toEqual(
			{
				fontFamily: '"Newsreader", serif',
				fontSize: '22px',
			}
		);
	} );

	it( 'falls back to the root style', () => {
		expect(
			resolveStyleTypography( GLOBAL_STYLES, 'core/paragraph' )
		).toEqual( {
			fontFamily: '"Instrument Sans", sans-serif',
			fontSize: '17px',
		} );
	} );

	it( 'falls back to the root style for an element with no style of its own', () => {
		expect(
			resolveStyleTypography( GLOBAL_STYLES, 'core/heading', 'h6' )
		).toEqual( {
			fontFamily: '"Instrument Sans", sans-serif',
			fontSize: '17px',
		} );
	} );
} );

describe( 'getWritingStyles', () => {
	const styles = getWritingStyles( {
		writingBlocks: WRITING_BLOCKS,
		globalStyles: GLOBAL_STYLES,
		fontFamilies: FONT_FAMILIES,
	} );

	it( 'expands the heading block into one entry per level', () => {
		const headings = styles.filter(
			( style ) => style.blockName === 'core/heading'
		);
		expect( headings ).toHaveLength( 6 );
		expect( headings.map( ( style ) => style.label ) ).toEqual( [
			'Heading 1',
			'Heading 2',
			'Heading 3',
			'Heading 4',
			'Heading 5',
			'Heading 6',
		] );
		expect( headings[ 1 ] ).toMatchObject( {
			key: 'core/heading:h2',
			variation: 'h2',
			attributes: { level: 2 },
			fontFamily: '"Bricolage Grotesque", sans-serif',
			fontFamilyName: 'Bricolage Grotesque',
			fontSize: '40px',
		} );
	} );

	it( 'gives every other writing block a single entry', () => {
		expect(
			styles.find( ( style ) => style.blockName === 'core/paragraph' )
		).toMatchObject( {
			key: 'core/paragraph',
			label: 'Paragraph',
			variation: undefined,
			fontFamilyName: 'Instrument Sans',
			fontSize: '17px',
		} );
	} );

	it( 'leaves the font unnamed when no preset matches it', () => {
		expect(
			styles.find( ( style ) => style.blockName === 'core/quote' )
		).toMatchObject( {
			fontFamily: '"Newsreader", serif',
			fontFamilyName: undefined,
		} );
	} );
} );

describe( 'groupWritingStylesByFont', () => {
	it( 'groups by font in the order the fonts first appear', () => {
		const groups = groupWritingStylesByFont(
			getWritingStyles( {
				writingBlocks: WRITING_BLOCKS,
				globalStyles: GLOBAL_STYLES,
				fontFamilies: FONT_FAMILIES,
			} )
		);

		expect(
			groups.map( ( group ) => [
				group.name,
				group.styles.map( ( style ) => style.label ),
			] )
		).toEqual( [
			[ 'Bricolage Grotesque', [ 'Heading 1', 'Heading 2' ] ],
			[
				'Instrument Sans',
				[
					'Heading 3',
					'Heading 4',
					'Heading 5',
					'Heading 6',
					'Paragraph',
				],
			],
			[ undefined, [ 'Quote' ] ],
		] );
	} );
} );

describe( 'findActiveWritingStyle', () => {
	const styles = getWritingStyles( {
		writingBlocks: WRITING_BLOCKS,
		globalStyles: GLOBAL_STYLES,
		fontFamilies: FONT_FAMILIES,
	} );

	it( 'matches a heading on its level', () => {
		expect(
			findActiveWritingStyle( styles, 'core/heading', { level: 3 } )?.key
		).toBe( 'core/heading:h3' );
	} );

	it( 'matches a block with no level', () => {
		expect(
			findActiveWritingStyle( styles, 'core/paragraph', {} )?.key
		).toBe( 'core/paragraph' );
	} );

	it( 'returns nothing for a block that is not a writing style', () => {
		expect(
			findActiveWritingStyle( styles, 'core/image', {} )
		).toBeUndefined();
	} );
} );

describe( 'getSteppedFontSize', () => {
	it( 'steps up and down through the theme sizes', () => {
		expect( getSteppedFontSize( '17px', FONT_SIZES, 1 )?.slug ).toBe(
			'large'
		);
		expect( getSteppedFontSize( '17px', FONT_SIZES, -1 )?.slug ).toBe(
			'small'
		);
	} );

	it( 'steps from a size of your own to the nearest theme size beyond it', () => {
		expect( getSteppedFontSize( '20px', FONT_SIZES, 1 )?.slug ).toBe(
			'large'
		);
		expect( getSteppedFontSize( '20px', FONT_SIZES, -1 )?.slug ).toBe(
			'medium'
		);
	} );

	it( 'stops at the ends', () => {
		expect( getSteppedFontSize( '40px', FONT_SIZES, 1 ) ).toBeUndefined();
		expect( getSteppedFontSize( '14px', FONT_SIZES, -1 ) ).toBeUndefined();
	} );

	it( 'does nothing when the current size cannot be measured', () => {
		expect(
			getSteppedFontSize( 'clamp(1rem, 2vw, 2rem)', FONT_SIZES, 1 )
		).toBeUndefined();
	} );
} );
