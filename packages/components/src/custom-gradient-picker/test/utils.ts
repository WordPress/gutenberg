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
