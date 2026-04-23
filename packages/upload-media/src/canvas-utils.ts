/**
 * Internal dependencies
 */
import { getFileBasename } from './utils';
import { parseHeic } from './heic-parser';

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
