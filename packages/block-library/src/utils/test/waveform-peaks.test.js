import { describe, expect, it } from 'vitest';
import {
	MAX_PEAK_SAMPLES,
	MIN_PEAK_SAMPLES,
	STORED_PEAK_SAMPLES,
	decodePeaks,
	encodePeaks,
	extractPeaks,
} from '../waveform-peaks';

/**
 * Build a minimal AudioBuffer-like object.
 *
 * `extractPeaks` only reads `length`, `numberOfChannels` and
 * `getChannelData()`, so a plain object is enough and keeps these tests in the
 * Node project (no Web Audio, no browser).
 *
 * @param {number}   length   - Frames per channel.
 * @param {number}   channels - Channel count.
 * @param {Function} fn       - `( frameIndex, channelIndex ) => amplitude`.
 * @return {Object} AudioBuffer-like object.
 */
function createBuffer( length, channels, fn ) {
	const data = [];

	for ( let channel = 0; channel < channels; channel++ ) {
		const samples = new Float32Array( length );
		for ( let index = 0; index < length; index++ ) {
			samples[ index ] = fn( index, channel );
		}
		data.push( samples );
	}

	return {
		length,
		numberOfChannels: channels,
		getChannelData: ( channel ) => data[ channel ],
	};
}

/**
 * Deterministic 0-1 ramp-and-fold sequence, used where a realistic-length
 * array is needed without pulling in randomness.
 *
 * @param {number} count - Number of values.
 * @return {number[]} Values in the 0-1 range.
 */
function sequence( count ) {
	return Array.from( { length: count }, ( _, index ) =>
		Math.abs( Math.sin( index / 7 ) )
	);
}

/**
 * Base64 payload of `count` zero bytes.
 *
 * @param {number} count - Byte count.
 * @return {string} Base64 string.
 */
function zeroPayload( count ) {
	return encodePeaks( new Array( count ).fill( 0 ) );
}

describe( 'extractPeaks', () => {
	// The expected arrays below were captured from the waveform-player
	// library's own extractPeaks, so any divergence in our port shows up here.
	it( 'matches the library output when the length divides evenly', () => {
		const buffer = createBuffer(
			1000,
			1,
			( i ) => Math.sin( i / 10 ) * 0.8
		);

		expect( extractPeaks( buffer, 8 ) ).toEqual(
			[
				0.999993667, 0.9997963749, 0.9999972433, 0.9999893456,
				0.9998140329, 1, 0.9999842792, 0.9998309457,
			].map( ( value ) => expect.closeTo( value, 9 ) )
		);
	} );

	// Guards the float `sampleSize`: flooring it drifts the windows and
	// under-covers the tail, which changes every value in this case.
	it( 'matches the library output when the length does not divide evenly', () => {
		const buffer = createBuffer(
			1000,
			1,
			( i ) => Math.sin( i / 10 ) * 0.8
		);

		expect( extractPeaks( buffer, 7 ) ).toEqual(
			[
				0.999993667, 0.9999972433, 0.9999373404, 0.9999893456, 1,
				0.9999471752, 0.9999842792,
			].map( ( value ) => expect.closeTo( value, 9 ) )
		);
	} );

	it( 'keeps the loudest channel for each window', () => {
		const buffer = createBuffer(
			600,
			2,
			( i, channel ) =>
				( channel === 1 && i > 300 ? 0.9 : 0.3 ) * Math.sin( i / 5 )
		);

		expect( extractPeaks( buffer, 6 ) ).toEqual(
			[
				0.3333312472, 0.3333051204, 0.3333124716, 1, 0.9999843041,
				0.9999562235,
			].map( ( value ) => expect.closeTo( value, 9 ) )
		);
	} );

	// Guards the zero-initialised min/max: starting them at ±Infinity makes an
	// empty window produce Infinity, which normalises to NaN and renders blank.
	it( 'returns zeroes rather than NaN when windows are empty', () => {
		const peaks = extractPeaks(
			createBuffer( 1, 1, () => 0.5 ),
			4
		);

		expect( peaks ).toEqual( [ 0, 0, 0, 0 ] );
		expect( peaks.some( Number.isNaN ) ).toBe( false );
	} );

	it( 'returns a silent buffer unscaled instead of dividing by zero', () => {
		expect(
			extractPeaks(
				createBuffer( 100, 1, () => 0 ),
				5
			)
		).toEqual( [ 0, 0, 0, 0, 0 ] );
	} );

	it( 'uses the absolute value of negative-only signals', () => {
		const buffer = createBuffer(
			400,
			1,
			( i ) => -0.25 - ( i / 400 ) * 0.5
		);

		expect( extractPeaks( buffer, 4 ) ).toEqual(
			[ 0.4991652961, 0.6661102107, 0.8330550854, 1 ].map( ( value ) =>
				expect.closeTo( value, 9 )
			)
		);
	} );

	it( 'normalises the loudest peak to 1', () => {
		const buffer = createBuffer( 512, 1, ( i ) => Math.sin( i / 3 ) * 0.1 );

		expect( Math.max( ...extractPeaks( buffer, 16 ) ) ).toBeCloseTo(
			1,
			10
		);
	} );

	it( 'returns the requested number of samples', () => {
		const buffer = createBuffer( 5000, 2, ( i ) => Math.sin( i / 9 ) );

		expect( extractPeaks( buffer, STORED_PEAK_SAMPLES ) ).toHaveLength(
			STORED_PEAK_SAMPLES
		);
	} );
} );

