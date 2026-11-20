import { describe, expect, it } from 'vitest';
import type { FontFace } from '@wordpress/core-data';
import { sortFontFaces } from '../sort-font-faces';

const createFace = ( fontWeight: FontFace[ 'fontWeight' ] ): FontFace => ( {
	fontFamily: 'Example',
	fontStyle: 'normal',
	fontWeight,
} );

describe( 'sortFontFaces', () => {
	it.each( [ 'bolder', 'lighter', 'unknown', '' ] )(
		'places %p after numeric weights',
		( weight ) => {
			const unparseable = createFace( weight );
			const light = createFace( '100' );
			const heavy = createFace( '900' );

			expect( sortFontFaces( [ heavy, unparseable, light ] ) ).toEqual( [
				light,
				heavy,
				unparseable,
			] );
		}
	);

	it( 'preserves the order of unparseable weights after sorting numeric weights', () => {
		const bolder = createFace( 'bolder' );
		const lighter = createFace( 'lighter' );
		const unknown = createFace( 'unknown' );
		const light = createFace( '100' );
		const heavy = createFace( '900' );

		expect(
			sortFontFaces( [ bolder, heavy, lighter, light, unknown ] )
		).toEqual( [ light, heavy, bolder, lighter, unknown ] );
	} );

	it( 'sorts numeric, named, missing, and range weights before unparseable weights', () => {
		const weights = [
			'bolder',
			'bold',
			'600 900',
			500,
			undefined,
			'normal',
			'100',
		];
		expect( sortFontFaces( weights.map( createFace ) ) ).toEqual(
			[
				'100',
				undefined,
				'normal',
				500,
				'600 900',
				'bold',
				'bolder',
			].map( createFace )
		);
	} );

	it( 'keeps font styles grouped when placing unparseable weights last', () => {
		const normal = createFace( '400' );
		const normalRelative = createFace( 'lighter' );
		const italic = { ...createFace( '100' ), fontStyle: 'italic' };
		const italicRelative = {
			...createFace( 'bolder' ),
			fontStyle: 'italic',
		};

		expect(
			sortFontFaces( [ italicRelative, normalRelative, italic, normal ] )
		).toEqual( [ normal, normalRelative, italic, italicRelative ] );
	} );
} );
