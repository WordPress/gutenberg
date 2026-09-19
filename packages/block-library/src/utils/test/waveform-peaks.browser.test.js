import { afterEach, describe, expect, it } from 'vitest';
import {
	STORED_PEAK_SAMPLES,
	decodePeaks,
	generateTrackPeaks,
	queueTrackPeaks,
} from '../waveform-peaks';

const objectURLs = [];

/**
 * Build a mono 16-bit PCM WAV and return an object URL for it.
 *
 * Decoding happens in a real AudioContext here, so the bytes have to be a
 * format the browser actually supports.
 *
 * @param {Object}   [options]
 * @param {number}   [options.seconds]    - Duration.
 * @param {Function} [options.amplitude]  - `( progress ) => 0-1` envelope.
 * @param {number}   [options.sampleRate] - Sample rate.
 * @return {string} Object URL for the WAV.
 */
function createAudioURL( {
	seconds = 1,
	amplitude = () => 1,
	sampleRate = 8000,
} = {} ) {
	const frames = sampleRate * seconds;
	const data = new DataView( new ArrayBuffer( frames * 2 ) );

	for ( let index = 0; index < frames; index++ ) {
		const progress = index / frames;
		const value =
			Math.sin( ( 2 * Math.PI * 440 * index ) / sampleRate ) *
			amplitude( progress );

		data.setInt16( index * 2, Math.round( value * 32000 ), true );
	}

	const header = new DataView( new ArrayBuffer( 44 ) );
	const ascii = ( offset, text ) => {
		for ( let index = 0; index < text.length; index++ ) {
			header.setUint8( offset + index, text.charCodeAt( index ) );
		}
	};

	ascii( 0, 'RIFF' );
	header.setUint32( 4, 36 + data.byteLength, true );
	ascii( 8, 'WAVE' );
	ascii( 12, 'fmt ' );
	header.setUint32( 16, 16, true );
	header.setUint16( 20, 1, true );
	header.setUint16( 22, 1, true );
	header.setUint32( 24, sampleRate, true );
	header.setUint32( 28, sampleRate * 2, true );
	header.setUint16( 32, 2, true );
	header.setUint16( 34, 16, true );
	ascii( 36, 'data' );
	header.setUint32( 40, data.byteLength, true );

	const url = URL.createObjectURL(
		new Blob( [ header.buffer, data.buffer ], { type: 'audio/wav' } )
	);

	objectURLs.push( url );

	return url;
}

afterEach( () => {
	while ( objectURLs.length ) {
		URL.revokeObjectURL( objectURLs.pop() );
	}
} );

describe( 'generateTrackPeaks', () => {
	it( 'analyses audio the browser can read', async () => {
		const encoded = await generateTrackPeaks( createAudioURL() );

		expect( typeof encoded ).toBe( 'string' );
		expect( decodePeaks( encoded ) ).toHaveLength( STORED_PEAK_SAMPLES );
	} );

	it( 'follows the shape of the audio', async () => {
		// Silent first half, loud second half. The stored peaks should show
		// that split rather than a flat or synthetic shape.
		const url = createAudioURL( {
			seconds: 2,
			amplitude: ( progress ) => ( progress < 0.5 ? 0 : 1 ),
		} );

		const peaks = decodePeaks( await generateTrackPeaks( url ) );
		const middle = Math.floor( peaks.length / 2 );
		const quietest = peaks.slice( 0, middle - 2 );
		const loudest = peaks.slice( middle + 2 );

		expect( Math.max( ...quietest ) ).toBeLessThan( 0.05 );
		expect( Math.min( ...loudest ) ).toBeGreaterThan( 0.5 );
	} );

	it( 'normalises the loudest peak to the top of the range', async () => {
		const peaks = decodePeaks(
			await generateTrackPeaks( createAudioURL() )
		);

		expect( Math.max( ...peaks ) ).toBe( 1 );
	} );

	it( 'returns null when the response is not ok', async () => {
		// A 404 body would otherwise reach decodeAudioData and surface as a
		// misleading decode error.
		expect(
			await generateTrackPeaks( '/this-path-does-not-exist.mp3' )
		).toBeNull();
	} );

	it( 'returns null when the bytes are not decodable audio', async () => {
		const url = URL.createObjectURL(
			new Blob( [ 'this is not audio' ], { type: 'audio/wav' } )
		);
		objectURLs.push( url );

		expect( await generateTrackPeaks( url ) ).toBeNull();
	} );

	it( 'returns null rather than throwing when the URL cannot be fetched', async () => {
		await expect(
			generateTrackPeaks( 'https://127.0.0.1:1/nope.mp3' )
		).resolves.toBeNull();
	} );

	it( 'returns null for a missing URL', async () => {
		expect( await generateTrackPeaks( '' ) ).toBeNull();
		expect( await generateTrackPeaks( undefined ) ).toBeNull();
	} );
} );

describe( 'queueTrackPeaks', () => {
	it( 'analyses concurrent requests without exhausting audio contexts', async () => {
		// Chrome caps live audio contexts at around six, so this would fail if
		// the requests all opened one at the same time.
		const urls = Array.from( { length: 12 }, () => createAudioURL() );

		const results = await Promise.all( urls.map( queueTrackPeaks ) );

		expect( results ).toHaveLength( 12 );
		results.forEach( ( encoded ) => {
			expect( decodePeaks( encoded ) ).toHaveLength(
				STORED_PEAK_SAMPLES
			);
		} );
	} );

	it( 'keeps running after a track fails', async () => {
		const results = await Promise.all( [
			queueTrackPeaks( 'https://127.0.0.1:1/nope.mp3' ),
			queueTrackPeaks( createAudioURL() ),
		] );

		expect( results[ 0 ] ).toBeNull();
		expect( decodePeaks( results[ 1 ] ) ).toHaveLength(
			STORED_PEAK_SAMPLES
		);
	} );
} );
