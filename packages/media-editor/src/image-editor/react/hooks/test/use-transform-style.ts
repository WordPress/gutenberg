/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useTransformStyle } from '../use-transform-style';
import type { CropperState, Size } from '../../../core/types';
import { DEFAULT_STATE } from '../../../core/constants';

/**
 * Create a mock state with optional overrides.
 * @param overrides
 */
function createState( overrides: Partial< CropperState > = {} ): CropperState {
	return { ...DEFAULT_STATE, ...overrides };
}

describe( 'useTransformStyle', () => {
	const imageSize: Size = { width: 400, height: 300 };

	it( 'should return identity-like matrix for default state', () => {
		const state = createState();
		const { result } = renderHook( () =>
			useTransformStyle( state, imageSize )
		);

		// Default: no rotation, no flip, zoom=1, crop=(0,0)
		// a=cos(0)*1*1=1, b=sin(0)*1*1=0, c=-sin(0)*1*1=0, d=cos(0)*1*1=1, tx=0, ty=0
		expect( result.current ).toBe( 'matrix(1, 0, 0, 1, 0, 0)' );
	} );

	it( 'should include translation from crop offset', () => {
		const state = createState( { pan: { x: 0.5, y: 0.25 } } );
		const { result } = renderHook( () =>
			useTransformStyle( state, imageSize )
		);

		// 0.5 * 400 = 200, 0.25 * 300 = 75
		// No rotation, no flip, zoom=1: matrix(1, 0, 0, 1, 200, 75)
		expect( result.current ).toBe( 'matrix(1, 0, 0, 1, 200, 75)' );
	} );

	it( 'should apply rotation=90 producing correct sin/cos values', () => {
		const state = createState( { rotation: 90 } );
		const { result } = renderHook( () =>
			useTransformStyle( state, imageSize )
		);

		// cos(90°)≈0, sin(90°)≈1, no flip, zoom=1
		// a=0*1*1≈0, b=1*1*1≈1, c=-1*1*1≈-1, d=0*1*1≈0
		const transform = result.current;
		// Parse matrix values
		const match = transform.match(
			/matrix\(([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^)]+)\)/
		);
		expect( match ).not.toBeNull();
		const [ , a, b, c, d ] = match!.map( Number );
		expect( a ).toBeCloseTo( 0 );
		expect( b ).toBeCloseTo( 1 );
		expect( c ).toBeCloseTo( -1 );
		expect( d ).toBeCloseTo( 0 );
	} );

	it( 'should apply zoom=2 producing scale factor 2 in matrix', () => {
		const state = createState( { zoom: 2 } );
		const { result } = renderHook( () =>
			useTransformStyle( state, imageSize )
		);

		// cos(0)=1, sin(0)=0, no flip, zoom=2
		// a=1*1*2=2, b=0, c=0, d=1*1*2=2
		expect( result.current ).toBe( 'matrix(2, 0, 0, 2, 0, 0)' );
	} );

	it( 'should apply horizontal flip producing negative a and b values', () => {
		const state = createState( {
			flip: { horizontal: true, vertical: false },
		} );
		const { result } = renderHook( () =>
			useTransformStyle( state, imageSize )
		);

		// cos(0)=1, sin(0)=0, sx=-1, sy=1, zoom=1
		// a=1*(-1)*1=-1, b=0*(-1)*1=0, c=-0*1*1=0, d=1*1*1=1
		expect( result.current ).toBe( 'matrix(-1, 0, 0, 1, 0, 0)' );
	} );

	it( 'should apply vertical flip producing negative c and d values', () => {
		const state = createState( {
			flip: { horizontal: false, vertical: true },
		} );
		const { result } = renderHook( () =>
			useTransformStyle( state, imageSize )
		);

		// cos(0)=1, sin(0)=0, sx=1, sy=-1, zoom=1
		// a=1*1*1=1, b=0, c=-0*(-1)*1=0, d=1*(-1)*1=-1
		expect( result.current ).toBe( 'matrix(1, 0, 0, -1, 0, 0)' );
	} );

	it( 'should apply both flips producing negative a and d values', () => {
		const state = createState( {
			flip: { horizontal: true, vertical: true },
		} );
		const { result } = renderHook( () =>
			useTransformStyle( state, imageSize )
		);

		// sx=-1, sy=-1, no rotation, zoom=1
		// a=1*(-1)*1=-1, b=0, c=0, d=1*(-1)*1=-1
		expect( result.current ).toBe( 'matrix(-1, 0, 0, -1, 0, 0)' );
	} );

	it( 'should combine all transforms correctly', () => {
		const state = createState( {
			pan: { x: 0.1, y: 0.2 },
			rotation: 90,
			flip: { horizontal: true, vertical: false },
			zoom: 3,
		} );
		const { result } = renderHook( () =>
			useTransformStyle( state, imageSize )
		);

		// tx = 0.1 * 400 = 40, ty = 0.2 * 300 = 60
		// Matrix order is flip * rotate * zoom (viewport-relative flip).
		// cos(90°)≈0, sin(90°)≈1, sx=-1, sy=1, z=3
		// a=sx*cos*z=(-1)*0*3≈0, b=sy*sin*z=1*1*3≈3
		// c=-sx*sin*z=-(-1)*1*3≈3, d=sy*cos*z=1*0*3≈0
		const transform = result.current;
		const match = transform.match(
			/matrix\(([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^)]+)\)/
		);
		expect( match ).not.toBeNull();
		const [ , a, b, c, d, tx, ty ] = match!.map( Number );
		expect( a ).toBeCloseTo( 0 );
		expect( b ).toBeCloseTo( 3 );
		expect( c ).toBeCloseTo( 3 );
		expect( d ).toBeCloseTo( 0 );
		expect( tx ).toBeCloseTo( 40 );
		expect( ty ).toBeCloseTo( 60 );
	} );
} );
