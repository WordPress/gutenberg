type PosterImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * Loads a video's metadata (dimensions, duration) without downloading the
 * full file.
 *
 * @param src Video URL (typically a blob URL).
 * @return Video element once its metadata has loaded.
 */
function preloadVideoMetadata( src: string ): Promise< HTMLVideoElement > {
	const video = document.createElement( 'video' );
	video.muted = true;
	video.crossOrigin = 'anonymous';
	video.preload = 'metadata';

	return new Promise( ( resolve, reject ) => {
		video.addEventListener( 'loadedmetadata', () => resolve( video ) );
		video.addEventListener( 'error', reject );
		video.src = src;
	} );
}

/**
 * Loads enough of a video that a frame can be drawn to a canvas.
 *
 * @param src Video URL (typically a blob URL).
 * @return Video element once it can be played.
 */
async function preloadVideo( src: string ): Promise< HTMLVideoElement > {
	const video = await preloadVideoMetadata( src );

	return new Promise( ( resolve, reject ) => {
		video.addEventListener( 'canplay', () => resolve( video ), {
			once: true,
		} );
		video.addEventListener( 'error', reject );
		video.preload = 'auto';
	} );
}

/**
 * Seeks a video to the earliest usable still frame.
 *
 * Defaults to a small offset rather than `0` because browsers seek
 * imprecisely and the very first frame is often blank/black.
 *
 * @param video  Video element.
 * @param offset Seek offset in seconds. Default 0.99.
 * @return Resolves once the seek has completed.
 */
function seekVideo( video: HTMLVideoElement, offset = 0.99 ): Promise< void > {
	if ( video.currentTime === offset ) {
		return Promise.resolve();
	}

	return new Promise( ( resolve, reject ) => {
		// If the seek takes longer than 3 seconds, assume it timed out.
		video.addEventListener( 'seeking', ( evt ) => {
			const wait = setTimeout( () => {
				clearTimeout( wait );
				reject( evt );
			}, 3000 /* 3 seconds */ );
		} );
		video.addEventListener( 'error', reject );
		video.addEventListener( 'seeked', () => resolve(), { once: true } );

		video.currentTime = offset;
	} );
}

/**
 * Draws the current video frame to a canvas and returns it as an image blob.
 *
 * @param video   Video element to capture.
 * @param type    Output image MIME type. Default 'image/jpeg'.
 * @param quality Image quality (0-1). Default 0.82.
 * @return Image blob of the current video frame.
 */
function getImageFromVideo(
	video: HTMLVideoElement,
	type: PosterImageFormat = 'image/jpeg',
	quality = 0.82
): Promise< Blob > {
	const canvas = new OffscreenCanvas( video.videoWidth, video.videoHeight );
	const ctx = canvas.getContext( '2d' );

	// If the contextType doesn't match a possible drawing context, or differs
	// from the first contextType requested, null is returned.
	if ( ! ctx ) {
		throw new Error( 'Could not get canvas 2d context' );
	}

	ctx.drawImage( video, 0, 0, canvas.width, canvas.height );
	return canvas.convertToBlob( { type, quality } );
}

/**
 * Extracts the first usable still frame of a video as an image blob.
 *
 * @param src     Video URL (typically a blob URL).
 * @param type    Output image MIME type. Default 'image/jpeg'.
 * @param quality Image quality (0-1). Default 0.82.
 * @return Image blob of the first frame.
 */
async function getFirstFrameOfVideo(
	src: string,
	type: PosterImageFormat = 'image/jpeg',
	quality = 0.82
): Promise< Blob > {
	const video = await preloadVideo( src );
	await seekVideo( video );
	return getImageFromVideo( video, type, quality );
}

/**
 * Generates a poster image File from a video's first frame, client-side.
 *
 * Uses the browser's native video decoder plus a canvas; no external
 * dependencies. Callers should treat failures (unplayable codec, seek
 * timeout, missing canvas context) as "no poster" and continue.
 *
 * @param src      Video URL (typically a blob URL).
 * @param basename Base filename (without extension) for the poster.
 * @param type     Output image MIME type. Default 'image/jpeg'.
 * @param quality  Image quality (0-1). Default 0.82.
 * @return Poster image File.
 */
export async function getPosterFromVideo(
	src: string,
	basename: string,
	type: PosterImageFormat = 'image/jpeg',
	quality = 0.82
): Promise< File > {
	let blob = await getFirstFrameOfVideo( src, type, quality );

	// Safari does not support WebP and falls back to PNG.
	// Use JPEG instead of PNG in that case.
	if ( type === 'image/webp' && blob.type !== 'image/webp' ) {
		blob = await getFirstFrameOfVideo( src, 'image/jpeg', quality );
	}

	const ext = blob.type.split( '/' )[ 1 ];

	return new File( [ blob ], `${ basename }.${ ext }`, {
		type: blob.type,
	} );
}
