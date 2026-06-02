/**
 * Internal dependencies
 */
import { getFileBasename } from './utils';
import { parseHeic } from './heic-parser';
import { ImageFile } from './image-file';
import type { ImageSizeCrop } from './store/types';

/**
 * Converts an image file to JPEG using the browser's native decoder and canvas.
 *
 * Tries three decoding strategies:
 * 1. createImageBitmap() + OffscreenCanvas (works in Safari, future Chrome).
 * 2. WebCodecs ImageDecoder API (uses platform codecs; may work in future
 *    Chrome if HEIC is added to its image decoder pipeline).
 * 3. HEIC container parsing + WebCodecs VideoDecoder (Chrome 107+ on macOS).
 *    Parses the HEIC/ISOBMFF container to extract the HEVC bitstream, then
 *    decodes it using Chrome's platform HEVC video decoder (hardware-
 *    accelerated via macOS VideoToolbox).
 *
 * This avoids shipping our own HEVC decoder, sidestepping patent/licensing concerns.
 *
 * @param file    Source image file (e.g., HEIC/HEIF).
 * @param quality JPEG quality (0-1). Default 0.82.
 * @return JPEG File object.
 */
export async function canvasConvertToJpeg(
	file: File,
	quality = 0.82
): Promise< File > {
	const baseName = getFileBasename( file.name );

	// Strategy 1: createImageBitmap + OffscreenCanvas.
	try {
		const bitmap = await createImageBitmap( file );
		try {
			const canvas = new OffscreenCanvas( bitmap.width, bitmap.height );
			const ctx = canvas.getContext( '2d' );

			if ( ! ctx ) {
				throw new Error( 'Could not get canvas 2d context' );
			}

			ctx.drawImage( bitmap, 0, 0 );

			const jpegBlob = await canvas.convertToBlob( {
				type: 'image/jpeg',
				quality,
			} );

			return new File( [ jpegBlob ], `${ baseName }.jpg`, {
				type: 'image/jpeg',
			} );
		} finally {
			bitmap.close();
		}
	} catch {
		// createImageBitmap doesn't support HEIC in this browser.
		// Fall through to strategy 2.
	}

	// Strategy 2: WebCodecs ImageDecoder API.
	// Uses platform codecs (e.g., macOS HEIC support) that may not be
	// exposed through createImageBitmap or <img> elements.
	if ( typeof ImageDecoder !== 'undefined' ) {
		const supported = await ImageDecoder.isTypeSupported( file.type );
		if ( supported ) {
			const decoder = new ImageDecoder( {
				type: file.type,
				data: file.stream(),
			} );
			try {
				const { image: videoFrame } = await decoder.decode();
				try {
					const canvas = new OffscreenCanvas(
						videoFrame.displayWidth,
						videoFrame.displayHeight
					);
					const ctx = canvas.getContext( '2d' );

					if ( ! ctx ) {
						throw new Error( 'Could not get canvas 2d context' );
					}

					ctx.drawImage( videoFrame, 0, 0 );

					const jpegBlob = await canvas.convertToBlob( {
						type: 'image/jpeg',
						quality,
					} );

					return new File( [ jpegBlob ], `${ baseName }.jpg`, {
						type: 'image/jpeg',
					} );
				} finally {
					videoFrame.close();
				}
			} finally {
				decoder.close();
			}
		}
	}

	// Strategy 3: HEIC container parsing + WebCodecs VideoDecoder.
	// Chrome 107+ on macOS supports HEVC *video* decoding via platform codecs
	// (macOS VideoToolbox), even though it doesn't support HEIC through image
	// APIs.  A HEIC file is an ISOBMFF container with HEVC-encoded tiles —
	// we parse the container and decode each tile via VideoDecoder.
	if ( typeof VideoDecoder !== 'undefined' ) {
		try {
			const heicData = parseHeic( await file.arrayBuffer() );

			const support = await VideoDecoder.isConfigSupported( {
				codec: heicData.codecString,
			} );

			if ( support.supported ) {
				const canvas = new OffscreenCanvas(
					heicData.outputWidth,
					heicData.outputHeight
				);
				const ctx = canvas.getContext( '2d' );

				if ( ! ctx ) {
					throw new Error( 'Could not get canvas 2d context' );
				}

				// Decode each tile and draw it at its grid position.
				for ( const tile of heicData.tiles ) {
					const frame = await decodeHevcFrame(
						heicData.codecString,
						heicData.description,
						heicData.tileWidth,
						heicData.tileHeight,
						tile.data
					);
					try {
						ctx.drawImage( frame, tile.x, tile.y );
					} finally {
						frame.close();
					}
				}

				// Apply ISOBMFF irot rotation if present.
				const outputCanvas = applyRotation( canvas, heicData.rotation );

				const jpegBlob = await outputCanvas.convertToBlob( {
					type: 'image/jpeg',
					quality,
				} );

				return new File( [ jpegBlob ], `${ baseName }.jpg`, {
					type: 'image/jpeg',
				} );
			}
		} catch {
			// VideoDecoder HEVC not available or HEIC parsing failed.
			// Fall through to error.
		}
	}

	throw new Error(
		'This browser cannot decode HEIC images. Please use Safari or convert to JPEG before uploading.'
	);
}

