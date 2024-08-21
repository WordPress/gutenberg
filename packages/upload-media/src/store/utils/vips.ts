/**
 * External dependencies
 */
import { createWorkerFactory } from '@shopify/web-worker';

/**
 * WordPress dependencies
 */
import { getExtensionFromMimeType } from '@wordpress/mime';

/**
 * Internal dependencies
 */
import { ImageFile } from '../../imageFile';
import { getFileBasename } from '../../utils';
import type { ImageSizeCrop, QueueItemId } from '../types';

const createVipsWorker = createWorkerFactory(
	() => import( /* webpackChunkName: 'wp-vips' */ '@wordpress/vips' )
);
const vipsWorker = createVipsWorker();

export async function vipsConvertImageFormat(
	id: QueueItemId,
	file: File,
	type: string,
	quality: number,
	interlaced?: boolean
) {
	const buffer = await vipsWorker.convertImageFormat(
		id,
		await file.arrayBuffer(),
		file.type,
		type,
		quality,
		interlaced
	);
	const ext = getExtensionFromMimeType( type );
	const fileName = `${ getFileBasename( file.name ) }.${ ext }`;
	return new File( [ new Blob( [ buffer ] ) ], fileName, { type } );
}

export async function vipsCompressImage(
	id: QueueItemId,
	file: File,
	quality: number,
	interlaced?: boolean
) {
	const buffer = await vipsWorker.compressImage(
		id,
		await file.arrayBuffer(),
		file.type,
		quality,
		interlaced
	);
	return new File(
		[ new Blob( [ buffer ], { type: file.type } ) ],
		file.name,
		{ type: file.type }
	);
}

export async function vipsResizeImage(
	id: QueueItemId,
	file: File,
	resize: ImageSizeCrop,
	smartCrop: boolean,
	addSuffix: boolean
) {
	const { buffer, width, height, originalWidth, originalHeight } =
		await vipsWorker.resizeImage(
			id,
			await file.arrayBuffer(),
			file.type,
			resize,
			smartCrop
		);

	let fileName = file.name;

	if ( addSuffix && ( originalWidth > width || originalHeight > height ) ) {
		const basename = getFileBasename( file.name );
		fileName = file.name.replace(
			basename,
			`${ basename }-${ width }x${ height }`
		);
	}

	return new ImageFile(
		new File( [ new Blob( [ buffer ], { type: file.type } ) ], fileName, {
			type: file.type,
		} ),
		width,
		height,
		originalWidth,
		originalHeight
	);
}

/**
 * Cancels all ongoing image operations for the given item.
 *
 * @param id Queue item ID to cancel operations for.
 */
export async function vipsCancelOperations( id: QueueItemId ) {
	return vipsWorker.cancelOperations( id );
}
