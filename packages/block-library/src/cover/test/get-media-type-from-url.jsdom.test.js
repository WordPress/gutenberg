import { describe, expect, test, vi } from 'vitest';
import getMediaTypeFromUrl from '../edit/get-media-type-from-url';

/**
 * Replaces the global `Image` constructor with a stub that resolves the load of
 * any `src` in the way the test requires. JSDOM never fetches image sources, so
 * the probe has to be simulated.
 *
 * @param {Object}   options            Options.
 * @param {boolean}  options.loads      Whether the stub fires `onload` (as
 *                                      opposed to `onerror`).
 * @param {Function} [options.onCreate] Called whenever a stub is constructed.
 */
function stubImage( { loads, onCreate } = { loads: true } ) {
	vi.stubGlobal(
		'Image',
		class StubImage {
			constructor() {
				onCreate?.();
			}

			set src( value ) {
				this._src = value;
				// Resolve on a microtask so the assignment stays synchronous.
				Promise.resolve().then( () => {
					if ( loads ) {
						this.onload?.();
					} else {
						this.onerror?.();
					}
				} );
			}

			get src() {
				return this._src;
			}
		}
	);
}

describe( 'getMediaTypeFromUrl', () => {
	test.each( [
		'https://example.com/photo.jpg',
		'https://example.com/photo.jpeg',
		'https://example.com/photo.png',
		'https://example.com/photo.gif',
		'https://example.com/photo.webp',
		'https://example.com/photo.avif',
		'https://example.com/photo.svg',
		'/relative/photo.png',
	] )( 'detects %s as an image from its extension', async ( url ) => {
		await expect( getMediaTypeFromUrl( url ) ).resolves.toBe( 'image' );
	} );

	test.each( [
		'https://example.com/clip.mp4',
		'https://example.com/clip.webm',
		'https://example.com/clip.ogv',
		'https://example.com/clip.mov',
		'https://example.com/clip.m4v',
		'/relative/clip.mp4',
	] )( 'detects %s as a video from its extension', async ( url ) => {
		await expect( getMediaTypeFromUrl( url ) ).resolves.toBe( 'video' );
	} );

	test( 'ignores the query string and fragment when reading the extension', async () => {
		await expect(
			getMediaTypeFromUrl( 'https://example.com/photo.jpg?w=800&h=600' )
		).resolves.toBe( 'image' );
		await expect(
			getMediaTypeFromUrl( 'https://example.com/clip.mp4#t=10' )
		).resolves.toBe( 'video' );
	} );

	test( 'matches extensions case-insensitively', async () => {
		await expect(
			getMediaTypeFromUrl( 'https://example.com/PHOTO.JPG' )
		).resolves.toBe( 'image' );
		await expect(
			getMediaTypeFromUrl( 'https://example.com/CLIP.MP4' )
		).resolves.toBe( 'video' );
	} );

	test( 'does not probe the URL when the extension is recognized', async () => {
		const onCreate = vi.fn();
		stubImage( { loads: true, onCreate } );

		await getMediaTypeFromUrl( 'https://example.com/clip.mp4' );

		expect( onCreate ).not.toHaveBeenCalled();
	} );

	test( 'probes an extensionless URL and detects an image that loads', async () => {
		stubImage( { loads: true } );

		await expect(
			getMediaTypeFromUrl( 'https://example.com/media/12345' )
		).resolves.toBe( 'image' );
	} );

	test( 'treats an extensionless URL that fails to load as a video', async () => {
		stubImage( { loads: false } );

		await expect(
			getMediaTypeFromUrl( 'https://example.com/media/12345' )
		).resolves.toBe( 'video' );
	} );

	test( 'probes a URL whose extension is neither an image nor a video', async () => {
		stubImage( { loads: false } );

		await expect(
			getMediaTypeFromUrl( 'https://example.com/stream.m3u8' )
		).resolves.toBe( 'video' );
	} );
} );