/**
 * Apply ISOBMFF irot rotation to a canvas.
 *
 * Returns the original canvas if no rotation is needed, or a new
 * OffscreenCanvas with the rotation applied.
 *
 * @param source   Source canvas with the decoded image.
 * @param rotation Rotation angle in degrees counter-clockwise (0, 90, 180, 270).
 * @return Canvas with rotation applied.
 */
function applyRotation(
	source: OffscreenCanvas,
	rotation: number
): OffscreenCanvas {
	if ( rotation === 0 ) {
		return source;
	}

	const swap = rotation === 90 || rotation === 270;
	const w = swap ? source.height : source.width;
	const h = swap ? source.width : source.height;

	const rotated = new OffscreenCanvas( w, h );
	const ctx = rotated.getContext( '2d' );

	if ( ! ctx ) {
		return source;
	}

	ctx.translate( w / 2, h / 2 );
	// irot angle is CCW; canvas rotate() is CW, so negate.
	ctx.rotate( ( -rotation * Math.PI ) / 180 );
	ctx.drawImage( source, -source.width / 2, -source.height / 2 );

	return rotated;
}

/**
 * Decode a single HEVC key frame using the WebCodecs VideoDecoder API.
 *
 * @param codec       HEVC codec string (e.g. 'hvc1.1.6.L93.B0').
 * @param description HEVCDecoderConfigurationRecord bytes.
 * @param width       Coded width of the frame.
 * @param height      Coded height of the frame.
 * @param data        Raw HEVC bitstream (IDR frame).
 * @return Decoded VideoFrame. Caller must call frame.close().
 */
function decodeHevcFrame(
	codec: string,
	description: Uint8Array,
	width: number,
	height: number,
	data: Uint8Array
): Promise< VideoFrame > {
	return new Promise< VideoFrame >( ( resolve, reject ) => {
		const decoder = new VideoDecoder( {
			output: ( frame ) => {
				decoder.close();
				resolve( frame );
			},
			error: ( e ) => {
				if ( decoder.state !== 'closed' ) {
					decoder.close();
				}
				reject( e );
			},
		} );

		decoder.configure( {
			codec,
			codedWidth: width,
			codedHeight: height,
			description,
		} );

		decoder.decode(
			new EncodedVideoChunk( {
				type: 'key',
				timestamp: 0,
				data,
			} )
		);

		decoder.flush().catch( ( e ) => {
			if ( decoder.state !== 'closed' ) {
				decoder.close();
			}
			reject( e );
		} );
	} );
}

