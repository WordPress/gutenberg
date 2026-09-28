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
			{ tag: 'opsz', name: undefined, min: 8, max: 144, default: 14 },
			{ tag: 'GRAD', name: undefined, min: -200, max: 150, default: 0 },
			{ tag: 'XTRA', name: undefined, min: 323, max: 603, default: 468 },
		] );
	} );

	it( 'leaves out the axes a CSS property owns', () => {
		/*
		 * A face declaring all five registered axes. The four a property owns
		 * do not pass: writing one into `font-variation-settings` takes it away
		 * from that property, and with `"slnt" 0` alongside `font-style:
		 * oblique 10deg` the text renders upright. `opsz` does pass, since
		 * `font-optical-sizing` switches the browser's tracking rather than
		 * taking a coordinate, so nothing else can ask for a size.
		 */
		const everyAxis = {
			...robotoFlex,
			fontFace: [
				{
					axes: [
						{ tag: 'wght', min: 100, default: 400, max: 1000 },
						{ tag: 'wdth', min: 25, default: 100, max: 151 },
						{ tag: 'slnt', min: -10, default: 0, max: 0 },
						{ tag: 'ital', min: 0, default: 0, max: 1 },
						{ tag: 'opsz', min: 8, default: 14, max: 144 },
						{ tag: 'FILL', min: 0, default: 0, max: 1 },
					],
				},
			],
		};

		expect(
			getFontVariationAxes(
				getSettings( true, [ everyAxis ] ),
				'var:preset|font-family|roboto-flex'
			).map( ( { tag } ) => tag )
		).toEqual( [ 'opsz', 'FILL' ] );
	} );

	it( 'resolves the font family from each value format', () => {
		[
			'var:preset|font-family|roboto-flex',
			'var(--wp--preset--font-family--roboto-flex)',
			'"Roboto Flex", sans-serif',
		].forEach( ( fontFamily ) => {
			expect(
				getFontVariationAxes( getSettings(), fontFamily )
			).toHaveLength( 3 );
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

	it( 'uses the closest style when no face matches exactly', () => {
		expect(
			tags(
				getFontVariationAxes( settings, 'Split', {
					fontStyle: 'oblique',
				} )
			)
		).toEqual( [ 'XTRA 323-500' ] );
	} );

	it( 'matches width before style and weight', () => {
		const widths = {
			typography: {
				...settings.typography,
				fontFamilies: {
					theme: [
						{
							...family,
							fontFace: [
								{
									fontStretch: 'normal',
									axes: [
										{ tag: 'GRAD', min: -50, max: 50 },
									],
								},
								{
									fontStretch: 'condensed',
									axes: [ { tag: 'GRAD', min: 0, max: 150 } ],
								},
							],
						},
					],
				},
			},
		};
		expect(
			tags(
				getFontVariationAxes( widths, 'Split', {
					fontStretch: 'condensed',
				} )
			)
		).toEqual( [ 'GRAD 0-150' ] );
	} );

	it( 'matches an oblique angle inside the face descriptor range', () => {
		const oblique = {
			typography: {
				...settings.typography,
				fontFamilies: {
					theme: [
						{
							...family,
							fontFace: [
								{
									fontStyle: 'normal',
									axes: [
										{ tag: 'GRAD', min: -50, max: 50 },
									],
								},
								{
									fontStyle: 'oblique 0deg 10deg',
									axes: [ { tag: 'GRAD', min: 0, max: 150 } ],
								},
							],
						},
					],
				},
			},
		};
		expect(
			tags(
				getFontVariationAxes( oblique, 'Split', {
					fontStyle: 'oblique 6deg',
				} )
			)
		).toEqual( [ 'GRAD 0-150' ] );
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
		).toEqual( [ 'GRAD 0-150' ] );
	} );
} );
