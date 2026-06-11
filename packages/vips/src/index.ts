/**
 * External dependencies
 */
import Vips from 'wasm-vips';

// @ts-expect-error - WASM files are inlined as base64 data URLs at build time
import VipsModule from 'wasm-vips/vips.wasm';

// @ts-expect-error - WASM files are inlined as base64 data URLs at build time
import VipsHeifModule from 'wasm-vips/vips-heif.wasm';

/**
 * Internal dependencies
 */
import type {
	ItemId,
	ImageSizeCrop,
	LoadOptions,
	SaveOptions,
	ThumbnailOptions,
} from './types';
import { supportsAnimation, supportsInterlace, supportsQuality } from './utils';

interface EmscriptenModule {
	setAutoDeleteLater: ( autoDelete: boolean ) => void;
	setDelayFunction: ( fn: ( fn: () => void ) => void ) => void;
}

let cleanup: () => void;

let vipsPromise: Promise< typeof Vips > | undefined;

/**
 * Instantiates and returns a new vips instance.
 *
 * Reuses any existing instance.
 */
async function getVips(): Promise< typeof Vips > {
	if ( vipsPromise ) {
		return await vipsPromise;
	}

	vipsPromise = Vips( {
		// Load HEIF dynamic module for HEIF/HEIC and AVIF format support.
		// JXL is omitted as WordPress Core does not currently support it.
		// It can be re-added when Core adds JXL support.
		dynamicLibraries: [ 'vips-heif.wasm' ],
		locateFile: ( fileName: string ) => {
			// WASM files are inlined as base64 data URLs at build time,
			// eliminating the need for separate file downloads and avoiding
			// issues with hosts not serving WASM files with correct MIME types.
			if ( fileName.endsWith( 'vips.wasm' ) ) {
				return VipsModule;
			} else if ( fileName.endsWith( 'vips-heif.wasm' ) ) {
				return VipsHeifModule;
			}
			return fileName;
		},
		preRun: ( module: EmscriptenModule ) => {
			// https://github.com/kleisauke/wasm-vips/issues/13#issuecomment-1073246828
			module.setAutoDeleteLater( true );
			module.setDelayFunction( ( fn: () => void ) => {
				cleanup = fn;
			} );
		},
		// Redirect wasm-vips internal stdout/stderr to prevent console errors
		// (e.g. AVIF codec warnings that are not actionable for users).
		// Set globalThis.__vipsDebug to a function to capture this output during development.
		print: ( text: string ) => {
			( globalThis as any ).__vipsDebug?.( text );
		},
		printErr: ( text: string ) => {
			( globalThis as any ).__vipsDebug?.( text );
		},
	} );

	const vipsInstance = await vipsPromise;

	// Disable the operation cache to prevent out-of-memory crashes
	// during repeated image processing. libvips caches results from
	// previous operations which accumulates WASM memory over time.
	// See https://github.com/WordPress/gutenberg/issues/76706
	vipsInstance.Cache.max( 0 );

	return vipsInstance;
}

/**
 * Holds a list of ongoing operations for a given ID.
 *
 * This way, operations can be cancelled mid-progress.
 */
const inProgressOperations = new Set< ItemId >();

/**
 * Cancels all ongoing image operations for a given item ID.
 *
 * The onProgress callbacks check for an IDs existence in this list,
 * killing the process if it's absent.
 *
 * @param id Item ID.
 * @return boolean Whether any operation was cancelled.
 */
export async function cancelOperations( id: ItemId ) {
	return inProgressOperations.delete( id );
}

/**
 * Converts an image to a different format using vips.
 *
 * @param id         Item ID.
 * @param buffer     Original file buffer.
 * @param inputType  Input mime type.
 * @param outputType Output mime type.
 * @param quality    Desired quality.
 * @param interlaced Whether to use interlaced/progressive mode.
 *                   Only used if the outputType supports it.
 */
