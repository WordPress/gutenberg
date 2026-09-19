/**
 * Waveform peak extraction, quantisation and encoding.
 *
 * Peaks are computed once — while the audio bytes are still readable — and
 * stored on the track block, so the front end never has to analyse the file.
 * This matters for media served from another origin: peak analysis has to read
 * the raw bytes, and a cross-origin response without `Access-Control-Allow-
 * Origin` cannot be read, no matter which API is used to reach it. Playback is
 * unaffected, so such a track plays normally but has no waveform to draw.
 */

/**
 * Number of peaks stored per track.
 *
 * The player resamples peaks to the number of bars it can fit, and resampling
 * takes two different paths: it keeps the loudest value per bucket when
 * reducing, and interpolates between neighbours when enlarging. Interpolation
 * visibly smooths a waveform, so storing fewer peaks than the bars on screen
 * would render a softer shape than analysing the file directly. 512 stays on
 * the reducing path for any realistic player width.
 *
 * @type {number}
 */
export const STORED_PEAK_SAMPLES = 512;

/**
 * Smallest peak count accepted when decoding.
 *
 * @type {number}
 */
export const MIN_PEAK_SAMPLES = 32;

/**
 * Largest peak count accepted when decoding.
 *
 * @type {number}
 */
export const MAX_PEAK_SAMPLES = 4096;

/**
 * Reduce a decoded audio buffer to a fixed number of normalised peaks.
 *
 * Each output value is the loudest absolute amplitude in its window, taking the
 * loudest channel where there are several, and the result is scaled so the
 * loudest peak becomes 1.
 *
 * Ported from `extractPeaks` in @arraypress/waveform-player (MIT), which is not
 * exported from the package. Keeping the algorithm identical matters: stored
 * and freshly analysed peaks are drawn side by side in the same playlist, so a
 * different rounding or window boundary would show up as a visible difference
 * between tracks.
 *
 * @param {AudioBuffer} buffer    - Decoded audio.
 * @param {number}      [samples] - Number of peaks to produce.
 * @return {number[]} Normalised peaks in the 0-1 range.
 */
export function extractPeaks( buffer, samples = STORED_PEAK_SAMPLES ) {
	// Deliberately not rounded. Truncating the window size instead of the
	// window boundaries accumulates drift and leaves the tail of the track
	// unscanned.
	const sampleSize = buffer.length / samples;
	const channels = buffer.numberOfChannels;
	const peaks = [];

	for ( let channel = 0; channel < channels; channel++ ) {
		const data = buffer.getChannelData( channel );

		for ( let index = 0; index < samples; index++ ) {
			// Truncated, not rounded, and the end is measured from the
			// truncated start so the windows tile the buffer exactly.
			const start = Math.trunc( index * sampleSize );
			const end = Math.trunc( start + sampleSize );

			// Zero-initialised so that a window containing no frames yields a
			// silent peak. Seeding these with ±Infinity would instead produce
			// Infinity, and normalising that gives NaN for the whole track.
			let min = 0;
			let max = 0;

			for ( let cursor = start; cursor < end; cursor++ ) {
				const value = data[ cursor ];

				if ( value > max ) {
					max = value;
				}

				if ( value < min ) {
					min = value;
				}
			}

			const peak = Math.max( Math.abs( max ), Math.abs( min ) );

			if ( channel === 0 || peak > peaks[ index ] ) {
				peaks[ index ] = peak;
			}
		}
	}

	let loudest = 0;

	for ( const peak of peaks ) {
		if ( peak > loudest ) {
			loudest = peak;
		}
	}

	// A silent track is returned unscaled rather than divided by zero.
	return loudest > 0 ? peaks.map( ( peak ) => peak / loudest ) : peaks;
}

/**
 * Encode peaks as base64 for storage in a block attribute.
 *
 * Each peak is quantised to one byte. At a typical waveform height that is
 * finer than a single device pixel, and it keeps a track's peaks well under a
 * kilobyte of post content.
 *
 * @param {number[]} peaks - Peaks in the 0-1 range.
 * @return {string} Base64-encoded peaks.
 */
export function encodePeaks( peaks ) {
	const bytes = new Uint8Array( peaks.length );

	for ( let index = 0; index < peaks.length; index++ ) {
		const value = peaks[ index ];
		// Clamped rather than trusted: a value outside 0-1 would wrap around
		// the byte and draw a bar at the wrong height.
		const clamped = Number.isFinite( value )
			? Math.min( 1, Math.max( 0, value ) )
			: 0;

		bytes[ index ] = Math.round( clamped * 255 );
	}

	let binary = '';

	for ( let index = 0; index < bytes.length; index++ ) {
		binary += String.fromCharCode( bytes[ index ] );
	}

	return btoa( binary );
}

