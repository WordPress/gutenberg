/**
 * Internal dependencies
 */
import {
	isValidSize,
	safeBoundedNumber,
	sanitizeCropperState,
	sanitizeRect,
} from '../sanitize';
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
		// MAX_VALUE is technically finite but multiplying it through trig
		// and matrix code overflows to Infinity.
		expect( safeBoundedNumber( Number.MAX_VALUE, 1 ) ).toBe( 1 );
		expect( safeBoundedNumber( -Number.MAX_VALUE, 1 ) ).toBe( 1 );
		expect( safeBoundedNumber( 1e10, 1 ) ).toBe( 1 );
	} );

	it( 'accepts values right at the safe magnitude boundary', () => {
		expect( safeBoundedNumber( 1e6, 0 ) ).toBe( 1e6 );
		expect( safeBoundedNumber( -1e6, 0 ) ).toBe( -1e6 );
	} );

	it( 'accepts sub-normal values (sub-normal protection lives elsewhere)', () => {
		// Sub-normals don't overflow on their own; they only cause trouble
		// when used as divisors. That guard lives in sanitizeCropperState's
		// zoom check, not here.
		expect( safeBoundedNumber( Number.MIN_VALUE, 0 ) ).toBe(
			Number.MIN_VALUE
		);
	} );
} );

describe( 'isValidSize', () => {
	it( 'returns true for finite, positive, in-range sizes', () => {
		expect( isValidSize( { width: 100, height: 100 } ) ).toBe( true );
		expect( isValidSize( { width: 1, height: 1 } ) ).toBe( true );
		expect( isValidSize( { width: 1e6, height: 1e6 } ) ).toBe( true );
	} );

	it( 'returns false for zero or negative dimensions', () => {
		expect( isValidSize( { width: 0, height: 100 } ) ).toBe( false );
		expect( isValidSize( { width: 100, height: 0 } ) ).toBe( false );
		expect( isValidSize( { width: -1, height: 100 } ) ).toBe( false );
	} );

	it( 'returns false for non-finite dimensions', () => {
		expect( isValidSize( { width: Number.NaN, height: 100 } ) ).toBe(
			false
		);
		expect(
			isValidSize( {
				width: Number.POSITIVE_INFINITY,
				height: 100,
			} )
		).toBe( false );
	} );

	it( 'returns false for dimensions beyond the safe magnitude', () => {
		expect( isValidSize( { width: Number.MAX_VALUE, height: 100 } ) ).toBe(
			false
		);
		expect( isValidSize( { width: 1e10, height: 100 } ) ).toBe( false );
	} );

	it( 'returns false for sub-normal dimensions (overflow when divided into)', () => {
		// Number.MIN_VALUE passes `> 0` but `container / MIN_VALUE`
		// overflows to Infinity downstream in getImageFit / createCamera.
		expect( isValidSize( { width: Number.MIN_VALUE, height: 100 } ) ).toBe(
			false
		);
		expect( isValidSize( { width: 100, height: Number.MIN_VALUE } ) ).toBe(
			false
		);
	} );
} );

describe( 'sanitizeRect', () => {
	it( 'replaces non-finite fields with 0', () => {
		expect(
			sanitizeRect( {
				x: Number.NaN,
				y: 0.1,
				width: Number.POSITIVE_INFINITY,
				height: 0.5,
			} )
		).toEqual( { x: 0, y: 0.1, width: 0, height: 0.5 } );
	} );

	it( 'leaves a clean rect unchanged', () => {
		expect(
			sanitizeRect( { x: 0.1, y: 0.2, width: 0.5, height: 0.3 } )
		).toEqual( { x: 0.1, y: 0.2, width: 0.5, height: 0.3 } );
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

	it( 'returns the same reference when no field needs substitution', () => {
		// Called once per pointermove (via restrictPanZoom + createCamera),
		// so the no-change fast path matters. Clean state → same reference,
		// no per-frame GC churn.
		const state = makeBaseState( {
			pan: { x: 0.1, y: -0.05 },
			zoom: 1.5,
			rotation: 30,
		} );
		expect( sanitizeCropperState( state ) ).toBe( state );
	} );

	it( 'preserves sub-object references when only some fields change', () => {
		// If pan is clean but zoom is corrupted, pan should keep its
		// reference even though the parent state must be a new object.
		const pan = { x: 0.1, y: -0.05 };
		const state = makeBaseState( { pan, zoom: Number.NaN } );
		const out = sanitizeCropperState( state );
		expect( out ).not.toBe( state );
		expect( out.pan ).toBe( pan );
		expect( out.zoom ).toBe( 1 );
	} );

	it( 'leaves state.image untouched (caller passes imageSize separately)', () => {
		// The math layer never reads state.image — image dimensions arrive as
		// a separate `imageSize` argument. Cloning state.image on every call
		// would break the reducer's reference-equality short-circuit.
		const image = {
			src: 'test.jpg',
			naturalWidth: 1600,
			naturalHeight: 900,
		};
		const state = makeBaseState( { image } );
		const out = sanitizeCropperState( state );
		expect( out.image ).toBe( image );
	} );
} );