export async function convertImageFormat(
	id: ItemId,
	buffer: ArrayBuffer,
	inputType: string,
	outputType: string,
	quality = 0.82,
	interlaced = false
): Promise< ArrayBuffer | ArrayBufferLike > {
	const ext = outputType.split( '/' )[ 1 ];

	inProgressOperations.add( id );

	try {
		let strOptions = '';
		const loadOptions: LoadOptions< typeof inputType > = {};

		// To ensure all frames are loaded in case the image is animated.
		if ( supportsAnimation( inputType ) ) {
			strOptions = '[n=-1]';
			( loadOptions as LoadOptions< typeof inputType > ).n = -1;
		}

		const vips = await getVips();
		const image = vips.Image.newFromBuffer(
			buffer,
			strOptions,
			loadOptions
		);

		// TODO: Report progress, see https://github.com/swissspidy/media-experiments/issues/327.
		image.onProgress = () => {
			if ( ! inProgressOperations.has( id ) ) {
				image.kill = true;
			}
		};

		const saveOptions: SaveOptions< typeof outputType > = {
			// Strip metadata except ICC color profiles,
			// matching WordPress core's behavior.
			keep: 'icc',
		};

		if ( supportsQuality( outputType ) ) {
			saveOptions.Q = quality * 100;
		}

		if ( interlaced && supportsInterlace( outputType ) ) {
			saveOptions.interlace = interlaced;
		}

		// See https://github.com/swissspidy/media-experiments/issues/324.
		if ( 'image/avif' === outputType ) {
			saveOptions.effort = 2;
		}

		const outBuffer = image.writeToBuffer( `.${ ext }`, saveOptions );
		const result = outBuffer.buffer;

		cleanup?.();

		return result;
	} finally {
		inProgressOperations.delete( id );
	}
}

/**
 * Compresses an existing image using vips.
 *
 * @param id         Item ID.
 * @param buffer     Original file buffer.
 * @param type       Mime type.
 * @param quality    Desired quality.
 * @param interlaced Whether to use interlaced/progressive mode.
 *                   Only used if the outputType supports it.
 * @return Compressed file data.
 */
export async function compressImage(
	id: ItemId,
	buffer: ArrayBuffer,
	type: string,
	quality = 0.82,
	interlaced = false
): Promise< ArrayBuffer | ArrayBufferLike > {
	return convertImageFormat( id, buffer, type, type, quality, interlaced );
}

/**
 * Applies resize and optional crop logic to produce a thumbnail.
 *
 * Handles three crop modes: no crop (simple downscale), boolean `true`
 * (center/attention crop), and positional crop (e.g. ['center', 'top']).
 *
 * @param resize          Resize options including target dimensions and crop mode.
 * @param originalWidth   Width of the source image.
 * @param originalHeight  Height (pageHeight) of the source image.
 * @param smartCrop       Whether to use saliency-aware cropping.
 * @param createThumbnail Callback that creates a thumbnail at the given width/options.
 * @return The resized (and optionally cropped) image.
 */
function applyResizeAndCrop<
	T extends {
		width: number;
		height: number;
		crop: ( ...args: number[] ) => T;
		// Optional UltraHDR support: present on Vips.Image instances when the
		// source has an embedded gain map.
		gainmap?: T;
		copy?: () => T;
		setImage?: ( name: string, value: T ) => void;
	},