describe( 'encodePeaks / decodePeaks', () => {
	it( 'round-trips within the 1/255 quantisation step', () => {
		const peaks = sequence( STORED_PEAK_SAMPLES );
		const decoded = decodePeaks( encodePeaks( peaks ) );

		expect( decoded ).toHaveLength( STORED_PEAK_SAMPLES );
		decoded.forEach( ( value, index ) => {
			expect( Math.abs( value - peaks[ index ] ) ).toBeLessThanOrEqual(
				1 / 255
			);
		} );
	} );

	it( 'preserves the 0 and 1 endpoints exactly', () => {
		const peaks = sequence( STORED_PEAK_SAMPLES );
		peaks[ 0 ] = 0;
		peaks[ 1 ] = 1;

		const decoded = decodePeaks( encodePeaks( peaks ) );

		expect( decoded[ 0 ] ).toBe( 0 );
		expect( decoded[ 1 ] ).toBe( 1 );
	} );

	it( 'clamps out-of-range values instead of wrapping them', () => {
		const peaks = sequence( STORED_PEAK_SAMPLES );
		peaks[ 0 ] = -0.5;
		peaks[ 1 ] = 1.5;

		const decoded = decodePeaks( encodePeaks( peaks ) );

		expect( decoded[ 0 ] ).toBe( 0 );
		expect( decoded[ 1 ] ).toBe( 1 );
	} );

	it( 'produces a compact payload', () => {
		// 512 peaks should cost well under 1KB in post_content.
		expect(
			encodePeaks( sequence( STORED_PEAK_SAMPLES ) ).length
		).toBeLessThan( 1024 );
	} );

	it( 'decodes every value into the 0-1 range', () => {
		const decoded = decodePeaks(
			encodePeaks( sequence( STORED_PEAK_SAMPLES ) )
		);

		expect( decoded.every( ( value ) => value >= 0 && value <= 1 ) ).toBe(
			true
		);
	} );
} );

describe( 'decodePeaks rejects data it did not create', () => {
	it.each( [
		[ 'an empty string', '' ],
		[ 'whitespace', '   ' ],
		[ 'characters outside the base64 alphabet', 'not valid base64!!' ],
		[ 'a truncated payload', 'abc' ],
		[ 'null', null ],
		[ 'undefined', undefined ],
		[ 'a number', 12345 ],
		[ 'an array', [ 0.1, 0.2 ] ],
		[ 'an object', { peaks: [] } ],
	] )( 'returns null for %s', ( _label, input ) => {
		expect( decodePeaks( input ) ).toBeNull();
	} );

	it( 'returns null for a payload below the minimum length', () => {
		expect( decodePeaks( zeroPayload( MIN_PEAK_SAMPLES - 1 ) ) ).toBeNull();
	} );

	it( 'returns null for a payload above the maximum length', () => {
		expect( decodePeaks( zeroPayload( MAX_PEAK_SAMPLES + 1 ) ) ).toBeNull();
	} );

	it( 'accepts payloads at both ends of the allowed range', () => {
		expect( decodePeaks( zeroPayload( MIN_PEAK_SAMPLES ) ) ).toHaveLength(
			MIN_PEAK_SAMPLES
		);
		expect( decodePeaks( zeroPayload( MAX_PEAK_SAMPLES ) ) ).toHaveLength(
			MAX_PEAK_SAMPLES
		);
	} );

	it( 'never throws on malformed input', () => {
		expect( () => decodePeaks( '!!!!' ) ).not.toThrow();
	} );
} );