/**
 * Resizes an image to a sub-size using the browser's native decoder and canvas.
 *
 * This is a fallback for images that the bundled `wasm-vips` cannot process —
 * notably high-bit-depth (10/12-bit) AVIF. The browser decodes these natively,
 * so we draw the decoded bitmap onto an `OffscreenCanvas` at the target size and
 * re-encode it.
 *
 * Because `OffscreenCanvas.convertToBlob()` cannot emit AVIF, the sub-size is
 * written as JPEG, and because the canvas is 8-bit sRGB, high-bit-depth/HDR
 * source images are flattened to 8-bit SDR. The original upload is unaffected;
 * only the generated sub-size is converted.
 *
 * The returned filename mirrors `vipsResizeImage()`'s conventions so the
 * sideload flow and the server register the sub-size under the right name.
 *
 * @param file         Source image file.
 * @param resize       Resize options (width, height, crop).
 * @param quality      JPEG quality (0-1). Default 0.82.
 * @param addSuffix    Whether to add a `-WIDTHxHEIGHT` suffix (for thumbnails).
 * @param scaledSuffix Whether to add a `-scaled` suffix (for threshold resizing).
 * @return Resized ImageFile (JPEG) with dimension metadata.
 */
export async function canvasResizeImage(
	file: File,
	resize: ImageSizeCrop,
	quality = 0.82,
	addSuffix = false,
	scaledSuffix = false
): Promise< ImageFile > {
	const bitmap = await createImageBitmap( file );

	const originalWidth = bitmap.width;
	const originalHeight = bitmap.height;

	// Derive the target height from the aspect ratio when only a width is given.
	const targetWidth = resize.width;
	const targetHeight =
		resize.height || ( originalHeight / originalWidth ) * resize.width;

	let canvasWidth: number;
	let canvasHeight: number;
	// Source rectangle (defaults to the whole image for a soft resize).
	let sx = 0;
	let sy = 0;
	let sWidth = originalWidth;
	let sHeight = originalHeight;

	if ( resize.crop ) {
		// Hard crop: scale to cover the target box, then crop the overflow.
		// Positional crop anchors are approximated as a centered crop.
		canvasWidth = Math.round( targetWidth );
		canvasHeight = Math.round( targetHeight );
		const scale = Math.max(
			canvasWidth / originalWidth,
			canvasHeight / originalHeight
		);
		sWidth = Math.min( originalWidth, Math.round( canvasWidth / scale ) );
		sHeight = Math.min(
			originalHeight,
			Math.round( canvasHeight / scale )
		);
		sx = Math.round( ( originalWidth - sWidth ) / 2 );
		sy = Math.round( ( originalHeight - sHeight ) / 2 );
	} else {
		// Soft resize: fit within the box preserving aspect, never upscaling.
		const scale = Math.min(
			targetWidth / originalWidth,
			targetHeight / originalHeight,
			1
		);
		canvasWidth = Math.max( 1, Math.round( originalWidth * scale ) );
		canvasHeight = Math.max( 1, Math.round( originalHeight * scale ) );
	}

	try {
		const canvas = new OffscreenCanvas( canvasWidth, canvasHeight );
		const ctx = canvas.getContext( '2d' );
		if ( ! ctx ) {
			throw new Error( 'Could not get canvas 2d context' );
		}

		ctx.drawImage(
			bitmap,
			sx,
			sy,
			sWidth,
			sHeight,
			0,
			0,
			canvasWidth,
			canvasHeight
		);

		const blob = await canvas.convertToBlob( {
			type: 'image/jpeg',
			quality,
		} );

		const basename = getFileBasename( file.name );
		const wasResized =
			originalWidth > canvasWidth || originalHeight > canvasHeight;
		let outName = `${ basename }.jpg`;
		if ( wasResized && scaledSuffix ) {
			outName = `${ basename }-scaled.jpg`;
		} else if ( wasResized && addSuffix ) {
			outName = `${ basename }-${ canvasWidth }x${ canvasHeight }.jpg`;
		}

		return new ImageFile(
			new File( [ blob ], outName, { type: 'image/jpeg' } ),
			canvasWidth,
			canvasHeight,
			originalWidth,
			originalHeight
		);
	} finally {
		bitmap.close();
	}
}