>(
	resize: ImageSizeCrop,
	originalWidth: number,
	originalHeight: number,
	smartCrop: boolean,
	createThumbnail: ( width: number, options: ThumbnailOptions ) => T
): T {
	// Clone so we don't mutate the caller's config.
	// If resize.height is zero, calculate from aspect ratio.
	const target: ImageSizeCrop = {
		...resize,
		height:
			resize.height || ( originalHeight / originalWidth ) * resize.width,
	};

	const thumbnailOptions: ThumbnailOptions = {
		size: 'down',
		height: target.height,
	};

	let resizeWidth = target.width;

	if ( ! target.crop ) {
		return createThumbnail( resizeWidth, thumbnailOptions );
	}

	if ( true === target.crop ) {
		thumbnailOptions.crop = smartCrop ? 'attention' : 'centre';
		return createThumbnail( resizeWidth, thumbnailOptions );
	}

	// Positional crop: first resize, then crop to exact dimensions.
	if ( originalWidth < originalHeight ) {
		resizeWidth =
			target.width >= target.height
				? target.width
				: ( originalWidth / originalHeight ) * target.height;
		thumbnailOptions.height =
			target.width >= target.height
				? ( originalHeight / originalWidth ) * resizeWidth
				: target.height;
	} else {
		resizeWidth =
			target.width >= target.height
				? ( originalWidth / originalHeight ) * target.height
				: target.width;
		thumbnailOptions.height =
			target.width >= target.height
				? target.height
				: ( originalHeight / originalWidth ) * resizeWidth;
	}

	const image = createThumbnail( resizeWidth, thumbnailOptions );

	let left = 0;
	if ( 'center' === target.crop[ 0 ] ) {
		left = ( image.width - target.width ) / 2;
	} else if ( 'right' === target.crop[ 0 ] ) {
		left = image.width - target.width;
	}

	let top = 0;
	if ( 'center' === target.crop[ 1 ] ) {
		top = ( image.height - target.height ) / 2;
	} else if ( 'bottom' === target.crop[ 1 ] ) {
		top = image.height - target.height;
	}

	// Address rounding errors where `left` or `top` become negative integers
	// and `target.width` / `target.height` are bigger than the actual dimensions.
	// Downside: one side could be 1px smaller than the requested size.
	left = Math.max( 0, left );
	top = Math.max( 0, top );
	const cropWidth = Math.min( image.width, target.width );
	const cropHeight = Math.min( image.height, target.height );

	const cropped = image.crop( left, top, cropWidth, cropHeight );

	// For UltraHDR sources, also crop the attached gain map. The gain map
	// can be smaller than the main image, so we scale the crop coordinates
	// to its resolution. See:
	// https://www.libvips.org/API/current/uhdr.html#a-la-carte-processing
	const gainmap = image.gainmap;
	const copy = cropped.copy;
	const setImage = cropped.setImage;
	if ( ! gainmap || ! copy || ! setImage ) {
		return cropped;
	}

	// Scale the crop rect to the gain map's resolution. `crop` expects integer
	// pixel coordinates, so round here rather than relying on an implicit
	// float-to-int conversion, and clamp to the gain map bounds so the rect
	// never extends past its edges.
	const hscale = gainmap.width / image.width;
	const vscale = gainmap.height / image.height;
	const gainmapLeft = Math.round( left * hscale );
	const gainmapTop = Math.round( top * vscale );
	const gainmapWidth = Math.min(
		Math.round( cropWidth * hscale ),
		gainmap.width - gainmapLeft
	);
	const gainmapHeight = Math.min(
		Math.round( cropHeight * vscale ),
		gainmap.height - gainmapTop
	);
	const newGainmap = gainmap.crop(
		gainmapLeft,
		gainmapTop,
		gainmapWidth,
		gainmapHeight
	);

	// setImage mutates, so produce a unique copy first.
	const result = copy.call( cropped );
	setImage.call( result, 'gainmap', newGainmap );
	return result;
}

/**
 * Builds save options for writing an image to a buffer.
 *
 * @param type    Output mime type.
 * @param quality Desired quality (0-1).
 * @return Save options object.
 */
function buildSaveOptions(
	type: string,
	quality: number
): SaveOptions< typeof type > {
	const saveOptions: SaveOptions< typeof type > = {
		// Strip metadata except ICC color profiles or gainmaps,
		// matching WordPress core's behavior.
		keep: 'icc|gainmap',
	};

	if ( supportsQuality( type ) ) {
		saveOptions.Q = quality * 100;
	}

	// See https://github.com/swissspidy/media-experiments/issues/324.
	if ( 'image/avif' === type ) {
		saveOptions.effort = 2;
	}

	return saveOptions;
}

