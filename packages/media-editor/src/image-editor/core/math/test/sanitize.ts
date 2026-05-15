/**
 * Internal dependencies
 */
import { safeBoundedNumber, sanitizeCropperState } from '../sanitize';
import { DEFAULT_STATE } from '../../constants';
import type { CropperState } from '../../types';

describe( 'safeBoundedNumber', () => {
	it( 'returns the value when it is finite and in range', () => {
		expect( safeBoundedNumber( 42, 0 ) ).toBe( 42 );
		expect( safeBoundedNumber( -3.14, 0 ) ).toBe( -3.14 );
		expect( safeBoundedNumber( 0, 1 ) ).toBe( 0 );
	} );

	it( 'returns the fallback for NaN', () => {
		expect( safeBoundedNumber( Number.NaN, 7 ) ).toBe( 7 );
	} );

	it( 'returns the fallback for ±Infinity', () => {
		expect( safeBoundedNumber( Number.POSITIVE_INFINITY, 7 ) ).toBe( 7 );
		expect( safeBoundedNumber( Number.NEGATIVE_INFINITY, 7 ) ).toBe( 7 );
	} );

	it( 'returns the fallback for finite values beyond the safe magnitude', () => {
		// MAX_VALUE / MIN_VALUE are technically finite but cause overflow
		// when multiplied through trig and matrix code.
		expect( safeBoundedNumber( Number.MAX_VALUE, 1 ) ).toBe( 1 );
		expect( safeBoundedNumber( -Number.MAX_VALUE, 1 ) ).toBe( 1 );
		expect( safeBoundedNumber( 1e10, 1 ) ).toBe( 1 );
	} );

	it( 'accepts values right at the safe magnitude boundary', () => {
		expect( safeBoundedNumber( 1e6, 0 ) ).toBe( 1e6 );
		expect( safeBoundedNumber( -1e6, 0 ) ).toBe( -1e6 );
	} );
} );

describe( 'sanitizeCropperState', () => {
	function makeBaseState(
		overrides: Partial< CropperState > = {}
	): CropperState {
		return {
			...DEFAULT_STATE,
			...overrides,
		};
	}

	it( 'leaves a clean state unchanged', () => {
		const state = makeBaseState( {
			pan: { x: 0.1, y: -0.05 },
			zoom: 1.5,
			rotation: 30,
		} );
		const out = sanitizeCropperState( state );
		expect( out.pan ).toEqual( { x: 0.1, y: -0.05 } );
		expect( out.zoom ).toBe( 1.5 );
		expect( out.rotation ).toBe( 30 );
	} );

	it( 'replaces NaN pan with zero', () => {
		const state = makeBaseState( {
			pan: { x: Number.NaN, y: Number.NaN },
		} );
		const out = sanitizeCropperState( state );
		expect( out.pan ).toEqual( { x: 0, y: 0 } );
	} );

	it( 'replaces non-finite zoom with 1 (identity)', () => {
		expect(
			sanitizeCropperState( makeBaseState( { zoom: Number.NaN } ) ).zoom
		).toBe( 1 );
		expect(
			sanitizeCropperState(
				makeBaseState( { zoom: Number.POSITIVE_INFINITY } )
			).zoom
		).toBe( 1 );
		expect(
			sanitizeCropperState( makeBaseState( { zoom: -2 } ) ).zoom
		).toBe( 1 );
	} );

	it( 'replaces sub-normal zoom with 1 (prevents division explosion)', () => {
		expect(
			sanitizeCropperState( makeBaseState( { zoom: Number.MIN_VALUE } ) )
				.zoom
		).toBe( 1 );
	} );

	it( 'replaces extreme rotation magnitudes with 0', () => {
		expect(
			sanitizeCropperState(
				makeBaseState( { rotation: Number.MAX_VALUE } )
			).rotation
		).toBe( 0 );
		expect(
			sanitizeCropperState( makeBaseState( { rotation: Number.NaN } ) )
				.rotation
		).toBe( 0 );
	} );

	it( 'sanitizes cropRect fields independently', () => {
		const state = makeBaseState( {
			cropRect: {
				x: Number.NaN,
				y: 0.1,
				width: Number.POSITIVE_INFINITY,
				height: 0.5,
			},
		} );
		const out = sanitizeCropperState( state );
		expect( out.cropRect ).toEqual( {
			x: 0,
			y: 0.1,
			width: 0,
			height: 0.5,
		} );
	} );

	it( 'sanitizes base pose fields (basePan, baseZoom, baseRotation)', () => {
		const state = makeBaseState( {
			basePan: { x: Number.NaN, y: 0 },
			baseZoom: Number.NEGATIVE_INFINITY,
			baseRotation: Number.MAX_VALUE,
		} );
		const out = sanitizeCropperState( state );
		expect( out.basePan ).toEqual( { x: 0, y: 0 } );
		expect( out.baseZoom ).toBe( 1 );
		expect( out.baseRotation ).toBe( 0 );
	} );
} );