/**
 * Decode peaks previously stored by {@link encodePeaks}.
 *
 * The value arrives from a block attribute, so it may have been hand-edited,
 * truncated or replaced with something of another type entirely. Anything that
 * does not decode to a plausible peak array returns `null`, which callers treat
 * as "no stored peaks" and fall back to analysing the audio.
 *
 * @param {unknown} encoded - Base64-encoded peaks.
 * @return {number[]|null} Peaks in the 0-1 range, or `null` when unusable.
 */
export function decodePeaks( encoded ) {
	if ( typeof encoded !== 'string' || ! encoded ) {
		return null;
	}

	let binary;

	try {
		binary = atob( encoded );
	} catch {
		// Expected for a malformed or truncated attribute. Analysing the audio
		// is the correct fallback, so there is nothing to report here.
		return null;
	}

	if (
		binary.length < MIN_PEAK_SAMPLES ||
		binary.length > MAX_PEAK_SAMPLES
	) {
		return null;
	}

	const peaks = new Array( binary.length );

	for ( let index = 0; index < binary.length; index++ ) {
		peaks[ index ] = binary.charCodeAt( index ) / 255;
	}

	return peaks;
}

/**
 * Analyse an audio file and return its peaks ready for storage.
 *
 * Reading the bytes is the step that can fail. Media on another origin served
 * without `Access-Control-Allow-Origin` cannot be read from script — the
 * response arrives but its body is withheld — and there is no alternative route
 * to the samples: tapping playback through the Web Audio graph yields silence
 * for the same reason, and `captureStream()` refuses outright. Such a track
 * simply has no peaks to store, plays normally, and the player falls back to a
 * seekbar when it draws.
 *
 * @param {string} url       - Audio URL. A `blob:` URL from a pending upload
 *                           works and is never subject to CORS.
 * @param {number} [samples] - Number of peaks to produce.
 * @return {Promise<string|null>} Base64-encoded peaks, or `null` when the audio
 *                                could not be read or decoded.
 */
export async function generateTrackPeaks( url, samples = STORED_PEAK_SAMPLES ) {
	if ( typeof url !== 'string' || ! url ) {
		return null;
	}

	const AudioContextClass = window.AudioContext || window.webkitAudioContext;

	if ( ! AudioContextClass ) {
		return null;
	}

	let audioContext;

	try {
		const response = await fetch( url );

		// Checked explicitly: the body of an error page would otherwise reach
		// decodeAudioData and surface as a decode failure rather than a 404.
		if ( ! response.ok ) {
			return null;
		}

		const bytes = await response.arrayBuffer();

		audioContext = new AudioContextClass();

		const decoded = await audioContext.decodeAudioData( bytes );

		return encodePeaks( extractPeaks( decoded, samples ) );
	} catch {
		// Expected whenever the bytes cannot be read or decoded: a cross-origin
		// file without CORS headers, a network failure, or a codec this browser
		// does not support. Returning null leaves the track without stored
		// peaks, which is the correct fallback, and the player already warns
		// when it draws a placeholder.
		return null;
	} finally {
		// Closed even on failure: browsers cap the number of live audio
		// contexts, so leaking one per unreadable track would break the
		// players that come after it on the page.
		audioContext?.close().catch( () => {
			// Already closed, or closing raced a teardown. Nothing to recover.
		} );
	}
}

/**
 * Tail of the analysis queue.
 *
 * @type {Promise<unknown>}
 */
let analysisQueue = Promise.resolve();

/**
 * Analyse a track, one file at a time.
 *
 * Every analysis opens an audio context, and browsers cap how many can be live
 * at once — Chrome allows about six. A playlist adds a block per track, so
 * dropping a folder of audio in would otherwise start every analysis together
 * and exhaust that budget, breaking the players that come after. Analysis is
 * background work, so serialising costs nothing the user waits on.
 *
 * @param {string} url - Audio URL.
 * @return {Promise<string|null>} Base64-encoded peaks, or `null`.
 */
export function queueTrackPeaks( url ) {
	const result = analysisQueue.then( () => generateTrackPeaks( url ) );

	// The queue must survive a failed track, so it follows the settled result
	// rather than the value.
	analysisQueue = result.catch( () => {} );

	return result;
}
