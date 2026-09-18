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
		const settings = getSettings( [
			{ tag: 'GRAD', min: -50, max: 50 },
			{ tag: 'opsz' },
		] );

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
		const settings = getSettings( [ { tag: 'GRAD' } ] );

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
		const settings = getSettings( [
			{ tag: 'wght', min: 300, max: 700 },
			{ tag: 'FILL', min: 0, max: 1 },
			{ tag: 'XTRA' },
		] );

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
		const settings = getSettings( [ { tag: 'GRAD', min: 200, max: 300 } ] );

		expect(
			getFontVariationAxes(
				settings,
				'var:preset|font-family|roboto-flex'
			)
		).toEqual( [] );
	} );

	it( 'returns nothing without a policy or a font family', () => {
		expect(
			getFontVariationAxes(
				{ typography: { fontFamilies: { theme: [ robotoFlex ] } } },
				'var:preset|font-family|roboto-flex'
			)
		).toEqual( [] );
		expect(
			getFontVariationAxes(
				getSettings( [ { tag: 'GRAD' } ] ),
				undefined
			)
		).toEqual( [] );
	} );
} );
