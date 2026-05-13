/**
 * Internal dependencies
 */
import {
	getInputBounds,
	getInputCommitValue,
	makeRange,
	snapInputValueToStep,
} from '../crop-input-utils';

describe( 'makeRange', () => {
	it( 'flags a single-point range as not editable', () => {
		const range = makeRange( 100, 100 );

		expect( range.minValue ).toBe( 100 );
		expect( range.maxValue ).toBe( 100 );
		expect( range.isEditable ).toBe( false );
	} );

	it( 'flags a real range as editable by default', () => {
		const range = makeRange( 0, 500 );

		expect( range.isEditable ).toBe( true );
	} );

	it( 'respects an explicit `isEditable=false`', () => {
		const range = makeRange( 0, 500, false );

		expect( range.isEditable ).toBe( false );
	} );

	it( 'guards against an inverted range', () => {
		const range = makeRange( 500, 100 );

		expect( range.minValue ).toBe( 500 );
		expect( range.maxValue ).toBe( 500 );
		expect( range.isEditable ).toBe( false );
	} );
} );

describe( 'snapInputValueToStep', () => {
	it( 'snaps to integer step', () => {
		expect( snapInputValueToStep( 12.3, 1 ) ).toBe( 12 );
		expect( snapInputValueToStep( 12.7, 1 ) ).toBe( 13 );
	} );

	it( 'snaps to half-degree step and preserves precision', () => {
		expect( snapInputValueToStep( 12.3, 0.5 ) ).toBe( 12.5 );
		expect( snapInputValueToStep( 12.74, 0.5 ) ).toBe( 12.5 );
		expect( snapInputValueToStep( 12.76, 0.5 ) ).toBe( 13 );
	} );
} );

describe( 'getInputBounds', () => {
	it( 'tolerates sub-precision drift in min bound', () => {
		const range = makeRange( 0.000000001, 500 );
		const bounds = getInputBounds( 100, range, 1 );

		expect( bounds.value ).toBe( 100 );
		expect( bounds.min ).toBe( 0 );
		expect( bounds.max ).toBe( 500 );
	} );

	it( 'tolerates sub-precision drift in max bound', () => {
		const range = makeRange( 0, 2559.999999999 );
		const bounds = getInputBounds( 400, range, 1 );

		// Drift below ~1e-6 rounds up to the nearest integer so users can
		// commit the expected integer pixel value.
		expect( bounds.max ).toBe( 2560 );
	} );

	it( 'keeps bounds strict when current value is outside the snapped min', () => {
		const range = makeRange( 5, 100 );
		const bounds = getInputBounds( 3, range, 1 );

		// The input may display an out-of-range state, but commits still use
		// the real range so arrow/wheel edits cannot keep pushing outward.
		expect( bounds.value ).toBe( 3 );
		expect( bounds.min ).toBe( 5 );
		expect( bounds.max ).toBe( 100 );
	} );
} );

describe( 'getInputCommitValue', () => {
	const bounds = { value: 100, min: 0, max: 500 };

	it( 'returns null for an empty draft', () => {
		expect( getInputCommitValue( '', bounds, 1 ) ).toBeNull();
		expect( getInputCommitValue( '   ', bounds, 1 ) ).toBeNull();
	} );

	it( 'returns null for non-finite drafts', () => {
		expect( getInputCommitValue( 'abc', bounds, 1 ) ).toBeNull();
	} );

	it( 'snaps in-range drafts to the commit step', () => {
		expect( getInputCommitValue( '12.4', bounds, 1 ) ).toBe( 12 );
		expect( getInputCommitValue( '12.6', bounds, 1 ) ).toBe( 13 );
	} );

	it( 'rejects out-of-range drafts when not clamping', () => {
		expect( getInputCommitValue( '9999', bounds, 1 ) ).toBeNull();
		expect( getInputCommitValue( '-10', bounds, 1 ) ).toBeNull();
	} );

	it( 'clamps out-of-range drafts when requested', () => {
		expect( getInputCommitValue( '9999', bounds, 1, true ) ).toBe( 500 );
		expect( getInputCommitValue( '-10', bounds, 1, true ) ).toBe( 0 );
	} );
} );
