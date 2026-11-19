import { describe, expect, test } from 'vitest';
import { DEFAULT_GRADIENT } from '../constants';
import {
	getGradientAstWithDefault,
	getGradientAstWithControlPoints,
	getStopCssColor,
} from '../utils';
import { serializeGradient } from '../serializer';

describe( 'CustomGradientPicker gradient parsing', () => {
	test.each( [
		'90deg',
		'0.25turn',
		'100grad',
		`${ Math.PI / 2 }rad`,
		'to right',
	] )( 'preserves the angle of %s when editing a color stop', ( angle ) => {
		const { gradientAST, hasGradient } = getGradientAstWithDefault(
			`linear-gradient(${ angle },red 0%,blue 100%)`
		);

		expect( hasGradient ).toBe( true );
		expect( gradientAST.orientation ).toEqual( {
			type: 'angular',
			value: '90',
			unit: 'deg',
		} );
		expect(
			serializeGradient(
				getGradientAstWithControlPoints( gradientAST, [
					{ color: 'red', position: 10 },
					{ color: 'blue', position: 100 },
				] )
			)
		).toBe( 'linear-gradient(90deg,rgb(255,0,0) 10%,rgb(0,0,255) 100%)' );
	} );

	test( 'preserves an opaque HSLA color when editing a stop', () => {
		const { gradientAST, hasGradient } = getGradientAstWithDefault(
			'linear-gradient(90deg,hsla(0 100% 50%) 0%,blue 100%)'
		);
		const controlPoints = gradientAST.colorStops.map( ( stop ) => ( {
			color: getStopCssColor( stop ),
			position: Number( stop.length?.value ),
		} ) );
		controlPoints[ 0 ].position = 10;

		expect( hasGradient ).toBe( true );
		expect( serializeGradient( gradientAST ) ).toBe(
			'linear-gradient(90deg,hsla(0,100%,50%,1) 0%,blue 100%)'
		);
		expect(
			serializeGradient(
				getGradientAstWithControlPoints( gradientAST, controlPoints )
			)
		).toBe( 'linear-gradient(90deg,rgb(255,0,0) 10%,rgb(0,0,255) 100%)' );
	} );

	test.each( [
		'conic-gradient(from 90deg at 25% 25%,red 0%,blue 100%)',
		'repeating-conic-gradient(red 0%,blue 100%)',
		'linear-gradient(90deg,red 0% 50%,blue 100%)',
	] )( 'uses the unselected fallback for unsupported %s', ( gradient ) => {
		const result = getGradientAstWithDefault( gradient );
		const fallback = getGradientAstWithDefault( DEFAULT_GRADIENT );

		expect( result.hasGradient ).toBe( false );
		expect( result.gradientAST ).toEqual( fallback.gradientAST );
	} );
} );

describe( 'getGradientAstWithDefault', () => {
	describe( 'with a color interpolation method', () => {
		test( 'reads an interpolation method placed before the angle', () => {
			const { gradientAST, hasGradient } = getGradientAstWithDefault(
				'linear-gradient(in oklch 160deg, #009ED4 0%, #FFCE00 100%)'
			);

			expect( hasGradient ).toBe( true );
			expect( gradientAST.colorInterpolation ).toBe( 'in oklch' );
			expect( gradientAST.orientation ).toEqual( {
				type: 'angular',
				value: '160',
				unit: 'deg',
			} );
			expect( serializeGradient( gradientAST ) ).toBe(
				'linear-gradient(in oklch 160deg,#009ED4 0%,#FFCE00 100%)'
			);
		} );

		test( 'reads an interpolation method placed after the direction', () => {
			const { gradientAST, hasGradient } = getGradientAstWithDefault(
				'linear-gradient(to right in oklab, #009ED4 0%, #FFCE00 100%)'
			);

			expect( hasGradient ).toBe( true );
			expect( gradientAST.colorInterpolation ).toBe( 'in oklab' );
			expect( gradientAST.orientation ).toEqual( {
				type: 'angular',
				value: '90',
				unit: 'deg',
			} );
		} );

		test( 'keeps the hue interpolation method of a polar color space', () => {
			const { gradientAST, hasGradient } = getGradientAstWithDefault(
				'linear-gradient(in oklch longer hue 160deg, #009ED4 0%, #FFCE00 100%)'
			);

			expect( hasGradient ).toBe( true );
			expect( gradientAST.colorInterpolation ).toBe(
				'in oklch longer hue'
			);
		} );

		// The keywords below are copied from the CSS Color 4 grammar for
		// `<rectangular-color-space>`, `<polar-color-space>` and
		// `<hue-interpolation-method>`, so that a keyword missing from the
		// picker's own lists is caught.
		// See https://www.w3.org/TR/css-color-4/#interpolation-space.
		test.each( [
			'srgb',
			'srgb-linear',
			'display-p3',
			'display-p3-linear',
			'a98-rgb',
			'prophoto-rgb',
			'rec2020',
			'lab',
			'oklab',
			'xyz',
			'xyz-d50',
			'xyz-d65',
			'hsl',
			'hwb',
			'lch',
			'oklch',
		] )( 'reads the %s color space', ( colorSpace ) => {
			const { gradientAST, hasGradient } = getGradientAstWithDefault(
				`linear-gradient(in ${ colorSpace } 160deg, #009ED4 0%, #FFCE00 100%)`
			);

			expect( hasGradient ).toBe( true );
			expect( gradientAST.colorInterpolation ).toBe(
				`in ${ colorSpace }`
			);
		} );

		test.each( [ 'shorter', 'longer', 'increasing', 'decreasing' ] )(
			'reads the %s hue interpolation method',
			( method ) => {
				const { gradientAST, hasGradient } = getGradientAstWithDefault(
					`linear-gradient(in oklch ${ method } hue 160deg, #009ED4 0%, #FFCE00 100%)`
				);

				expect( hasGradient ).toBe( true );
				expect( gradientAST.colorInterpolation ).toBe(
					`in oklch ${ method } hue`
				);
			}
		);

		test( 'falls back to the default gradient for an unknown color space', () => {
			const { gradientAST, hasGradient } = getGradientAstWithDefault(
				'linear-gradient(in not-a-space 160deg, #009ED4 0%, #FFCE00 100%)'
			);

			expect( console ).toHaveWarned();
			expect( hasGradient ).toBe( false );
			expect( gradientAST.colorInterpolation ).toBeUndefined();
		} );

		test( 'reads an interpolation method that is the whole first argument', () => {
			const { gradientAST, hasGradient } = getGradientAstWithDefault(
				'linear-gradient(in oklch, #009ED4 0%, #FFCE00 100%)'
			);

			expect( hasGradient ).toBe( true );
			expect( gradientAST.colorInterpolation ).toBe( 'in oklch' );
			expect( serializeGradient( gradientAST ) ).toBe(
				'linear-gradient(in oklch,#009ED4 0%,#FFCE00 100%)'
			);
		} );

		test( 'falls back to the default gradient for a hue interpolation method on a non-hue color space', () => {
			const { gradientAST, hasGradient } = getGradientAstWithDefault(
				'linear-gradient(in oklab longer hue 160deg, #009ED4 0%, #FFCE00 100%)'
			);

			expect( console ).toHaveWarned();
			expect( hasGradient ).toBe( false );
			expect( gradientAST.colorInterpolation ).toBeUndefined();
		} );
	} );
} );
