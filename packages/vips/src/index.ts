/**
 * External dependencies
 */
import Vips from 'wasm-vips';

// @ts-expect-error
// eslint-disable-next-line import/no-unresolved
import VipsModule from 'wasm-vips/vips.wasm';

// @ts-expect-error
// eslint-disable-next-line import/no-unresolved
import VipsHeifModule from 'wasm-vips/vips-heif.wasm';

// @ts-expect-error
// eslint-disable-next-line import/no-unresolved
import VipsJxlModule from 'wasm-vips/vips-jxl.wasm';

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

let location = '';

/**
 * Dynamically sets the location / public path to use for loading the WASM files.
 *
 * This is required when loading this module in an inline worker,
 * where globals such as __webpack_public_path__ are not available.
 *
 * @param newLocation Location, typically a base URL such as "https://example.com/path/to/js/...".
 */
export function setLocation( newLocation: string ) {
	location = newLocation;
}

let cleanup: () => void;

let vipsInstance: typeof Vips;

/**
 * Instantiates and returns a new vips instance.
 *
 * Reuses any existing instance.
 */
async function getVips(): Promise< typeof Vips > {
	if ( vipsInstance ) {
		return vipsInstance;
	}

	vipsInstance = await Vips( {
		locateFile: ( fileName: string ) => {
			if ( fileName.endsWith( 'vips.wasm' ) ) {
				fileName = VipsModule;
			} else if ( fileName.endsWith( 'vips-heif.wasm' ) ) {
				fileName = VipsHeifModule;
			} else if ( fileName.endsWith( 'vips-jxl.wasm' ) ) {
				fileName = VipsJxlModule;
			}

			return location + fileName;
		},
		preRun: ( module: EmscriptenModule ) => {
			// https://github.com/kleisauke/wasm-vips/issues/13#issuecomment-1073246828
			module.setAutoDeleteLater( true );
			module.setDelayFunction( ( fn: () => void ) => {
				cleanup = fn;
			} );
		},
	} );

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

	let strOptions = '';
	const loadOptions: LoadOptions< typeof inputType > = {};

	// To ensure all frames are loaded in case the image is animated.
	if ( supportsAnimation( inputType ) ) {
		strOptions = '[n=-1]';
		( loadOptions as LoadOptions< typeof inputType > ).n = -1;
	}

	const vips = await getVips();
	const image = vips.Image.newFromBuffer( buffer, strOptions, loadOptions );

	// TODO: Report progress, see https://github.com/swissspidy/media-experiments/issues/327.
	image.onProgress = () => {
		if ( ! inProgressOperations.has( id ) ) {
			image.kill = true;
		}
	};

	const saveOptions: SaveOptions< typeof outputType > = {};

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
 * Resizes an image using vips.
 *
 * @param id        Item ID.
 * @param buffer    Original file buffer.
 * @param type      Mime type.
 * @param resize    Resize options.
 * @param smartCrop Whether to use smart cropping (i.e. saliency-aware).
 * @return Processed file data plus the old and new dimensions.
 */
export async function resizeImage(
	id: ItemId,
	buffer: ArrayBuffer,
	type: string,
	resize: ImageSizeCrop,
	smartCrop = false
): Promise< {
	buffer: ArrayBuffer | ArrayBufferLike;
	width: number;
	height: number;
	originalWidth: number;
	originalHeight: number;
} > {
	const ext = type.split( '/' )[ 1 ];

	inProgressOperations.add( id );

	const vips = await getVips();
	const thumbnailOptions: ThumbnailOptions = {
		size: 'down',
	};

	let strOptions = '';
	const loadOptions: LoadOptions< typeof type > = {};

	// To ensure all frames are loaded in case the image is animated.
	// But only if we're not cropping.
	if ( supportsAnimation( type ) && ! resize.crop ) {
		strOptions = '[n=-1]';
		thumbnailOptions.option_string = strOptions;
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

	// If resize.height is zero.
	resize.height = resize.height || ( pageHeight / width ) * resize.width;

	let resizeWidth = resize.width;
	thumbnailOptions.height = resize.height;

	if ( ! resize.crop ) {
		image = vips.Image.thumbnailBuffer(
			buffer,
			resizeWidth,
			thumbnailOptions
		);

		image.onProgress = onProgress;
	} else if ( true === resize.crop ) {
		thumbnailOptions.crop = smartCrop ? 'attention' : 'centre';

		image = vips.Image.thumbnailBuffer(
			buffer,
			resizeWidth,
			thumbnailOptions
		);

		image.onProgress = onProgress;
	} else {
		// First resize, then do the cropping.
		// This allows operating on the second bitmap with the correct dimensions.

		if ( width < pageHeight ) {
			resizeWidth =
				resize.width >= resize.height
					? resize.width
					: ( width / pageHeight ) * resize.height;
			thumbnailOptions.height =
				resize.width >= resize.height
					? ( pageHeight / width ) * resizeWidth
					: resize.height;
		} else {
			resizeWidth =
				resize.width >= resize.height
					? ( width / pageHeight ) * resize.height
					: resize.width;
			thumbnailOptions.height =
				resize.width >= resize.height
					? resize.height
					: ( pageHeight / width ) * resizeWidth;
		}

		image = vips.Image.thumbnailBuffer(
			buffer,
			resizeWidth,
			thumbnailOptions
		);

		image.onProgress = onProgress;

		let left = 0;
		if ( 'center' === resize.crop[ 0 ] ) {
			left = ( image.width - resize.width ) / 2;
		} else if ( 'right' === resize.crop[ 0 ] ) {
			left = image.width - resize.width;
		}

		let top = 0;
		if ( 'center' === resize.crop[ 1 ] ) {
			top = ( image.height - resize.height ) / 2;
		} else if ( 'bottom' === resize.crop[ 1 ] ) {
			top = image.height - resize.height;
		}

		// Address rounding errors where `left` or `top` become negative integers
		// and `resize.width` / `resize.height` are bigger than the actual dimensions.
		// Downside: one side could be 1px smaller than the requested size.
		left = Math.max( 0, left );
		top = Math.max( 0, top );
		resize.width = Math.min( image.width, resize.width );
		resize.height = Math.min( image.height, resize.height );

		image = image.crop( left, top, resize.width, resize.height );

		image.onProgress = onProgress;
	}

	// TODO: Allow passing quality?
	const saveOptions: SaveOptions< typeof type > = {};
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