/**
 * Resizes an image using vips.
 *
 * UltraHDR JPEGs are auto-detected and preserved: libvips's `uhdrload*`
 * has higher priority than `jpegload*`, so `newFromBuffer`/`thumbnailBuffer`
 * decode the gain map alongside the base image, and `jpegsave*` delegates
 * to `uhdrsave*` on output when a gain map is attached.
 *
 * @param id        Item ID.
 * @param buffer    Original file buffer.
 * @param type      Mime type.
 * @param resize    Resize options.
 * @param smartCrop Whether to use smart cropping (i.e. saliency-aware).
 * @param quality   Desired quality (0-1).
 * @return Processed file data plus the old and new dimensions.
 */
export async function resizeImage(
	id: ItemId,
	buffer: ArrayBuffer,
	type: string,
	resize: ImageSizeCrop,
	smartCrop = false,
	quality = 0.82
): Promise< {
	buffer: ArrayBuffer | ArrayBufferLike;
	width: number;
	height: number;
	originalWidth: number;
	originalHeight: number;
} > {
	const ext = type.split( '/' )[ 1 ];

	inProgressOperations.add( id );

	try {
		const vips = await getVips();

		let strOptions = '';
		const loadOptions: LoadOptions< typeof type > = {};

		// To ensure all frames are loaded in case the image is animated.
		// But only if we're not cropping.
		if ( supportsAnimation( type ) && ! resize.crop ) {
			strOptions = '[n=-1]';
			( loadOptions as LoadOptions< typeof type > ).n = -1;
		}

		// TODO: Report progress, see https://github.com/swissspidy/media-experiments/issues/327.
		const onProgress = () => {
			if ( ! inProgressOperations.has( id ) ) {
				image.kill = true;
			}
		};

		let image = vips.Image.newFromBuffer( buffer, strOptions, loadOptions );

		image.onProgress = onProgress;

		const { width, pageHeight } = image;

		image = applyResizeAndCrop(
			resize,
			width,
			pageHeight,
			smartCrop,
			( resizeWidth, thumbnailOptions ) => {
				if ( strOptions ) {
					thumbnailOptions.option_string = strOptions;
				}
				const thumb = vips.Image.thumbnailBuffer(
					buffer,
					resizeWidth,
					thumbnailOptions
				);
				thumb.onProgress = onProgress;
				return thumb;
			}
		);

		const saveOptions = buildSaveOptions( type, quality );
		const outBuffer = image.writeToBuffer( `.${ ext }`, saveOptions );

		const result = {
			buffer: outBuffer.buffer,
			width: image.width,
			height: image.pageHeight,
			originalWidth: width,
			originalHeight: pageHeight,
		};

		// Only call after `image` is no longer being used.
		cleanup?.();

		return result;
	} finally {
		inProgressOperations.delete( id );
	}
}

/**
 * Information returned by getUltraHdrInfo() for a successfully probed
 * UltraHDR JPEG.
 */
interface UltraHdrInfo {
	width: number;
	height: number;
	/** HDR headroom in stops (log2 of the linear capacity). */
	hdrCapacity: number;
}

/**
 * Probes a JPEG to determine whether it is an UltraHDR image with an embedded
 * gain map.
 *
 * Returns dimensions and HDR headroom on success, or `null` if the buffer is
 * not a valid UltraHDR JPEG (no gain map, decode failure, or unsupported
 * format).
 *
 * @param buffer Image buffer.
 * @return UltraHDR info, or null when the buffer is not UltraHDR.
 */
export async function getUltraHdrInfo(
	buffer: ArrayBuffer
): Promise< UltraHdrInfo | null > {
	try {
		const vips = await getVips();
		const image = vips.Image.uhdrloadBuffer( buffer );
		if ( ! image.gainmap ) {
			cleanup?.();
			return null;
		}

		// `gainmap-hdr-capacity-max` is libultrahdr's linear-scale max capacity.
		// Convert to log2 stops so the value stored in attachment metadata
		// represents HDR headroom in stops.
		let hdrCapacityLinear = 1;
		try {
			hdrCapacityLinear = image.getDouble( 'gainmap-hdr-capacity-max' );
		} catch {
			// Field may be missing; fall back to no headroom.
		}
		const hdrCapacity =
			hdrCapacityLinear > 0 ? Math.log2( hdrCapacityLinear ) : 0;

		const info: UltraHdrInfo = {
			width: image.width,
			height: image.pageHeight,
			hdrCapacity,
		};

		cleanup?.();
		return info;
	} catch {
		// Not an UltraHDR image (or libultrahdr decoder unavailable).
		cleanup?.();
		return null;
	}
}

