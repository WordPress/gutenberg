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

function getSettings( policy ) {
	return {
		typography: {
			fontFamilies: { theme: [ robotoFlex ] },
			fontVariations: { 'roboto-flex': policy },
		},
	};
}

describe( 'getFontVariationAxes', () => {
	it( 'returns the policy axes within the range the face declares', () => {
		const settings = getSettings( {
			GRAD: { min: -50, max: 50 },
			opsz: {},
		} );

		expect(
			getFontVariationAxes(
				settings,
				'var:preset|font-family|roboto-flex'
			)
		).toEqual( [
			{ tag: 'GRAD', name: undefined, min: -50, max: 50, default: 0 },
			{ tag: 'opsz', name: undefined, min: 8, max: 144, default: 14 },
		] );
	} );

	it( 'resolves the font family from each value format', () => {
		const settings = getSettings( { GRAD: {} } );

		[
			'var:preset|font-family|roboto-flex',
			'var(--wp--preset--font-family--roboto-flex)',
			'"Roboto Flex", sans-serif',
		].forEach( ( fontFamily ) => {
			expect( getFontVariationAxes( settings, fontFamily ) ).toHaveLength(
				1
			);
		} );
	} );

	it( 'ignores registered axes and axes the face does not have', () => {
		const settings = getSettings( {
			wght: { min: 300, max: 700 },
			FILL: { min: 0, max: 1 },
			XTRA: {},
		} );

		expect(
			getFontVariationAxes(
				settings,
				'var:preset|font-family|roboto-flex'
			)
		).toEqual( [
			{ tag: 'XTRA', name: undefined, min: 323, max: 603, default: 468 },
		] );
	} );

	it( 'drops an axis whose ranges do not overlap', () => {
		const settings = getSettings( { GRAD: { min: 200, max: 300 } } );

		expect(
			getFontVariationAxes(
				settings,
				'var:preset|font-family|roboto-flex'
			)
		).toEqual( [] );
	} );

	it( 'shows axes in the order the policy lists them', () => {
		const settings = getSettings( { opsz: {}, XTRA: {}, GRAD: {} } );

		expect(
			getFontVariationAxes(
				settings,
				'var:preset|font-family|roboto-flex'
			).map( ( { tag } ) => tag )
		).toEqual( [ 'opsz', 'XTRA', 'GRAD' ] );
	} );

	it( 'does not read a policy written as a list', () => {
		const settings = getSettings( [ { tag: 'GRAD' } ] );

		expect(
			getFontVariationAxes(
				settings,
				'var:preset|font-family|roboto-flex'
			)
		).toEqual( [] );
	} );

	it( 'reads an axis sent as an empty list as having no options', () => {
		const settings = getSettings( {
			GRAD: { min: -50, max: 50 },
			opsz: [],
		} );

		expect(
			getFontVariationAxes(
				settings,
				'var:preset|font-family|roboto-flex'
			).map( ( { tag, min, max } ) => `${ tag } ${ min }-${ max }` )
		).toEqual( [ 'GRAD -50-50', 'opsz 8-144' ] );
	} );

	it( 'returns nothing without a policy or a font family', () => {
		expect(
			getFontVariationAxes(
				{ typography: { fontFamilies: { theme: [ robotoFlex ] } } },
				'var:preset|font-family|roboto-flex'
			)
		).toEqual( [] );
		expect(
			getFontVariationAxes( getSettings( { GRAD: {} } ), undefined )
		).toEqual( [] );
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
					{ tag: 'opsz', min: 8, default: 14, max: 144 },
					{ tag: 'GRAD', min: -200, default: 0, max: 150 },
				],
			},
			{
				fontStyle: 'italic',
				fontWeight: '100 900',
				axes: [ { tag: 'opsz', min: 8, default: 14, max: 36 } ],
			},
		],
	};
	const settings = {
		typography: {
			fontFamilies: { theme: [ family ] },
			fontVariations: { split: { opsz: {}, GRAD: {} } },
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
		).toEqual( [ 'opsz 8-144', 'GRAD -200-150' ] );
		expect(
			tags(
				getFontVariationAxes( settings, 'Split', {
					fontStyle: 'italic',
					fontWeight: '700',
				} )
			)
		).toEqual( [ 'opsz 8-36' ] );
	} );

	it( 'intersects the faces when none matches', () => {
		expect(
			tags(
				getFontVariationAxes( settings, 'Split', {
					fontStyle: 'oblique',
				} )
			)
		).toEqual( [ 'opsz 8-36' ] );
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
