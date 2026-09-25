import { describe, expect, it } from 'vitest';
import { getFontVariationAxes } from '../font-variations-panel';

const robotoFlex = {
	name: 'Roboto Flex',
	slug: 'roboto-flex',
	fontFamily: '"Roboto Flex", sans-serif',
	fontFace: [
		{
			fontFamily: 'Roboto Flex',
			fontWeight: '100 1000',
			axes: [
				{ tag: 'opsz', min: 8, default: 14, max: 144 },
				{ tag: 'wght', min: 100, default: 400, max: 1000 },
				{ tag: 'GRAD', min: -200, default: 0, max: 150 },
				{ tag: 'XTRA', min: 323, default: 468, max: 603 },
			],
		},
	],
};

function getSettings( fontVariations = true, families = [ robotoFlex ] ) {
	return {
		typography: {
			fontFamilies: { theme: families },
			fontVariations,
		},
	};
}

describe( 'getFontVariationAxes', () => {
	it( 'returns the axes the face declares, over the range it declares', () => {
		expect(
			getFontVariationAxes(
				getSettings(),
				'var:preset|font-family|roboto-flex'
			)
		).toEqual( [
			{ tag: 'GRAD', name: undefined, min: -200, max: 150, default: 0 },
			{ tag: 'XTRA', name: undefined, min: 323, max: 603, default: 468 },
		] );
	} );

	it( 'leaves out the axes OpenType registers', () => {
		const tags = getFontVariationAxes(
			getSettings(),
			'var:preset|font-family|roboto-flex'
		).map( ( { tag } ) => tag );

		[ 'wght', 'wdth', 'slnt', 'ital', 'opsz' ].forEach( ( registered ) => {
			expect( tags ).not.toContain( registered );
		} );
	} );

	it( 'resolves the font family from each value format', () => {
		[
			'var:preset|font-family|roboto-flex',
			'var(--wp--preset--font-family--roboto-flex)',
			'"Roboto Flex", sans-serif',
		].forEach( ( fontFamily ) => {
			expect(
				getFontVariationAxes( getSettings(), fontFamily )
			).toHaveLength( 2 );
		} );
	} );

	it( 'drops an axis with nothing to choose between', () => {
		const pinned = {
			...robotoFlex,
			fontFace: [
				{ axes: [ { tag: 'GRAD', min: 0, default: 0, max: 0 } ] },
			],
		};

		expect(
			getFontVariationAxes(
				getSettings( true, [ pinned ] ),
				'var:preset|font-family|roboto-flex'
			)
		).toEqual( [] );
	} );

	it( 'returns nothing when the panel is off, or no family resolves', () => {
		expect(
			getFontVariationAxes(
				getSettings( false ),
				'var:preset|font-family|roboto-flex'
			)
		).toEqual( [] );
		expect(
			getFontVariationAxes(
				{ typography: { fontFamilies: { theme: [ robotoFlex ] } } },
				'var:preset|font-family|roboto-flex'
			)
		).toEqual( [] );
		expect( getFontVariationAxes( getSettings(), undefined ) ).toEqual(
			[]
		);
	} );
} );

describe( 'getFontVariationAxes with several faces', () => {
	const family = {
		slug: 'split',
		fontFamily: 'Split',
		fontFace: [
			{
				fontStyle: 'normal',
				fontWeight: '100 900',
				axes: [
					{ tag: 'XTRA', min: 323, default: 468, max: 603 },
					{ tag: 'GRAD', min: -200, default: 0, max: 150 },
				],
			},
			{
				fontStyle: 'italic',
				fontWeight: '100 900',
				axes: [ { tag: 'XTRA', min: 323, default: 468, max: 500 } ],
			},
		],
	};
	const settings = {
		typography: {
			fontFamilies: { theme: [ family ] },
			fontVariations: true,
		},
	};
	const tags = ( axes ) =>
		axes.map( ( { tag, min, max } ) => `${ tag } ${ min }-${ max }` );

	it( 'uses the face that matches the font style', () => {
		expect(
			tags(
				getFontVariationAxes( settings, 'Split', {
					fontStyle: 'normal',
				} )
			)
		).toEqual( [ 'XTRA 323-603', 'GRAD -200-150' ] );
		expect(
			tags(
				getFontVariationAxes( settings, 'Split', {
					fontStyle: 'italic',
					fontWeight: '700',
				} )
			)
		).toEqual( [ 'XTRA 323-500' ] );
	} );

	it( 'intersects the faces when none matches', () => {
		expect(
			tags(
				getFontVariationAxes( settings, 'Split', {
					fontStyle: 'oblique',
				} )
			)
		).toEqual( [ 'XTRA 323-500' ] );
	} );

	it( 'matches weight ranges and single weights', () => {
		const weights = {
			typography: {
				...settings.typography,
				fontFamilies: {
					theme: [
						{
							...family,
							fontFace: [
								{
									fontWeight: 400,
									axes: [
										{ tag: 'GRAD', min: -50, max: 50 },
									],
								},
								{
									fontWeight: '700',
									axes: [ { tag: 'GRAD', min: 0, max: 150 } ],
								},
							],
						},
					],
				},
			},
		};
		expect( tags( getFontVariationAxes( weights, 'Split', {} ) ) ).toEqual(
			[ 'GRAD -50-50' ]
		);
		expect(
			tags(
				getFontVariationAxes( weights, 'Split', { fontWeight: 'bold' } )
			)
		).toEqual( [ 'GRAD 0-150' ] );
		expect(
			tags(
				getFontVariationAxes( weights, 'Split', { fontWeight: '550' } )
			)
		).toEqual( [ 'GRAD 0-50' ] );
	} );
} );
