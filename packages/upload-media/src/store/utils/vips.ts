/**
 * External dependencies
 */
import { createWorkerFactory, type WorkerCreator } from '@shopify/web-worker';

/**
 * Internal dependencies
 */
import { ImageFile } from '../../image-file';
import { getFileBasename } from '../../utils';
import type { ImageSizeCrop, QueueItemId } from '../types';
import { debug } from './debug';

let vipsWorker:
	| ReturnType< WorkerCreator< typeof import('@wordpress/vips') > >
	| undefined;

function getVipsWorker() {
	if ( vipsWorker !== undefined ) {
		return vipsWorker;
	}

	const createWorker = createWorkerFactory(
		() => import( /* webpackChunkName: 'vips' */ '@wordpress/vips' )
	);
	vipsWorker = createWorker();

	return vipsWorker;
}

/**
 * Converts an image to a different format using vips in a web worker.
 *
 * @param id         Queue item ID.
 * @param file       File object.
 * @param type       Output mime type.
 * @param quality    Desired quality (0-1).
 * @param interlaced Whether to use interlaced/progressive mode.
 * @return Converted file.
 */
export async function vipsConvertImageFormat(
	id: QueueItemId,
	file: File,
	type:
		| 'image/jpeg'
		| 'image/png'
		| 'image/webp'
		| 'image/avif'
		| 'image/gif',
	quality: number,
	interlaced?: boolean
) {
	const buffer = await getVipsWorker().convertImageFormat(
		id,
		await file.arrayBuffer(),
		file.type,
		type,
		quality,
		interlaced
	);
	const ext = type.split( '/' )[ 1 ];
	const fileName = `${ getFileBasename( file.name ) }.${ ext }`;
	return new File( [ new Blob( [ buffer as ArrayBuffer ] ) ], fileName, {
		type,
	} );
}

/**
 * Compresses an image using vips in a web worker.
 *
 * @param id         Queue item ID.
 * @param file       File object.
 * @param quality    Desired quality (0-1).
 * @param interlaced Whether to use interlaced/progressive mode.
 * @return Compressed file.
 */
export async function vipsCompressImage(
	id: QueueItemId,
	file: File,
	quality: number,
	interlaced?: boolean
) {
	const buffer = await getVipsWorker().compressImage(
		id,
		await file.arrayBuffer(),
		file.type,
		quality,
		interlaced
	);
	return new File(
		[ new Blob( [ buffer as ArrayBuffer ], { type: file.type } ) ],
		file.name,
		{ type: file.type }
	);
}

/**
 * Checks whether an image has transparency using vips in a web worker.
 *
 * @param url Image URL.
 * @return Whether the image has transparency.
 */
export async function vipsHasTransparency( url: string ) {
	return getVipsWorker().hasTransparency(
		await ( await fetch( url ) ).arrayBuffer()
	);
}

/**
 * Resizes an image using vips in a web worker.
 *
 * @param id        Queue item ID.
 * @param file      File object.
 * @param resize    Resize options (width, height, crop).
 * @param smartCrop Whether to use smart cropping (saliency-aware).
 * @param addSuffix Whether to add dimension suffix to filename.
 * @return Resized ImageFile with dimension metadata.
 */
export async function vipsResizeImage(
	id: QueueItemId,
	file: File,
	resize: ImageSizeCrop,
	smartCrop: boolean,
	addSuffix: boolean
) {
	debug.group( `vipsResizeImage: ${ id }` );
	debug.log( 'Starting VIPS resize operation', {
		id,
		file: {
			name: file.name,
			type: file.type,
			size: `${ ( file.size / 1024 ).toFixed( 2 ) }KB`,
		},
		resize: {
			width: resize.width,
			height: resize.height,
			crop: resize.crop,
		},
		smartCrop,
		addSuffix,
	} );
	debug.time( `vips-resize-${ id }` );

	const { buffer, width, height, originalWidth, originalHeight } =
		await getVipsWorker().resizeImage(
			id,
			await file.arrayBuffer(),
			file.type,
			resize,
			smartCrop
		);

	debug.timeEnd( `vips-resize-${ id }` );
	debug.log( 'VIPS resize complete', {
		id,
		originalDimensions: { width: originalWidth, height: originalHeight },
		newDimensions: { width, height },
		bufferSize: `${ ( ( buffer as ArrayBuffer ).byteLength / 1024 ).toFixed( 2 ) }KB`,
	} );

	let fileName = file.name;

	if ( addSuffix && ( originalWidth > width || originalHeight > height ) ) {
		const basename = getFileBasename( file.name );
		fileName = file.name.replace(
			basename,
			`${ basename }-${ width }x${ height }`
		);
		debug.log( 'Added dimension suffix to filename', {
			original: file.name,
			new: fileName,
		} );
	}

	const resultFile = new ImageFile(
		new File(
			[ new Blob( [ buffer as ArrayBuffer ], { type: file.type } ) ],
			fileName,
			{
				type: file.type,
			}
		),
		width,
		height,
		originalWidth,
		originalHeight
	);

	debug.log( 'Created ImageFile', {
		fileName,
		width,
		height,
		originalWidth,
		originalHeight,
	} );
	debug.groupEnd();

	return resultFile;
}

/**
 * Cancels all ongoing image operations for the given item.
 *
 * @param id Queue item ID to cancel operations for.
 * @return Whether any operation was cancelled.
 */
export async function vipsCancelOperations( id: QueueItemId ) {
	return getVipsWorker().cancelOperations( id );
}