/**
 * Rotates an image based on EXIF orientation value.
 *
 * EXIF orientation values:
 * 1 = Normal (no rotation needed)
 * 2 = Flipped horizontally
 * 3 = Rotated 180°
 * 4 = Flipped vertically
 * 5 = Rotated 90° CCW and flipped horizontally
 * 6 = Rotated 90° CW
 * 7 = Rotated 90° CW and flipped horizontally
 * 8 = Rotated 90° CCW
 *
 * @param id          Item ID.
 * @param buffer      Original file buffer.
 * @param type        Mime type.
 * @param orientation EXIF orientation value (1-8).
 * @return Rotated file data plus the new dimensions.
 */
export async function rotateImage(
	id: ItemId,
	buffer: ArrayBuffer,
	type: string,
	orientation: number
): Promise< {
	buffer: ArrayBuffer | ArrayBufferLike;
	width: number;
	height: number;
} > {
	const ext = type.split( '/' )[ 1 ];

	inProgressOperations.add( id );

	try {
		const vips = await getVips();

		let strOptions = '';
		const loadOptions: LoadOptions< typeof type > = {};

		// To ensure all frames are loaded in case the image is animated.
		if ( supportsAnimation( type ) ) {
			strOptions = '[n=-1]';
			( loadOptions as LoadOptions< typeof type > ).n = -1;
		}

		let image = vips.Image.newFromBuffer( buffer, strOptions, loadOptions );

		image.onProgress = () => {
			if ( ! inProgressOperations.has( id ) ) {
				image.kill = true;
			}
		};

		// Apply transformation based on EXIF orientation.
		// See: https://exiftool.org/TagNames/EXIF.html#:~:text=0x0112,Orientation
		switch ( orientation ) {
			case 2:
				// Flipped horizontally
				image = image.flipHor();
				break;
			case 3:
				// Rotated 180°
				image = image.rot180();
				break;
			case 4:
				// Flipped vertically
				image = image.flipVer();
				break;
			case 5:
				// Rotated 90° CCW and flipped horizontally
				image = image.rot270().flipHor();
				break;
			case 6:
				// Rotated 90° CW
				image = image.rot90();
				break;
			case 7:
				// Rotated 90° CW and flipped horizontally
				image = image.rot90().flipHor();
				break;
			case 8:
				// Rotated 90° CCW
				image = image.rot270();
				break;
			// case 1 and default: no transformation needed
		}

		const saveOptions: SaveOptions< typeof type > = {};
		const outBuffer = image.writeToBuffer( `.${ ext }`, saveOptions );

		const result = {
			buffer: outBuffer.buffer,
			width: image.width,
			height: image.pageHeight,
		};

		// Only call after `image` is no longer being used.
		cleanup?.();

		return result;
	} finally {
		inProgressOperations.delete( id );
	}
}

/**
 * Determines whether an image has an alpha channel.
 *
 * @param buffer Original file object.
 * @return Whether the image has an alpha channel.
 */
export async function hasTransparency(
	buffer: ArrayBuffer
): Promise< boolean > {
	const vips = await getVips();
	const image = vips.Image.newFromBuffer( buffer );
	const hasAlpha = image.hasAlpha();

	cleanup?.();

	return hasAlpha;
}

// Re-export with vips prefix for worker module compatibility.
// The worker loader expects these prefixed names.
export {
	convertImageFormat as vipsConvertImageFormat,
	compressImage as vipsCompressImage,
	resizeImage as vipsResizeImage,
	rotateImage as vipsRotateImage,
	hasTransparency as vipsHasTransparency,
	getUltraHdrInfo as vipsGetUltraHdrInfo,
	cancelOperations as vipsCancelOperations,
};
